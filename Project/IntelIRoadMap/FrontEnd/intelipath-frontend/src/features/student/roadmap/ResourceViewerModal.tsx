import { useEffect } from "react"
import { X, ArrowUpRight, YoutubeLogo, LinkSimple } from "@phosphor-icons/react"

export type ViewerResource = { title?: string; url: string }

/** Extract a YouTube video id from watch / youtu.be / embed / shorts URLs. */
export const getYouTubeId = (url: string): string | null => {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, "")
    if (host === "youtu.be") return u.pathname.slice(1) || null
    if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v")
      const parts = u.pathname.split("/")
      if (parts[1] === "embed" || parts[1] === "shorts") return parts[2] || null
    }
  } catch {
    /* not a URL */
  }
  return null
}

const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/**
 * Smart resource viewer. Videos (YouTube) play inline in the modal; everything
 * else can't be safely iframed (X-Frame-Options), so we show a clean preview
 * card that opens the real page in a new tab. The iframe only mounts while the
 * modal is open, so there's no lingering cost.
 */
export default function ResourceViewerModal({
  resource,
  onClose,
}: {
  resource: ViewerResource | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!resource) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [resource, onClose])

  if (!resource) return null

  const { url } = resource
  const ytId = getYouTubeId(url)
  const host = hostOf(url)
  const title = resource.title || host

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgb(0,0,0,0.35)] ring-1 ring-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${ytId ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}>
              {ytId ? <YoutubeLogo size={17} weight="fill" /> : <LinkSimple size={16} weight="bold" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold leading-tight text-slate-900">{title}</p>
              <p className="truncate text-[11px] text-slate-400">{host}</p>
            </div>
          </div>
          <button
            aria-label="Close resource"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Body */}
        {ytId ? (
          <div className="aspect-video w-full bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0`}
              title={title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <LinkSimple size={24} weight="bold" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-slate-900">{title}</p>
              <p className="mt-1 text-[12px] text-slate-500">
                {host} can't be embedded here — open it in a new tab to view.
              </p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-[13px] font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
            >
              Open resource
              <ArrowUpRight size={15} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
