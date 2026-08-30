import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  BackgroundVariant
} from '@xyflow/react';
import { MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react';
import { Spinner } from '@/components/ui';
import '@xyflow/react/dist/style.css';
import CustomRoadmapNode from './CustomRoadmapNode';
import ExplainedEdge from './ExplainedEdge';
import { ClusterBoxNode, SkillStackNode, SpineWaypointNode, StageBandNode } from './RoadmapContainers';
import { ChoiceSatelliteNode } from './ChoiceSatelliteNode';
import { STAGE_ORDER, getStageColor, getStageLabel } from '../lib/stageColors';
import { studentDashboardService } from '../services';
import type { StudentRoadmap } from '../types';
import {
  serpentineLayout,
  TOPIC_H as SERP_TOPIC_H,
  CHILD_W as SERP_CHILD_W,
  CHILD_H as SERP_CHILD_H,
} from './roadmapSerpentineLayout';

const nodeTypes = {
  custom: CustomRoadmapNode,
  clusterBox: ClusterBoxNode,
  choiceSatellite: ChoiceSatelliteNode,
  skillStack: SkillStackNode,
  spineWaypoint: SpineWaypointNode,
  stageBand: StageBandNode,
};

// Every edge goes through this so the per-student ordering can explain itself
// on hover. Edges without a reason render as the plain smoothstep they were.
const edgeTypes = {
  explained: ExplainedEdge,
};

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 1.5;

/** Volume-bar style zoom control: drag the slider (or tap ±) to zoom the canvas. */
const ZoomSlider = () => {
  const { zoomTo } = useReactFlow();
  const { zoom } = useViewport();
  const step = 0.15;

  return (
    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 shadow-[0_4px_20px_rgb(0,0,0,0.06)] ring-1 ring-white/60 backdrop-blur-md">
      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => zoomTo(Math.max(MIN_ZOOM, zoom - step), { duration: 150 })}
        className="grid h-6 w-6 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <MagnifyingGlassMinus size={14} weight="bold" />
      </button>
      <input
        type="range"
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={0.01}
        value={zoom}
        onChange={(e) => zoomTo(Number(e.target.value), { duration: 0 })}
        className="roadmap-zoom-range h-1 w-24 cursor-pointer appearance-none rounded-full bg-slate-200"
        aria-label="Zoom level"
      />
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => zoomTo(Math.min(MAX_ZOOM, zoom + step), { duration: 150 })}
        className="grid h-6 w-6 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <MagnifyingGlassPlus size={14} weight="bold" />
      </button>
      <style>{`
        .roadmap-zoom-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:13px;height:13px;border-radius:9999px;background:#0f172a;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.35);}
        .roadmap-zoom-range::-moz-range-thumb{width:13px;height:13px;border:none;border-radius:9999px;background:#0f172a;cursor:pointer;}
      `}</style>
    </div>
  );
};

/**
 * Sticky stage indicator pinned to the top of the canvas. As the roadmap scrolls
 * up, the current stage's divider line stays under the nav; when the next stage's
 * band reaches the top it pushes the current one up and takes over (iOS-style
 * section headers).
 */
const StageStickyHeader = ({ bands }: { bands: { stage: string; minY: number; x: number; width: number }[] }) => {
  const { x: vpX, y, zoom } = useViewport();
  if (!bands.length) return null;

  const STICKY_H = 32;
  const topFlowY = -y / zoom; // flow-Y currently at the top edge of the canvas

  let i = 0;
  for (let k = 0; k < bands.length; k++) {
    if (bands[k].minY <= topFlowY) i = k;
    else break;
  }
  const current = bands[i];
  const next = bands[i + 1];

  // While the current stage's own divider is still on screen, its in-canvas label
  // shows it — no sticky needed. The sticky only appears once that divider has
  // scrolled above the top; then the next stage's divider pushes it up.
  const baseTop = current.minY * zoom + y;
  if (baseTop >= 0) return null;
  let top = 0;
  if (next) top = Math.min(0, next.minY * zoom + y - STICKY_H);

  const color = getStageColor(current.stage);
  const label = getStageLabel(current.stage);
  // Line matches the band's on-screen width/position (not the whole canvas).
  const lineLeft = current.x * zoom + vpX;
  const lineWidth = current.width * zoom;
  const labelLeft = Math.max(lineLeft + 24, 300); // match in-canvas label, clear the left stack

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10" style={{ transform: `translateY(${top}px)` }}>
      <div className="absolute top-0" style={{ left: lineLeft, width: lineWidth, height: 2, backgroundColor: color }} />
      <div
        className="absolute top-1 flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 shadow-[0_2px_10px_rgb(0,0,0,0.08)]"
        style={{ left: labelLeft }}
      >
        <span className="h-2.5 w-2.5 rounded-[3px] border border-black/40" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">{label}</span>
      </div>
    </div>
  );
};

