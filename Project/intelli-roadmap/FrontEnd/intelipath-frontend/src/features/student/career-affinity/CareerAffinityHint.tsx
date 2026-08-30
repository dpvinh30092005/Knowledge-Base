import { Compass } from 'lucide-react'
import type { CareerAffinity } from '../types'

type Props = {
  affinities: CareerAffinity[]
  /** Switch to a career. Omitted where switching is not offered. */
  onChoose?: (careerId: string) => void
  className?: string
}

/**
 * The careers whose essential skills the student already overlaps.
 *
 * <p>Framed as a suggestion, and it stays one: choosing is an action the student
 * takes here, never something that happens to them. In arXiv 2109.02554 more
 * than 99% of career pairs sit between 0.8 and 1.0 and the cut-off came from
 * eye-balling the distribution — nowhere near firm enough to pick a career for
 * someone, but firm enough to order the list and show the count behind it.
 *
 * <p>So no percentage is displayed. "9 of 29 essential skills" is checkable;
 * "73% match" is a number the student has no way to argue with.
 */
export default function CareerAffinityHint({ affinities, onChoose, className = '' }: Props) {
  const ranked = affinities.filter(a => (a.required ?? 0) > 0 && (a.matched ?? 0) > 0)
  if (ranked.length === 0) return null

  return (
    <div className={className}>
      <p className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
        <Compass className="size-3" />
        Closest to your skills
      </p>
      <ul className="flex flex-col gap-1">
        {ranked.map(affinity => (
          <li key={affinity.careerId}>
            <button
              type="button"
              disabled={!onChoose || Boolean(affinity.current)}
              onClick={() => onChoose?.(affinity.careerId)}
              title={affinity.topMatchingSkills?.length
                ? `You have ${affinity.topMatchingSkills.join(', ')}`
                : undefined}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left ring-1 ring-black/[0.04] transition-colors ${
                affinity.current
                  ? 'bg-slate-100'
                  : onChoose
                    ? 'bg-slate-50 hover:bg-slate-100'
                    : 'bg-slate-50'
              }`}
            >
              <span className="flex-1 truncate text-[11px] font-semibold text-slate-800">
                {affinity.careerName}
              </span>
              {affinity.current && (
                <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-500">
                  Current
                </span>
              )}
              <span className="shrink-0 text-[10px] font-bold tabular-nums text-slate-500">
                {affinity.matched}/{affinity.required}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[10px] text-slate-400">
        Counted over each career's essential skills — the same set your level is graded on.
      </p>
    </div>
  )
}
