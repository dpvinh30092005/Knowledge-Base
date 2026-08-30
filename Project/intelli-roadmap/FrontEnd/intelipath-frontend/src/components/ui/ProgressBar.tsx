import { useEffect, useRef, useState } from "react"
import { onLoadingChange } from "@/shared/api"

/**
 * The app's progress bar, in its two mounts.
 *
 * One look, one place on screen: a hairline at the top edge. Two bars in two colours at
 * two edges — which is what this replaced — read as two unrelated things going wrong.
 *
 * `GlobalProgressBar` follows in-flight requests and is mounted once, in App.
 * `RouteProgressBar` is the same bar as a standalone element, for the waits that have no
 * request behind them to count (restoring a session, resolving a lazy route).
 */

/** Brand teal, fading to a lighter tint so the bar has direction rather than just length. */
const TRACK =
  "h-full origin-left rounded-r-full bg-gradient-to-r from-[#00838f] to-[#5eead4] shadow-[0_0_12px_rgba(0,131,143,0.45)]"

const SHELL = "pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2.5px] overflow-hidden"

export default function GlobalProgressBar() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const cb = (loading: boolean) => setActive(loading)
    onLoadingChange.add(cb)
    return () => {
      onLoadingChange.delete(cb)
    }
  }, [])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    if (active) {
      setVisible(true)
      setProgress(8)
      // Ease toward 90% and stop. The remaining 10% is deliberate: the bar must never
      // reach the end before the response does, or it promises an arrival it can't make.
      const tick = window.setInterval(() => {
        setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.14))
      }, 220)
      return () => clearInterval(tick)
    }

    // Only finish a bar that actually started, so a cached response that resolves in one
    // frame doesn't flash a full bar for no reason.
    setProgress((p) => (p > 0 ? 100 : 0))
    timers.current.push(window.setTimeout(() => setVisible(false), 260))
    timers.current.push(window.setTimeout(() => setProgress(0), 500))
  }, [active])

  return (
    <div className={SHELL} aria-hidden="true">
      <div
        className={`${TRACK} transition-[transform,opacity] duration-200 ease-out`}
        style={{ transform: `scaleX(${progress / 100})`, opacity: visible ? 1 : 0 }}
      />
    </div>
  )
}

/**
 * Indeterminate variant: shows for as long as it is mounted. There is no percentage to
 * report here, so it sweeps instead of filling — an honest "still working", not a
 * fake measurement.
 */
export function RouteProgressBar() {
  return (
    <div className={SHELL} aria-label="Loading" role="status">
      <div className={`${TRACK} w-1/3 motion-safe:animate-[route-progress_1.2s_ease-in-out_infinite]`} />
      <style>{`
        @keyframes route-progress {
          0%   { transform: translateX(-110%); }
          70%  { transform: translateX(260%); }
          100% { transform: translateX(260%); }
        }
      `}</style>
    </div>
  )
}
