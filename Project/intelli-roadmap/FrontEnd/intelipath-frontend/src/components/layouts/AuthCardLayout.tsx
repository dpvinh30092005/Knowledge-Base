import type { ReactNode } from "react"
import { Logo } from "@/components"

type AuthCardLayoutProps = {
  children: ReactNode
}

/**
 * Standalone, centered auth shell — the same clean card-on-muted look as the
 * login popup, so the forgot/reset pages read as one flow with sign-in.
 *
 * Uses its own faded grid (rather than the app-wide SharedAppBackground) because
 * a full-bleed grid behind a single small card, on a page with nothing else on
 * it, reads as empty graph paper. Fading it toward the edges and glowing behind
 * the card gives the one piece of content on the page somewhere to sit.
 */
export default function AuthCardLayout({ children }: AuthCardLayoutProps) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-slate-50 p-6 text-[#0a0a0a] md:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: "20px 30px",
          maskImage:
            "radial-gradient(ellipse 640px 560px at 50% 45%, black 25%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 640px 560px at 50% 45%, black 25%, transparent 72%)"
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/15 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-5">
        <Logo className="self-center" />
        {children}
      </div>
    </div>
  )
}