interface RoadmapVectorGraphProps {
  onNodeClick: (nodeData: any, anchor?: { x: number; y: number }) => void;
  themeColor?: string;
  roadmapData: StudentRoadmap | null;
  optimisticStatusMap?: Record<string, string>;
  chosenNodeIds?: Set<string>;
  /** Ranked options per CHOOSE_ONE group, keyed by group node id. */
  choiceOptionsByGroup?: Record<string, RankedChoiceOption[]>;
  /** Commit a pick from an option chip. */
  onSelectOption?: (groupNodeId: string, optionNodeId: string) => void;
  /**
   * Nodes the server just marked from evidence the student supplied, in the
   * order they were applied.
   *
   * <p>Order matters: it becomes the stagger, so the ticks arrive as a wave.
   * Empty on every ordinary render — this is a one-shot announcement, not state.
   */
  justMarkedNodeIds?: string[];
  /**
   * Move a node's status straight from its card.
   *
   * <p>Passed down through node data because that is the only channel React Flow
   * gives a custom node type. Held in a ref inside the graph and exposed as a
   * stable wrapper, so a parent that re-creates the handler every render cannot
   * force the whole layout to be recomputed.
   */
  onSetNodeStatus?: (nodeId: string, status: string) => void;
}

/** The slice of the ranking endpoint the cluster actually draws. */
export interface RankedChoiceOption {
  nodeId: string;
  matchedSkills?: unknown[];
  /** True only for the top option of a DECISIVE ranking. */
  recommended?: boolean;
}

// ── Layout constants ────────────────────────────────────────────────
const TOPIC_W = 300;
const TOPIC_H = 66;
const CHILD_W = 236;
const CHILD_H = 58;
const CHILD_GAP_Y = 26; // room for the completion-date caption under finished nodes
const CLUSTER_GAP_Y = 40; // vertical gap between topic blocks (keeps spine tight)
const STAGE_GAP = 80; // extra gap inserted where the stage changes
const SIDE_GAP = 46; // spine edge → nearest sub-skill (hug the spine)
const INDENT = 22; // per-depth indent for nested sub-skills
const BOX_PAD = 14;
// Options cluster beside a CHOOSE_ONE group. Two columns because a single one
// makes nine languages a tall list the eye reads top-to-bottom — which is the
// sequence reading the cluster exists to kill.
const SAT_W = 208;
const SAT_COLS = 2;
const SAT_ROW_H = 32;
const SAT_HEAD_H = 26;
const SAT_PAD_Y = 20;
const BAND_PAD_X = 56;
const BAND_PAD_Y = 30;

const SPINE_STROKE = '#0f172a'; // slate-900 (black spine)
const BRANCH_STROKE = '#94a3b8'; // slate-400

/**
 * Stage-order spine × topic-cluster containers.
 *
 * Topics (level > 0) form a central vertical spine, re-ordered so stages run
 * Foundation → Job Ready top-to-bottom. Each topic's sub-skill subtree is laid
 * out to one side (alternating) inside a soft "cluster box", and every stage
 * gets a faint full-width band behind its topics.
 */
