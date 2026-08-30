import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

/**
 * A placeholder shaped like the thing that is loading.
 *
 * The sheen sweeps rather than the whole block pulsing: a pulse dims its neighbours in
 * lockstep, which makes a page of several skeletons throb, while a sweep reads as one
 * surface catching light and leaves the page calm.
 *
 * Give it the size of the content it stands in for — a skeleton of the wrong shape
 * causes a visible jump when the data lands, which costs more than it saved.
 */
export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    aria-hidden="true"
    className={cn(
      "relative isolate overflow-hidden rounded-md bg-slate-200/60",
      // The sheen is a child layer, so `className` can still recolour the block itself.
      "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent",
      "after:motion-safe:animate-[shimmer_1.8s_infinite]",
      // Held still, the sweep would sit frozen mid-block and read as a real edge.
      "after:motion-reduce:hidden",
      className
    )}
    {...props}
  />
)

export default Skeleton
