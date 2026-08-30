import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, Sparkle } from 'lucide-react';
import { SkillTrend } from './marketPulse';

interface Props {
  data: SkillTrend[];
}

/**
 * How many rows are visible before the student asks for the rest. The list is laid out in
 * two columns, so ten fills both evenly and the toggle only appears if the API ever widens.
 */
const COLLAPSED_COUNT = 10;

interface RankedSkill {
  skillName: string;
  total: number;
  latest: number;
  /** Percent change from the previous reading; null when there is nothing to compare against. */
  changePct: number | null;
  points: number[];
}

/** Builds the sparkline path. A flat mid-line is used when every reading is identical. */
function sparklinePath(points: number[], width: number, height: number): string {
  if (points.length < 2) return '';
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min;
  const stepX = width / (points.length - 1);

  return points
    .map((value, index) => {
      const x = index * stepX;
      const y = span === 0 ? height / 2 : height - ((value - min) / span) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function SkillRow({
  skill,
  rank,
  maxTotal
}: {
  skill: RankedSkill;
  rank: number;
  maxTotal: number;
}) {
  const barPct = maxTotal ? Math.max((skill.total / maxTotal) * 100, 4) : 0;
  const isNew = skill.changePct === null;
  const rising = (skill.changePct ?? 0) > 0;
  const falling = (skill.changePct ?? 0) < 0;

  return (
    <div className="group flex items-center gap-3 py-2.5">
      <span className="w-4 shrink-0 text-right text-[12px] font-bold tabular-nums text-slate-300">
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span
            title={skill.skillName}
            className="truncate text-[13.5px] font-semibold text-slate-800"
          >
            {skill.skillName}
          </span>
          <span className="shrink-0 text-[12px] font-bold tabular-nums text-slate-500">
            {skill.total}
            <span className="ml-1 font-medium text-slate-400">
              {skill.total === 1 ? 'job' : 'jobs'}
            </span>
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900/[0.06]">
          <div
            className="h-full rounded-full bg-[#00838f] transition-all duration-500 group-hover:bg-[#006b75]"
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>

      {/* Sparkline — only meaningful once there are two readings */}
      <div className="w-11 shrink-0">
        {skill.points.length > 1 ? (
          <svg viewBox="0 0 44 18" className="h-[18px] w-11 overflow-visible" aria-hidden="true">
            <path
              d={sparklinePath(skill.points, 44, 18)}
              fill="none"
              stroke={falling ? '#e11d48' : '#00838f'}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.7}
            />
          </svg>
        ) : (
          <span className="block h-[18px]" />
        )}
      </div>

      <div className="w-[54px] shrink-0 text-right">
        {isNew ? (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
            <Sparkle size={10} strokeWidth={2.5} />
            New
          </span>
        ) : skill.changePct === 0 ? (
          <span className="inline-flex items-center gap-0.5 text-[11.5px] font-bold text-slate-400">
            <Minus size={11} strokeWidth={3} />
            0%
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-0.5 text-[11.5px] font-bold tabular-nums ${
              rising ? 'text-emerald-600' : 'text-rose-500'
            }`}
          >
            {rising ? (
              <ArrowUpRight size={12} strokeWidth={3} />
            ) : (
              <ArrowDownRight size={12} strokeWidth={3} />
            )}
            {Math.abs(skill.changePct as number)}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Skill demand as a ranked leaderboard rather than a multi-line chart.
 *
 * The series behind this are short, sparse and ragged — skills start on different weeks,
 * skip weeks, and some have a single reading. Drawn as overlapping lines that produced
 * fragmented paths, invisible single-point skills, and a colour per skill that ran out
 * after five and had no legend to decode it.
 *
 * A row per skill sidesteps all of it: the name sits next to its own bar, so nothing needs
 * a legend or a unique colour; a one-reading skill still renders; and ragged dates stop
 * mattering because each sparkline only ever plots its own series. Two columns keep the
 * rows short enough to read across at full page width.
 */
export default function TrendingSkillsChart({ data }: Props) {
  const [expanded, setExpanded] = useState(false);

  const ranked = useMemo<RankedSkill[]>(() => {
    return (data || [])
      .map((skill) => {
        const points = [...(skill.dataPoints || [])]
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((point) => Number(point.jobsNeeded) || 0);

        const total = points.reduce((sum, value) => sum + value, 0);
        const latest = points.length ? points[points.length - 1] : 0;
        const previous = points.length > 1 ? points[points.length - 2] : null;

        return {
          skillName: String(skill.skillName ?? 'Unknown'),
          total,
          latest,
          changePct:
            previous === null || previous === 0
              ? null
              : Math.round(((latest - previous) / previous) * 100),
          points
        };
      })
      .filter((skill) => skill.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [data]);

  const maxTotal = ranked.length ? ranked[0].total : 0;
  const visible = expanded ? ranked : ranked.slice(0, COLLAPSED_COUNT);
  const half = Math.ceil(visible.length / 2);
  const columns = [visible.slice(0, half), visible.slice(half)];

  if (ranked.length === 0) {
    return (
      <p className="py-10 text-center text-[13px] font-medium text-slate-500">
        No data available at the moment.
      </p>
    );
  }

  return (
    <div className="w-full">
      <div className="grid gap-x-12 md:grid-cols-2">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="divide-y divide-slate-900/[0.05]">
            {column.map((skill, rowIndex) => (
              <SkillRow
                key={skill.skillName}
                skill={skill}
                rank={columnIndex * half + rowIndex + 1}
                maxTotal={maxTotal}
              />
            ))}
          </div>
        ))}
      </div>

      {ranked.length > COLLAPSED_COUNT && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 text-[12.5px] font-bold text-[#00838f] transition-colors hover:text-[#006b75]"
        >
          {expanded ? 'Show less' : `Show all ${ranked.length} skills`}
        </button>
      )}
    </div>
  );
}
