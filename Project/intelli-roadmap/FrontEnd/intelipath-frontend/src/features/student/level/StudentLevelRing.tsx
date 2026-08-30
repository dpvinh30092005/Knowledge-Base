import { levelColors } from './levelPalette'
import type { StudentLevel } from '../types'

type Props = {
  level: StudentLevel | null
  /** Diameter of the avatar the ring is drawn around, in px. */
  size?: number
  className?: string
}

/** Stroke width of the arc, and how far the ring sits outside the avatar. */
const STROKE = 2.5
const GAP = 3

/**
 * The student's level, drawn around their avatar.
 *
 * <p><b>Why around the avatar and not beside it.</b> The level used to live in a
 * bar of its own pinned to the roadmap canvas — a second floating widget in a
 * corner already holding a breadcrumb and a tool rail, saying something about the
 * student rather than about the roadmap. It belongs on the thing that already
 * represents the student, which is their avatar, and it costs no canvas at all
 * there.
 *
 * <p><b>The arc is the coverage, not decoration.</b> It fills to
 * {@code heldCount / requiredCount} — 6 of 14 draws a ring 43% closed — so the
 * ring answers "how far along am I" and the colour answers "along what". A full
 * ring with no meaning would be a nicer-looking lie.
 *
 * <p><b>No counts, no arc.</b> A student whose level exists but whose required
 * count is zero or missing gets the coloured track alone rather than a ring
 * rounded up to something. Absence of a measurement is not zero progress, and it
 * is not full progress either.
 */
export default function StudentLevelRing({ level, size = 36, className = '' }: Props) {
  if (!level) return null

  const colors = levelColors(level.level)
  const held = level.heldCount
  const required = level.requiredCount
  const hasCounts = typeof held === 'number' && typeof required === 'number' && required > 0
  const fraction = hasCounts ? Math.max(0, Math.min(1, (held as number) / (required as number))) : null

  // The ring is drawn just outside the avatar, so the box is the avatar plus the
  // gap and the stroke on both sides.
  const box = size + (GAP + STROKE) * 2
  const radius = (box - STROKE) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <svg
      className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${className}`}
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      aria-hidden="true"
    >
      <circle
        cx={box / 2}
        cy={box / 2}
        r={radius}
        fill="none"
        stroke={colors.track}
        strokeWidth={STROKE}
      />
      {fraction !== null && (
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          stroke={colors.ring}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          // From the top, clockwise — the direction people read a dial.
          transform={`rotate(-90 ${box / 2} ${box / 2})`}
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
      )}
    </svg>
  )
}
