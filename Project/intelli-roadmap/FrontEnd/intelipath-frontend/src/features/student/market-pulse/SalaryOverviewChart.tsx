import { useMemo } from 'react';
import { SalaryBracket } from './marketPulse';

interface Props {
  data: SalaryBracket[];
}

/**
 * Light to dark as pay rises, so the ramp carries the ordering instead of just telling
 * one bracket from another. The backend returns the brackets already ordered low to high.
 */
const BAND_COLORS = ['#7fc9cf', '#4db6bd', '#26a0a8', '#00838f', '#006b75'];

/**
 * Salary spread as ordered horizontal bars.
 *
 * This was a donut, which fought the data: salary brackets run low to high, and a circle
 * throws that ordering away — you could not see where pay clusters without hovering every
 * slice, because there was no legend and the five teal shades were nearly identical.
 * Bars keep the brackets in their natural order, label themselves, and read at a glance.
 */
export default function SalaryOverviewChart({ data }: Props) {
  const brackets = useMemo(
    () =>
      (data || []).map((bracket) => ({
        category: String(bracket.category ?? ''),
        jobCount: Number(bracket.jobCount) || 0
      })),
    [data]
  );

  const total = brackets.reduce((sum, bracket) => sum + bracket.jobCount, 0);
  const maxCount = brackets.reduce((max, bracket) => Math.max(max, bracket.jobCount), 0);

  // The backend always returns all five brackets; treat "all zero" as no data.
  if (total === 0) {
    return (
      <p className="py-10 text-center text-[13px] font-medium text-slate-500">
        No data available at the moment.
      </p>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3.5">
        {brackets.map((bracket, index) => {
          const share = total ? (bracket.jobCount / total) * 100 : 0;
          const barPct = maxCount ? (bracket.jobCount / maxCount) * 100 : 0;
          const isTop = bracket.jobCount === maxCount && maxCount > 0;

          return (
            <div key={bracket.category || index} className="group">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span
                  className={`truncate text-[13px] ${
                    isTop ? 'font-bold text-slate-800' : 'font-semibold text-slate-600'
                  }`}
                >
                  {bracket.category}
                </span>
                <span className="shrink-0 text-[12px] tabular-nums text-slate-400">
                  <span className={isTop ? 'font-bold text-slate-700' : 'font-bold text-slate-500'}>
                    {bracket.jobCount}
                  </span>
                  <span className="ml-1.5">{share.toFixed(0)}%</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${barPct}%`,
                    backgroundColor: BAND_COLORS[index % BAND_COLORS.length]
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Negotiable postings are skipped when the brackets are counted, so the total here
          is smaller than the page's open-roles count. Say so rather than let it look wrong. */}
      <p className="mt-5 text-[11.5px] text-slate-400">
        Based on {total} {total === 1 ? 'posting' : 'postings'} with a stated salary; negotiable
        listings are not counted.
      </p>
    </div>
  );
}
