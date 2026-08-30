import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface OnboardingShellProps {
  /** 1-based index of the current step. */
  step: number
  totalSteps: number
  stepLabels: string[]
  title: string
  subtitle: string
  error?: string
  children: ReactNode
  /**
   * The second pane. When given, the card widens and the body splits in two on `md` and
   * up — short fields on the left, the thing you browse on the right — so a long list stops
   * pushing the fields that feed it off the top of the screen. Below `md` the two stack.
   */
  aside?: ReactNode
  wide?: boolean
  onBack?: () => void
  backLabel?: string
  onNext: () => void
  nextLabel: string
  nextLoading?: boolean
  nextDisabled?: boolean
}

/**
 * The onboarding dialog (Personal → Academic → Skills).
 *
 * Deliberately the same object as the sign-in dialog — same scrim, width, rounding, padding
 * and title scale — because it is the same kind of moment for the same person. Earlier
 * versions of this were a full-bleed surface twice that size in an indigo accent the rest of
 * the app does not use, which read as a different product's form.
 */
export default function OnboardingShell({
  step,
  totalSteps,
  stepLabels,
  title,
  subtitle,
  error,
  children,
  aside,
  wide = false,
  onBack,
  backLabel = 'Back',
  onNext,
  nextLabel,
  nextLoading = false,
  nextDisabled = false,
}: OnboardingShellProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center overflow-y-auto px-4 py-8">
      {/* Same scrim the sign-in dialog uses. The app stays visible behind it, dimmed —
          which is what tells you this is a step on top of InteliPath rather than a blank
          form belonging to nothing. */}
      <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px]" />

      {/* Sized and padded like that dialog too: same rounding, same p-6, same title scale.
          It is the same kind of moment for the same person and should not arrive twice the
          size in a different accent. */}
      <div
        // A split step takes a fixed height rather than sizing to its content: the pane on
        // the right is filtered, and a card that shrinks to fit "Product & Design" then
        // jumps back for "All" makes the whole dialog twitch under the cursor. Capped to
        // the viewport either way, so the footer never ends up below the fold — which is
        // what made the buttons look like they had disappeared.
        className={`animate-fade-in relative z-10 m-auto flex w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl ${
          aside
            ? 'h-[min(calc(100dvh-4rem),640px)] max-w-3xl'
            : wide
              ? 'h-[min(calc(100dvh-4rem),760px)] max-w-4xl'
              : 'max-h-[calc(100dvh-4rem)] max-w-md'
        }`}
      >
      {/* ── Header + stepper ─────────────────────────────────── */}
          <header className="shrink-0 px-6 pb-4 pt-6">
            <div className="flex items-end justify-between gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-900">
                Step {step} / {totalSteps}
              </span>
              <span className="text-[11px] font-medium text-slate-400">{stepLabels[step - 1]}</span>
            </div>

            <div className="mt-2 flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i < step ? 'bg-slate-900' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{subtitle}</p>
          </header>

          {/* ── Body ─────────────────────────────────────────────── */}
          {error && (
            <div className="mx-6 mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* min-h-0 on the scrolling regions: a flex child defaults to min-height:auto and
              would refuse to shrink below its content, defeating the cap above. */}
          {aside ? (
            <div className="grid min-h-0 flex-1 md:grid-cols-2">
              <div className="min-h-0 overflow-y-auto px-6 pb-5">{children}</div>
              {/* Tinted and ruled off so the browsing pane reads as a different job from the
                  fields, the way the sign-in card sets its form against its panel. */}
              <div className="min-h-0 overflow-y-auto border-t border-slate-100 bg-slate-50/60 px-6 py-5 md:border-l md:border-t-0 md:py-0">
                {aside}
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">{children}</div>
          )}

          {/* ── Footer ───────────────────────────────────────────── */}
          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-6 py-3.5">
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-900 ${
                onBack ? '' : 'pointer-events-none opacity-0'
              }`}
            >
              <ArrowLeft size={15} /> {backLabel}
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={nextLoading || nextDisabled}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-950"
            >
              {nextLabel}
              {!nextLoading && <ArrowRight size={15} />}
            </button>
        </footer>
      </div>
    </div>
  )
}