export const getDynamicLayoutedElements = (
  rawNodes: any[],
  rawEdges: any[],
  themeColor?: string,
  optimisticStatusMap: Record<string, string> = {},
  chosenNodeIds: Set<string> = new Set()
) => {
  if (!rawNodes.length) return { nodes: [], edges: [] };

  const byId = new Map<string, any>(rawNodes.map((n) => [n.id, n]));
  const hasExplicitTopLevelMain = rawNodes.some((n) => {
    const data = n.data;
    return Number(data?.relativeDepth ?? data?.depth ?? -1) === 0
      && String(data?.axis ?? 'MAIN').toUpperCase() === 'MAIN';
  });
  const isMain = (id: string) => {
    const data = byId.get(id)?.data;
    const semantic = String(data?.semanticType ?? '').toUpperCase();
    if (semantic) {
      // const legacySemanticGate = data?.parentTopic || semantic === 'TOPIC' || semantic === 'CHECKPOINT';
      // View-relative position determines the spine. A promoted sub-roadmap
      // child can be a SKILL and still be a first-class step in that roadmap.
      return Number(data?.relativeDepth ?? data?.depth ?? -1) === 0
        && (String(data?.axis ?? 'MAIN').toUpperCase() === 'MAIN' || !hasExplicitTopLevelMain);
    }
    return (data?.level ?? 0) > 0;
  };
  const stageOf = (id: string) => String(byId.get(id)?.data?.stage || '').toUpperCase();
  const stageIndex = (id: string) => {
    const i = STAGE_ORDER.indexOf(stageOf(id) as any);
    return i < 0 ? STAGE_ORDER.length : i;
  };

  // The tree hierarchy comes from data.parentNodeId (set by the service): a
  // child's parent is its topic / choose-one group. Spine order comes from the
  // spine edges (solid, no dash) chaining topic → topic.
  const explicitChildrenOf = (id: string): string[] =>
    rawNodes.filter((n) => n.data?.parentNodeId === id).map((n) => n.id);

  const spineNext: Record<string, string> = {};
  const spinePrev: Record<string, string> = {};
  rawEdges.forEach((e) => {
    const solid = e.style?.strokeDasharray === 'none' || e.style?.strokeWidth === 3;
    if (isMain(e.source) && isMain(e.target) && solid) {
      spineNext[e.source] = e.target;
      spinePrev[e.target] = e.source;
    }
  });

  const mainNodes = rawNodes.filter((n) => isMain(n.id)).map((n) => n.id);
  // Walk the spine chains from their roots to recover the authored order…
  const chainOrder: string[] = [];
  const seen = new Set<string>();
  mainNodes
    .filter((id) => !spinePrev[id])
    .forEach((root) => {
      let cur: string | undefined = root;
      while (cur && !seen.has(cur)) {
        chainOrder.push(cur);
        seen.add(cur);
        cur = spineNext[cur];
      }
    });
  mainNodes.forEach((id) => {
    if (!seen.has(id)) {
      chainOrder.push(id);
      seen.add(id);
    }
  });
  // …then a *stable* sort by stage keeps the authored order within each stage.
  const orderedTopics = chainOrder
    .map((id, i) => ({ id, i }))
    .sort((a, b) => stageIndex(a.id) - stageIndex(b.id) || a.i - b.i)
    .map((o) => o.id);

  // A sub-roadmap hides its breadcrumb root. Direct MAIN children become the
  // local spine, while direct BRANCH children lose their outside-view parent.
  // const legacyChildrenOf = explicitChildrenOf;
  // Keep those root-level branches in the graph by anchoring their cluster to
  // the local entry step; this is a view relationship, not a rewritten DB edge.
  const rootLevelBranches = (hasExplicitTopLevelMain ? rawNodes : [])
    .filter((n) => Number(n.data?.relativeDepth ?? n.data?.depth ?? -1) === 0)
    .filter((n) => String(n.data?.axis ?? 'MAIN').toUpperCase() === 'BRANCH')
    .filter((n) => !n.data?.parentNodeId)
    .map((n) => n.id);
  const entryTopicId = orderedTopics[0];
  const childrenOf = (id: string): string[] => [
    ...explicitChildrenOf(id),
    ...(id === entryTopicId ? rootLevelBranches : []),
  ];

  const placedNodes: any[] = [];
  const placedSet = new Set<string>();

  // Lay a list of child subtrees into one vertical column: y stacks downward,
  // nested sub-skills indent away from the spine (depth).
  const layoutColumn = (rootIds: string[], rootParent: string) => {
    const placed: { id: string; depth: number; y: number; parent: string }[] = [];
    let y = 0;
    let maxDepth = 0;
    const rec = (id: string, depth: number, parent: string) => {
      if (placedSet.has(id)) return;
      placed.push({ id, depth, y, parent });
      placedSet.add(id);
      maxDepth = Math.max(maxDepth, depth);
      y += CHILD_H + CHILD_GAP_Y;
      childrenOf(id).forEach((c) => rec(c, depth + 1, id));
    };
    rootIds.forEach((r) => rec(r, 0, rootParent));
    const height = placed.length ? y - CHILD_GAP_Y : 0;
    const width = placed.length ? CHILD_W + maxDepth * INDENT : 0;
    return { placed, height, width };
  };

  // Per-stage vertical extents, so we can draw a band behind each stage.
  const stageExtent: Record<string, { minY: number; maxY: number }> = {};
  const noteStage = (stage: string, top: number, bottom: number) => {
    if (!stage) return;
    const cur = stageExtent[stage] || { minY: Infinity, maxY: -Infinity };
    cur.minY = Math.min(cur.minY, top);
    cur.maxY = Math.max(cur.maxY, bottom);
    stageExtent[stage] = cur;
  };

  const clusterBoxes: any[] = [];
  const hierarchyEdges: { parentId: string; childId: string; side: 'left' | 'right'; nested: boolean }[] = [];
  let cursorY = 0;

  const mkBox = (id: string, x: number, y: number, w: number, h: number, stage: any, side: 'left' | 'right') => ({
    id,
    type: 'clusterBox',
    position: { x, y },
    data: { stage, side },
    style: { width: w, height: h, pointerEvents: 'none' },
    zIndex: -5,
    selectable: false,
    draggable: false,
    connectable: false,
    focusable: false,
  });

  orderedTopics.forEach((topicId, index) => {
    const topicNode = byId.get(topicId);
    const stage = topicNode?.data?.stage;
    const kids = childrenOf(topicId);

    // Balance sub-skills across both sides of the spine (even → right, odd → left)
    // so neither side sits empty and the block stays short.
    const R = layoutColumn(kids.filter((_, i) => i % 2 === 0), topicId);
    const L = layoutColumn(kids.filter((_, i) => i % 2 === 1), topicId);

    const blockHeight = Math.max(TOPIC_H, R.height, L.height);
    const topicY = cursorY + (blockHeight - TOPIC_H) / 2;

    // Topic (spine) node, centred on x = 0.
    placedNodes.push({ ...topicNode, position: { x: -TOPIC_W / 2, y: topicY } });
    placedSet.add(topicId); // so hierarchy edges from this topic to its children survive the placed-check

    // Right column hugs the spine's right edge.
    if (R.placed.length) {
      const childX0 = TOPIC_W / 2 + SIDE_GAP;
      const colTop = cursorY + (blockHeight - R.height) / 2;
      clusterBoxes.push(mkBox(`cluster-${topicId}-r`, childX0 - BOX_PAD, colTop - BOX_PAD, R.width + 2 * BOX_PAD, R.height + 2 * BOX_PAD, stage, 'right'));
      R.placed.forEach((p) => {
        placedNodes.push({ ...byId.get(p.id), position: { x: childX0 + p.depth * INDENT, y: colTop + p.y } });
        hierarchyEdges.push({ parentId: p.parent, childId: p.id, side: 'right', nested: p.depth > 0 });
      });
    }

    // Left column mirrors to the spine's left edge (depth grows leftward).
    if (L.placed.length) {
      const rightEdge = -(TOPIC_W / 2 + SIDE_GAP);
      const colTop = cursorY + (blockHeight - L.height) / 2;
      clusterBoxes.push(mkBox(`cluster-${topicId}-l`, rightEdge - L.width - BOX_PAD, colTop - BOX_PAD, L.width + 2 * BOX_PAD, L.height + 2 * BOX_PAD, stage, 'left'));
      L.placed.forEach((p) => {
        placedNodes.push({ ...byId.get(p.id), position: { x: rightEdge - CHILD_W - p.depth * INDENT, y: colTop + p.y } });
        hierarchyEdges.push({ parentId: p.parent, childId: p.id, side: 'left', nested: p.depth > 0 });
      });
    }

    noteStage(stageOf(topicId), cursorY, cursorY + blockHeight);
    // Extra breathing room when the next topic starts a new stage, so the stage
    // divider line never crowds a node.
    const next = orderedTopics[index + 1];
    const stageChanges = next && stageOf(next) !== stageOf(topicId);
    cursorY += blockHeight + CLUSTER_GAP_Y + (stageChanges ? STAGE_GAP : 0);
  });

  // Any node never reached by the spine/cluster walk (isolated) — stack below.
  rawNodes.forEach((n) => {
    if (!placedSet.has(n.id) && !isMain(n.id)) {
      placedNodes.push({ ...n, position: { x: -CHILD_W / 2, y: cursorY } });
      placedSet.add(n.id);
      cursorY += CHILD_H + CHILD_GAP_Y;
    }
  });

  // Content horizontal extent (real nodes only) → band width.
  const xs = placedNodes.map((n) => n.position.x);
  const rights = placedNodes.map(
    (n) => n.position.x + ((n.data?.level ?? 0) > 0 ? TOPIC_W : CHILD_W)
  );
  const contentMinX = Math.min(...xs, -TOPIC_W / 2);
  const contentMaxX = Math.max(...rights, TOPIC_W / 2);
  const bandX = contentMinX - BAND_PAD_X;
  const bandW = contentMaxX - contentMinX + 2 * BAND_PAD_X;

  // Bands are contiguous: each spans to the midpoint of the gap to its
  // neighbour, so the divider line sits centred in the (enlarged) stage gap with
  // breathing room on both sides and no white strip between stages.
  const presentStages = STAGE_ORDER.filter((s) => stageExtent[s]);
  const stageBands: any[] = presentStages.map((s, i) => {
    const ext = stageExtent[s];
    const prev = presentStages[i - 1];
    const nextStage = presentStages[i + 1];
    const top = prev ? (stageExtent[prev].maxY + ext.minY) / 2 : ext.minY - BAND_PAD_Y;
    const bottom = nextStage ? (ext.maxY + stageExtent[nextStage].minY) / 2 : ext.maxY + BAND_PAD_Y;
    return {
      id: `band-${s}`,
      type: 'stageBand',
      position: { x: bandX, y: top },
      data: { stage: s },
      style: {
        width: bandW,
        height: bottom - top,
        pointerEvents: 'none',
      },
      zIndex: -10,
      selectable: false,
      draggable: false,
      connectable: false,
      focusable: false,
    };
  });

  // ── Edges ──────────────────────────────────────────────────────────
  const edges: any[] = [];
  const pushEdge = (edge: any) => {
    if (edges.some((e) => e.id === edge.id)) return;
    edges.push(edge);
  };
  const statusOf = (id: string) => optimisticStatusMap[id] || byId.get(id)?.data?.status;
  const isActive = (a: string, b: string) => {
    const s = new Set([statusOf(a), statusOf(b)]);
    return s.has('current') || s.has('in_progress');
  };

  // The server sends one sentence per connection explaining why this student
  // gets this order. This layout builds its own geometry, so the sentences are
  // carried across by endpoint rather than by edge object — losing them would
  // leave the personalisation invisible again.
  const reasonFor = new Map<string, string>();
  rawEdges.forEach((e) => {
    if (e?.data?.reason) reasonFor.set(`${e.source}->${e.target}`, e.data.reason);
  });

  // Spine edges (topic → next topic in the ordered chain).
  for (let i = 0; i < orderedTopics.length - 1; i++) {
    const a = orderedTopics[i];
    const b = orderedTopics[i + 1];
    const reason = reasonFor.get(`${a}->${b}`);
    pushEdge({
      id: `spine-${a}-${b}`,
      source: a,
      target: b,
      // `explained` renders the same line plus a wide invisible hover target
      // carrying the reason; without a reason it is an ordinary smoothstep.
      type: reason ? 'explained' : 'smoothstep',
      sourceHandle: 's-bottom',
      targetHandle: 't-top',
      animated: false,
      data: reason ? { reason } : undefined,
      style: { stroke: SPINE_STROKE, strokeWidth: 3 },
    });
  }

  // Hierarchy edges (parent → child), dashed. Top-level children leave the spine
  // sideways toward their column; nested sub-skills chain straight down.
  hierarchyEdges.forEach(({ parentId, childId, side, nested }) => {
    if (!parentId || !placedSet.has(childId) || !placedSet.has(parentId)) return;
    const src = nested ? 's-bottom' : side === 'right' ? 's-right' : 's-left';
    const tgt = nested ? 't-top' : side === 'right' ? 't-left' : 't-right';
    pushEdge({
      id: `h-${parentId}-${childId}`,
      source: parentId,
      target: childId,
      type: nested ? 'smoothstep' : 'default',
      sourceHandle: src,
      targetHandle: tgt,
      style: { stroke: BRANCH_STROKE, strokeWidth: 1.25, strokeDasharray: '4 3' },
    });
  });

  // Final data decoration: theme, optimistic status, chosen ring, isolation.
  const finalReal = placedNodes.map((node) => {
    const currentStatus = optimisticStatusMap[node.id] || node.data.status;
    const hasFixedPosition = node.data.positionX != null && node.data.positionY != null;
    return {
      ...node,
      position: hasFixedPosition
        ? { x: Number(node.data.positionX), y: Number(node.data.positionY) }
        : node.position,
      data: {
        ...node.data,
        themeColor,
        status: currentStatus,
        isChosen: chosenNodeIds.has(node.id),
        isIsolated: false,
      },
    };
  });

  // Stage dividers + cluster boxes paint underneath the real nodes.
  return { nodes: [...stageBands, ...clusterBoxes, ...finalReal], edges };
};

