import { cn } from "@/lib/utils"

type SpinnerProps = {
  /** Pixel size of the square the ring is drawn in. */
  size?: number
  className?: string
  /** Announced to screen readers; omit only when adjacent text already says it. */
  label?: string
}

/**
 * The app's only inline spinner: buttons, small panels, anywhere a skeleton can't
 * describe the shape of what's coming.
 *
 * When the shape IS known, prefer <Skeleton> — a spinner says "wait" while a skeleton
 * says what it is waiting for, and reads as faster for the same delay.
 */
export function Spinner({ size = 16, className, label = "Loading" }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        // motion-safe only: with reduced motion the ring still reads as a "busy" mark,
        // it just holds still rather than spinning.
        className="motion-safe:animate-spin"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.18" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

export default Spinner
