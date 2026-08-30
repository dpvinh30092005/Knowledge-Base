function sparklinePath(points, width, height) {
  if (points.length < 2) return '';
  const max = Math.max(...points), min = Math.min(...points);
  const span = max - min, stepX = width / (points.length - 1);
  return points.map((v, i) => {
    const x = i * stepX;
    const y = span === 0 ? height / 2 : height - ((v - min) / span) * height;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}
function rank(data) {
  return data.map(s => {
    const points = [...s.dataPoints].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(p=>Number(p.jobsNeeded)||0);
    const total = points.reduce((a,b)=>a+b,0);
    const latest = points.length ? points[points.length-1] : 0;
    const previous = points.length > 1 ? points[points.length-2] : null;
    return { skillName: s.skillName, total, latest,
      changePct: previous === null || previous === 0 ? null : Math.round(((latest-previous)/previous)*100),
      points };
  }).filter(s=>s.total>0).sort((a,b)=>b.total-a.total);
}
const mk = (name, arr) => ({ skillName: name, dataPoints: arr.map(([d,v])=>({date:d,jobsNeeded:v})) });
// Real rows pulled from skill_trends
const data = [
  mk('AI',[['2026-07-13',2],['2026-07-17',2],['2026-07-20',8],['2026-07-27',4]]),
  mk('Python',[['2026-07-06',2],['2026-07-13',1],['2026-07-17',2],['2026-07-20',6],['2026-07-27',3]]),
  mk('Agile',[['2026-07-13',4],['2026-07-17',1],['2026-07-20',2],['2026-07-27',6]]),
  mk('Computer Vision',[['2026-07-20',5]]),
  mk('DevOps',[['2026-07-13',3],['2026-07-17',2],['2026-07-20',1]]),
  mk('Flat',[['2026-07-13',3],['2026-07-20',3]]),
  mk('ZeroPrev',[['2026-07-13',0],['2026-07-20',4]]),
];
const r = rank(data);
const max = r[0].total;
console.log('rank | skill            | total | bar%  | trend  | spark');
for (const [i,s] of r.entries()) {
  const bar = Math.max((s.total/max)*100, 4).toFixed(0);
  const trend = s.changePct === null ? 'New' : `${s.changePct > 0 ? '+' : ''}${s.changePct}%`;
  const sp = sparklinePath(s.points, 56, 20);
  console.log(`${String(i+1).padStart(4)} | ${s.skillName.padEnd(16)} | ${String(s.total).padStart(5)} | ${bar.padStart(4)}% | ${trend.padStart(6)} | ${sp || '(single point → no line, bar still shows)'}`);
}