/**
 * Serpentine layout: the same ordering, folded into rows.
 *
 * Kept beside {@link getDynamicLayoutedElements} rather than replacing it — the
 * mentor editor still uses that one to seed node positions, and the stored
 * positions were authored against its single-column geometry.
 *
 * The full-width stage bands are deliberately dropped here. A band asserts "this
 * horizontal strip is one stage", which holds only while the path runs
 * top-to-bottom; once it folds, one strip carries two stages travelling in
 * opposite directions and the band would be actively misleading. Stage stays
 * legible through each node's own colour.
 */
export const getSerpentineLayoutedElements = (
  rawNodes: any[],
  rawEdges: any[],
  themeColor?: string,
  optimisticStatusMap: Record<string, string> = {},
  chosenNodeIds: Set<string> = new Set(),
  choiceOptionsByGroup: Record<string, RankedChoiceOption[]> = {},
  onSelectOption?: (groupNodeId: string, optionNodeId: string) => void,
  justMarkedNodeIds: string[] = [],
  onSetNodeStatus?: (nodeId: string, status: string) => void
) => {
  if (!rawNodes.length) return { nodes: [], edges: [] };

  const byId = new Map<string, any>(rawNodes.map((n) => [n.id, n]));
  const hasExplicitTopLevelMain = rawNodes.some((n) => {
    const data = n.data;
    return Number(data?.relativeDepth ?? data?.depth ?? -1) === 0
      && String(data?.axis ?? 'MAIN').toUpperCase() === 'MAIN';
  });
  const isMain = (id: string) => {
    const data = byId.get(id)?.data;
    const semantic = String(data?.semanticType ?? '').toUpperCase();
    if (semantic) {
      // const legacySemanticGate = data?.parentTopic || semantic === 'TOPIC' || semantic === 'CHECKPOINT';
      return Number(data?.relativeDepth ?? data?.depth ?? -1) === 0
        && (String(data?.axis ?? 'MAIN').toUpperCase() === 'MAIN' || !hasExplicitTopLevelMain);
    }
    return (data?.level ?? 0) > 0;
  };
  const stageOf = (id: string) => String(byId.get(id)?.data?.stage || '').toUpperCase();
  const stageIndex = (id: string) => {
    const i = STAGE_ORDER.indexOf(stageOf(id) as any);
    return i < 0 ? STAGE_ORDER.length : i;
  };
  const explicitChildrenOf = (id: string): string[] =>
    rawNodes.filter((n) => n.data?.parentNodeId === id).map((n) => n.id);

  const spineNext: Record<string, string> = {};
  const spinePrev: Record<string, string> = {};
  rawEdges.forEach((e) => {
    const solid = e.style?.strokeDasharray === 'none' || e.style?.strokeWidth === 3;
    if (isMain(e.source) && isMain(e.target) && solid) {
      spineNext[e.source] = e.target;
      spinePrev[e.target] = e.source;
    }
  });

  const mainNodes = rawNodes.filter((n) => isMain(n.id)).map((n) => n.id);
  const chainOrder: string[] = [];
  const seen = new Set<string>();
  mainNodes
    .filter((id) => !spinePrev[id])
    .forEach((root) => {
      let cur: string | undefined = root;
      while (cur && !seen.has(cur)) {
        chainOrder.push(cur);
        seen.add(cur);
        cur = spineNext[cur];
      }
    });
  mainNodes.forEach((id) => {
    if (!seen.has(id)) {
      chainOrder.push(id);
      seen.add(id);
    }
  });
  const orderedTopics = chainOrder
    .map((id, i) => ({ id, i }))
    .sort((a, b) => stageIndex(a.id) - stageIndex(b.id) || a.i - b.i)
    .map((o) => o.id);

  // const legacyChildrenOf = explicitChildrenOf;
  const rootLevelBranches = (hasExplicitTopLevelMain ? rawNodes : [])
    .filter((n) => Number(n.data?.relativeDepth ?? n.data?.depth ?? -1) === 0)
    .filter((n) => String(n.data?.axis ?? 'MAIN').toUpperCase() === 'BRANCH')
    .filter((n) => !n.data?.parentNodeId)
    .map((n) => n.id);
  const entryTopicId = orderedTopics[0];
  const childrenOf = (id: string): string[] => [
    ...explicitChildrenOf(id),
    ...(id === entryTopicId ? rootLevelBranches : []),
  ];

  const reasonFor = new Map<string, string>();
  rawEdges.forEach((e) => {
    if (e?.data?.reason) reasonFor.set(`${e.source}->${e.target}`, e.data.reason);
  });

  const laid = serpentineLayout(orderedTopics, childrenOf, byId, reasonFor, {
    optionsByGroup: choiceOptionsByGroup,
    chosenNodeIds,
    onSelect: onSelectOption,
  });

  // Anything the spine walk never reached still has to appear. Dropping a node
  // silently is worse than placing it plainly, so leftovers go in a block below.
  const leftovers = rawNodes.filter((n) => !laid.placedIds.has(n.id));
  const bottomY = laid.nodes.length
    ? Math.max(...laid.nodes.map((n: any) => n.position.y)) + SERP_TOPIC_H + 120
    : 0;
  leftovers.forEach((n, i) => {
    laid.nodes.push({
      ...n,
      position: {
        x: (i % laid.perRow) * (SERP_CHILD_W + 40),
        y: bottomY + Math.floor(i / laid.perRow) * (SERP_CHILD_H + 26),
      },
    });
  });

  // Position in the marking wave. Built from the array's own order rather than
  // from the layout's, because the server applied them in a sequence and that
  // sequence is the one worth replaying — a wave that follows the canvas's
  // reading order would imply the marks were worked out top to bottom.
  const markOrderById = new Map<string, number>();
  justMarkedNodeIds.forEach((id, i) => markOrderById.set(String(id), i));

  const finalNodes = laid.nodes.map((node: any) => ({
    ...node,
    data: {
      ...node.data,
      themeColor,
      status: optimisticStatusMap[node.id] || node.data?.status,
      isChosen: chosenNodeIds.has(node.id),
      isIsolated: false,
      justMarked: markOrderById.has(node.id),
      markOrder: markOrderById.get(node.id),
      onSetStatus: onSetNodeStatus,
    },
  }));

  return { nodes: finalNodes, edges: laid.edges };
};

