import { Gauge, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { levelColors } from './levelPalette'
import type { StudentLevel } from '../types'

type Props = {
  level: StudentLevel | null
  /** Opens the assessment modal. useStudentSetup already exposes openAssessment(). */
  onTakeAssessment?: () => void
  className?: string
}

/**
 * The student's level, wherever they are actually looking.
 *
 * Until now `getLevel()` was called from exactly one place — a filter chip on
 * Market Pulse — so the number the assessment computed was invisible on the
 * dashboard and on the roadmap it reorders. This also carries the only entry
 * point to retaking: `useStudentSetup` has exposed `openAssessment()` all along
 * and no button called it, so the modal's own promise ("you can take it any time
 * from your dashboard") was not true.
 */
export default function StudentLevelBadge({ level, onTakeAssessment, className = '' }: Props) {
  const held = level?.heldCount
  const required = level?.requiredCount
  const hasCounts = typeof held === 'number' && typeof required === 'number' && required > 0

  if (!level) {
    // No level is a real state, not a zero. Offer the assessment instead of a badge.
    return onTakeAssessment ? (
      <Button size="sm" variant="outline" className={`gap-2 ${className}`} onClick={onTakeAssessment}>
        <Gauge className="size-4" />
        Assess my level
      </Button>
    ) : null
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Six bands off the shared palette, not three Badge variants. The variants
          collapsed BEGINNER with FRESHER and JUNIOR with MID, so half the ladder
          was invisible — and they could not agree with the ring in the header,
          which is drawn from a raw stroke colour a class name cannot reach. */}
      {/* The band name alone. The gauge icon that used to sit here said nothing
          the word did not already say, and the colour carries the rung. */}
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ring-1 ${levelColors(level.level).chip}`}
      >
        {level.level}
      </span>
      {hasCounts && (
        // slate-600, not the old slate-500 with a `dark:slate-400` partner. On a
        // dark-mode machine that partner applied and left this line near 3:1 on
        // white — under the AA floor for text this size, and visibly washed out
        // next to the badge. Measured after the fix: 7.58:1.
        <span className="text-xs text-slate-600">
          {held} of {required} required skills
        </span>
      )}
      {onTakeAssessment && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={onTakeAssessment}
        >
          <RefreshCw className="size-3.5" />
          Reassess
        </Button>
      )}
    </div>
  )
}
