import type { SeniorityLevel } from '../types'

/**
 * One colour per rung of the seniority ladder.
 *
 * <p><b>A ladder, not a verdict.</b> The temptation with six bands is red at the
 * bottom and green at the top, which turns a measurement of coverage into a
 * judgement of the person — and BEGINNER is what an honest first assessment
 * returns for most first-year students. So the scale runs cool to warm through a
 * single continuous hue path (slate → sky → indigo → violet → amber → emerald):
 * every band reads as a place on a road, none reads as a warning.
 *
 * <p><b>Stated once, used everywhere.</b> The badge on the dashboard and the ring
 * around the avatar have to agree — two places inventing their own greens is how
 * a colour stops meaning anything. {@link LEVEL_COLORS} is the only source.
 *
 * <p>`ring` is a raw CSS colour rather than a Tailwind class because it is passed
 * to an SVG `stroke`, which class names cannot reach.
 */
export type LevelColors = {
  /** SVG stroke for the progress arc. */
  ring: string
  /** Track behind the arc — the same hue, far lighter. */
  track: string
  /** Tailwind classes for a small text chip: background, text, hairline. */
  chip: string
  /** Tailwind text colour for the level word on a white surface. */
  text: string
}

export const LEVEL_COLORS: Record<SeniorityLevel, LevelColors> = {
  BEGINNER: {
    ring: '#64748b',
    track: '#e2e8f0',
    chip: 'bg-slate-100 text-slate-700 ring-slate-900/[0.06]',
    text: 'text-slate-700',
  },
  FRESHER: {
    ring: '#0ea5e9',
    track: '#e0f2fe',
    chip: 'bg-sky-50 text-sky-700 ring-sky-600/15',
    text: 'text-sky-700',
  },
  JUNIOR: {
    ring: '#6366f1',
    track: '#e0e7ff',
    chip: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
    text: 'text-indigo-700',
  },
  MID: {
    ring: '#8b5cf6',
    track: '#ede9fe',
    chip: 'bg-violet-50 text-violet-700 ring-violet-600/15',
    text: 'text-violet-700',
  },
  SENIOR: {
    ring: '#f59e0b',
    track: '#fef3c7',
    chip: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    text: 'text-amber-800',
  },
  EXPERT: {
    ring: '#10b981',
    track: '#d1fae5',
    chip: 'bg-emerald-50 text-emerald-800 ring-emerald-600/15',
    text: 'text-emerald-800',
  },
}

/**
 * The palette for a level, with a neutral fallback.
 *
 * <p>Falls back rather than throwing: the backend owns the band names, and a
 * seventh one added there must not blank out the header on the next deploy.
 */
export function levelColors(level: SeniorityLevel | null | undefined): LevelColors {
  return (level && LEVEL_COLORS[level]) || LEVEL_COLORS.BEGINNER
}
