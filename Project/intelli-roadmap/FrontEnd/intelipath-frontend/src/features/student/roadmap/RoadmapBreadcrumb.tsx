import { CaretRight, House } from "@phosphor-icons/react"
import type { RoadmapCrumb } from "../types"

interface RoadmapBreadcrumbProps {
  /** Outermost first: career, then each roadmap entered on the way down. */
  trail: RoadmapCrumb[]
  /** `null` returns to the career roadmap; a node id opens that sub-roadmap. */
  onNavigate: (nodeId: string | null) => void
}

/**
 * Where the student is, and the way back.
 *
 * <p>Once a language or framework is a roadmap you enter rather than a node you
 * pass, the screen can change completely under a single click. Without a trail
 * the only signals left are the title and the browser's back button — one of
 * which is easy to miss and the other of which leaves the page entirely.
 *
 * <p>The last crumb is not a link. It is where you already are, and offering to
 * navigate to it invites a click that does nothing.
 */
const RoadmapBreadcrumb = ({ trail, onNavigate }: RoadmapBreadcrumbProps) => {
  if (!trail || trail.length < 2) return null

  return (
    <nav
      aria-label="Roadmap location"
      className="pointer-events-auto flex max-w-[min(680px,calc(100vw-2rem))] items-center gap-1 overflow-x-auto rounded-full bg-white/85 px-3 py-1.5 shadow-[0_4px_20px_rgb(15,23,42,0.08)] ring-1 ring-white/60 backdrop-blur-md"
    >
      {trail.map((crumb, index) => {
        const isLast = index === trail.length - 1
        const label = crumb.name || "Roadmap"
        return (
          <span key={`${crumb.nodeId ?? "career"}-${index}`} className="flex shrink-0 items-center gap-1">
            {index > 0 && <CaretRight size={11} weight="bold" className="text-slate-300" />}
            {isLast ? (
              <span
                aria-current="page"
                className="max-w-[220px] truncate text-[11.5px] font-bold text-slate-900"
              >
                {label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(crumb.nodeId ?? null)}
                className="flex max-w-[180px] items-center gap-1 truncate rounded-full px-1.5 py-0.5 text-[11.5px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {index === 0 && <House size={11} weight="bold" className="shrink-0" />}
                <span className="truncate">{label}</span>
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export default RoadmapBreadcrumb
