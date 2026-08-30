const fs = require('fs');

function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!inputPath || !outputPath) {
    console.error('Usage: node ua-tour-analyze.js <input.json> <output.json>');
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const nodes = raw.nodes || raw.fileNodes || [];
  const edges = raw.edges || [];
  const layers = raw.layers || [];

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const fanIn = new Map();
  const fanOut = new Map();
  for (const n of nodes) { fanIn.set(n.id, 0); fanOut.set(n.id, 0); }
  for (const e of edges) {
    if (fanOut.has(e.source)) fanOut.set(e.source, fanOut.get(e.source) + 1);
    if (fanIn.has(e.target)) fanIn.set(e.target, fanIn.get(e.target) + 1);
  }

  const fanInRanking = nodes.map(n => ({ id: n.id, fanIn: fanIn.get(n.id) || 0, name: n.name }))
    .sort((a, b) => b.fanIn - a.fanIn).slice(0, 20);
  const fanOutRanking = nodes.map(n => ({ id: n.id, fanOut: fanOut.get(n.id) || 0, name: n.name }))
    .sort((a, b) => b.fanOut - a.fanOut).slice(0, 20);

  // thresholds
  const fanOutVals = nodes.map(n => fanOut.get(n.id) || 0).sort((a,b)=>a-b);
  const fanInVals = nodes.map(n => fanIn.get(n.id) || 0).sort((a,b)=>a-b);
  const pct = (arr, p) => arr[Math.floor(arr.length * p)] || 0;
  const fanOutTop10 = pct(fanOutVals, 0.9);
  const fanInBottom25 = pct(fanInVals, 0.25);

  const entryFilenames = new Set(['index.ts','index.js','main.ts','main.js','app.ts','app.js','server.ts','server.js','mod.rs','main.go','main.py','main.rs','manage.py','app.py','wsgi.py','asgi.py','run.py','__main__.py','Application.java','Main.java','Program.cs','config.ru','index.php','App.swift','Application.kt','main.cpp','main.c']);

  function depth(filePath) {
    if (!filePath) return 99;
    return filePath.split('/').filter(Boolean).length;
  }

  const entryCandidates = [];
  for (const n of nodes) {
    let score = 0;
    const fp = n.filePath || '';
    const nm = n.name || '';
    if (n.type === 'document') {
      if (/^README\.md$/i.test(nm) && depth(fp) <= 1) score += 5;
      else if (/\.md$/i.test(nm) && depth(fp) <= 1) score += 2;
    } else {
      if (entryFilenames.has(nm)) score += 3;
      if (depth(fp) <= 2) score += 1;
      if ((fanOut.get(n.id) || 0) >= fanOutTop10 && fanOutTop10 > 0) score += 1;
      if ((fanIn.get(n.id) || 0) <= fanInBottom25) score += 1;
    }
    if (score > 0) entryCandidates.push({ id: n.id, score, name: n.name, summary: n.summary });
  }
  entryCandidates.sort((a, b) => b.score - a.score);
  const entryPointCandidates = entryCandidates.slice(0, 5);

  // BFS from top code (non-document) entry point
  const topCodeEntry = entryCandidates.find(c => nodeMap.get(c.id).type !== 'document');
  const adjacency = new Map();
  for (const n of nodes) adjacency.set(n.id, []);
  for (const e of edges) {
    if ((e.type === 'imports' || e.type === 'calls') && adjacency.has(e.source)) {
      adjacency.get(e.source).push(e.target);
    }
  }
  const bfsTraversal = { startNode: null, order: [], depthMap: {}, byDepth: {} };
  if (topCodeEntry) {
    const start = topCodeEntry.id;
    bfsTraversal.startNode = start;
    const visited = new Set([start]);
    const queue = [[start, 0]];
    let qi = 0;
    while (qi < queue.length) {
      const [cur, d] = queue[qi++];
      bfsTraversal.order.push(cur);
      bfsTraversal.depthMap[cur] = d;
      if (!bfsTraversal.byDepth[d]) bfsTraversal.byDepth[d] = [];
      bfsTraversal.byDepth[d].push(cur);
      const neighbors = adjacency.get(cur) || [];
      for (const nb of neighbors) {
        if (!visited.has(nb) && nodeMap.has(nb)) {
          visited.add(nb);
          queue.push([nb, d + 1]);
        }
      }
    }
  }

  const nonCodeFiles = { documentation: [], infrastructure: [], data: [], config: [] };
  for (const n of nodes) {
    const entry = { id: n.id, name: n.name, summary: n.summary };
    if (n.type === 'document') nonCodeFiles.documentation.push({ ...entry, type: n.type });
    else if (['service', 'pipeline', 'resource'].includes(n.type)) nonCodeFiles.infrastructure.push({ ...entry, type: n.type });
    else if (['table', 'schema', 'endpoint'].includes(n.type)) nonCodeFiles.data.push({ ...entry, type: n.type });
    else if (n.type === 'config') nonCodeFiles.config.push({ ...entry, type: n.type });
  }

  // Clusters: bidirectional relationships
  const edgeSet = new Set(edges.map(e => `${e.source}|${e.target}|${e.type}`));
  const biPairs = [];
  for (const e of edges) {
    if (e.type !== 'imports' && e.type !== 'calls') continue;
    const reverseKey = `${e.target}|${e.source}|${e.type}`;
    if (edgeSet.has(reverseKey) && e.source < e.target) {
      biPairs.push([e.source, e.target]);
    }
  }
  // union-find style clustering
  const clusterMap = new Map(); // node -> cluster index
  const clusters = [];
  for (const [a, b] of biPairs) {
    let ca = clusterMap.get(a), cb = clusterMap.get(b);
    if (ca === undefined && cb === undefined) {
      const idx = clusters.length;
      clusters.push(new Set([a, b]));
      clusterMap.set(a, idx); clusterMap.set(b, idx);
    } else if (ca !== undefined && cb === undefined) {
      clusters[ca].add(b); clusterMap.set(b, ca);
    } else if (ca === undefined && cb !== undefined) {
      clusters[cb].add(a); clusterMap.set(a, cb);
    } else if (ca !== cb) {
      for (const x of clusters[cb]) { clusters[ca].add(x); clusterMap.set(x, ca); }
      clusters[cb] = new Set();
    }
  }
  const edgeCountBetween = (setArr) => {
    const s = new Set(setArr);
    let cnt = 0;
    for (const e of edges) if (s.has(e.source) && s.has(e.target)) cnt++;
    return cnt;
  };
  let clusterResults = clusters
    .filter(c => c.size >= 2 && c.size <= 5)
    .map(c => {
      const arr = [...c];
      return { nodes: arr, edgeCount: edgeCountBetween(arr) };
    })
    .sort((a, b) => b.edgeCount - a.edgeCount)
    .slice(0, 10);

  const layerList = { count: layers.length, list: layers.map(l => ({ id: l.id, name: l.name, description: l.description })) };

  const nodeSummaryIndex = {};
  for (const n of nodes) nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary };

  const result = {
    scriptCompleted: true,
    entryPointCandidates,
    fanInRanking,
    fanOutRanking,
    bfsTraversal,
    nonCodeFiles,
    clusters: clusterResults,
    layers: layerList,
    nodeSummaryIndex,
    totalNodes: nodes.length,
    totalEdges: edges.length,
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log('Done');
}

try {
  main();
} catch (err) {
  console.error(err.stack || String(err));
  process.exit(1);
}