export const RoadmapVectorGraph = ({ onNodeClick, themeColor, roadmapData, optimisticStatusMap = {}, chosenNodeIds, choiceOptionsByGroup, onSelectOption, justMarkedNodeIds, onSetNodeStatus }: RoadmapVectorGraphProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  // The handler goes into node data, and node data is rebuilt by the layout
  // effect. A parent that re-creates its callback each render would therefore
  // re-lay-out the whole board on every render; the ref keeps the identity the
  // effect sees constant while the call still reaches the current handler.
  const setStatusRef = useRef(onSetNodeStatus);
  setStatusRef.current = onSetNodeStatus;
  const stableSetStatus = useCallback((nodeId: string, status: string) => {
    setStatusRef.current?.(nodeId, status);
  }, []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [translateExtent, setTranslateExtent] = useState<[[number, number], [number, number]] | undefined>(undefined);
  const rfRef = useRef<any>(null);
  const hasCenteredRef = useRef(false);

  // Re-centre only when the roadmap itself changes (career switch), never on the
  // optimistic re-renders that fire while a student marks nodes complete.
  useEffect(() => {
    hasCenteredRef.current = false;
  }, [roadmapData?.targetCareerRole]);

  // Bounding box of the whole roadmap (+ padding) so panning can't drift off into
  // empty space forever. Bands/boxes carry explicit width/height; real nodes use
  // their known sizes.
  const computeExtent = (layoutedNodes: any[]): [[number, number], [number, number]] | undefined => {
    if (!layoutedNodes.length) return undefined;
    const dim = (n: any) => {
      if (n.type === 'custom') {
        const big = (n.data?.level ?? 0) > 0;
        return { w: big ? TOPIC_W : CHILD_W, h: big ? TOPIC_H : CHILD_H };
      }
      return { w: Number(n.style?.width) || 0, h: Number(n.style?.height) || 0 };
    };
    const minX = Math.min(...layoutedNodes.map((n) => n.position.x));
    const minY = Math.min(...layoutedNodes.map((n) => n.position.y));
    const maxX = Math.max(...layoutedNodes.map((n) => n.position.x + dim(n).w));
    const maxY = Math.max(...layoutedNodes.map((n) => n.position.y + dim(n).h));
    return [
      [minX - 320, minY - 90],
      [maxX + 320, maxY + 200],
    ];
  };

  // Horizontally centres the laid-out roadmap in the canvas, anchored near the top.
  const centerRoadmap = (layoutedNodes: any[]) => {
    if (!rfRef.current || !layoutedNodes.length) return;
    const real = layoutedNodes.filter((n) => n.type === 'custom');
    if (!real.length) return;
    const flowEl = document.querySelector('.roadmap-flow') as HTMLElement | null;
    const width = flowEl ? flowEl.clientWidth : 800;
    const zoom = 0.7;
    const minX = Math.min(...real.map((n) => n.position.x));
    const maxX = Math.max(...real.map((n) => n.position.x + ((n.data?.level ?? 0) > 0 ? TOPIC_W : CHILD_W)));
    const contentCenter = (minX + maxX) / 2;
    rfRef.current.setViewport({ x: width / 2 - contentCenter * zoom, y: 60, zoom });
    // Only mark as centred once it actually happened. buildRoadmapGraph is now
    // synchronous, so this effect can run before ReactFlow's onInit sets rfRef;
    // if we flagged "centred" before rfRef existed, onInit would then skip it and
    // the roadmap would stay stuck at the left edge.
    hasCenteredRef.current = true;
  };

  useEffect(() => {
    if (!roadmapData || !roadmapData.nodes || roadmapData.nodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }
    try {
      // Build the graph from the SAME payload the page already fetched
      // (kept on `_rawResponse`) instead of hitting the roadmap endpoint again.
      const { nodes: rawNodes, edges: rawEdges } = studentDashboardService.buildRoadmapGraph(roadmapData._rawResponse);
      // The spine layout, which is what a roadmap looks like: a path you follow,
      // with sub-skills branching off it. A banded card grid was tried here and
      // was wrong — it read as a dashboard. The length that made the spine
      // unusable was never the shape's fault, it was 538 nodes on one canvas;
      // the server-side visibility filter cuts that to ~103 across 13 topics,
      // which the spine handles fine.
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getSerpentineLayoutedElements(rawNodes, rawEdges, themeColor, optimisticStatusMap, chosenNodeIds,
          choiceOptionsByGroup, onSelectOption, justMarkedNodeIds, stableSetStatus);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setTranslateExtent(computeExtent(layoutedNodes));
      if (!hasCenteredRef.current) {
        // Wait a frame so the flow has its final width before centring. If the
        // ReactFlow instance isn't ready yet (sync data can beat onInit), this
        // no-ops and onInit centres once it mounts; the flag is set inside
        // centerRoadmap only on a real centring.
        requestAnimationFrame(() => centerRoadmap(layoutedNodes));
      }
    } catch (e) {
      console.error("Graph layout error", e);
    }
  }, [roadmapData, setNodes, setEdges, themeColor, optimisticStatusMap, chosenNodeIds, choiceOptionsByGroup, onSelectOption, justMarkedNodeIds, stableSetStatus]);

  const handleNodeClick = (event: React.MouseEvent, node: any) => {
    if (node.type !== 'custom') return;
    onNodeClick(node.data, { x: event.clientX, y: event.clientY });
  };

  // Stage bands (flow coords), ascending — feeds the sticky stage header.
  const stageBands = useMemo(
    () =>
      nodes
        .filter((n) => n.type === 'stageBand')
        .map((n) => ({
          stage: n.data.stage as string,
          minY: n.position.y,
          x: n.position.x,
          width: Number(n.style?.width) || 0,
        }))
        .sort((a, b) => a.minY - b.minY),
    [nodes]
  );

  if (!roadmapData) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Spinner size={32} className="text-[#00838f]" label="Drafting your roadmap" />
          <p className="text-[14px] font-bold">Drafting your Roadmap...</p>
        </div>
      </div>
    );
  }

  if (roadmapData && (!roadmapData.nodes || roadmapData.nodes.length === 0)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-transparent p-8">
        <div className="max-w-sm text-center text-slate-400">
          <p className="text-[15px] font-bold text-slate-600">Your roadmap is being prepared</p>
          <p className="mt-1.5 text-[13px]">No milestones to show yet. Pick or change your target career to generate one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-transparent">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={(instance) => {
          rfRef.current = instance;
          // Nodes may already be laid out (sync data can beat onInit); centre now
          // that the instance exists. centerRoadmap sets the flag on success.
          if (!hasCenteredRef.current && nodes.length) {
            requestAnimationFrame(() => centerRoadmap(nodes));
          }
        }}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        translateExtent={translateExtent}
        panOnScroll
        zoomOnScroll={false}
        panOnDrag={false}
        nodesDraggable={false}
        proOptions={{ hideAttribution: true }}
        className="roadmap-flow"
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.5} color="#cbd5e1" />
        <StageStickyHeader bands={stageBands} />
        <ZoomSlider />
      </ReactFlow>
    </div>
  );
};
