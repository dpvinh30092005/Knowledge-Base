import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  DownloadSimple,
  FileArrowDown,
  MagnifyingGlass,
  Target,
} from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components"
import { SharedAppBackground, Skeleton, Spinner } from "@/components/ui"
import { useAuth } from "@/context"
import { ROUTES } from "@/shared"
import fptCoursesApi, {
  type FptCourseDetail,
  type FptCourseListItem,
} from "@/features/student/courses/fptCoursesApi"
import { toast } from "@/lib/toast"
import StudentHeader from "@/features/student/common/StudentHeader"

/** The roadmap's panel chrome, so a section here reads as the same surface as one there. */
const PANEL =
  "rounded-2xl bg-white/70 backdrop-blur-md ring-1 ring-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.06)]"

/** "13.0 MB" — students decide whether to download by size, not by byte count. */
function formatSize(bytes: number | null): string {
  if (!bytes) return ""
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

/**
 * Course lookup: search the subjects on your curriculum, read what each one teaches
 * (its CLOs) and download the material we hold for it.
 *
 * Search leads and the subjects sit in a grid, rather than a list beside a detail pane:
 * looking a subject up is the whole point of the page, and a grid gives the syllabus
 * text — which runs long — the full width once you pick one.
 *
 * The download button only appears for sessions we actually have a file for. Most
 * sessions have none — FLM publishes files for a minority of them — so the page treats
 * "no file" as ordinary rather than as an error.
 */
export function FptCoursesView() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<FptCourseListItem[]>([])
  const [query, setQuery] = useState("")
  /** null = every term. Terms are the curriculum's own ordering, so they filter well. */
  const [term, setTerm] = useState<number | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<FptCourseDetail | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  /** The subject whose detail failed, so a failed load doesn't read as a stuck spinner. */
  const [failed, setFailed] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  // Derived rather than its own state: "the detail on screen isn't the one selected yet"
  // is exactly what loading means here, and tracking it separately only invites the two
  // to disagree.
  const loadingDetail = !!selected && detail?.code !== selected && failed !== selected

  useEffect(() => {
    let alive = true
    fptCoursesApi
      .list()
      .then((rows) => alive && setCourses(rows))
      .catch(() => alive && toast.error("Could not load your subjects."))
      .finally(() => alive && setLoadingList(false))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!selected) return
    let alive = true
    fptCoursesApi
      .detail(selected)
      .then((d) => {
        if (!alive) return
        setDetail(d)
      })
      .catch(() => {
        if (!alive) return
        setFailed(selected)
        toast.error(`Could not load ${selected}.`)
      })
    return () => {
      alive = false
    }
  }, [selected])

  const terms = useMemo(
    () =>
      [...new Set(courses.map((c) => c.semester).filter((s): s is number => s !== null))].sort(
        (a, b) => a - b
      ),
    [courses]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.filter((c) => {
      if (term !== null && c.semester !== term) return false
      if (!q) return true
      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [courses, query, term])

  const passed = useMemo(() => courses.filter((c) => c.status === "PASSED").length, [courses])
  const files = detail?.sessions.filter((s) => s.downloadable) ?? []

  const download = async (materialId: string) => {
    setDownloading(materialId)
    try {
      // The link expires in ~2 minutes, so fetch it at click time and use it at once.
      const url = await fptCoursesApi.downloadLink(materialId)
      window.open(url, "_blank", "noopener")
    } catch {
      toast.error("That file isn't available right now.")
    } finally {
      setDownloading(null)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  const back = () => {
    setSelected(null)
    setDetail(null)
    setFailed(null)
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-transparent pb-20 pt-24">
      <SharedAppBackground />
      <StudentHeader
        user={user}
        onLogout={handleLogout}
        onOpenAiMentor={() => navigate(ROUTES.AI_MENTOR)}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-6">
        {!selected ? (
          <>
            {/* ── Search lead ──────────────────────────────── */}
            <div className="flex flex-col items-center gap-3 pt-4 text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                FPT coursework
              </span>
              <h1 className="max-w-2xl text-[38px] font-extrabold leading-[1.1] tracking-tight text-slate-900">
                Every subject on your curriculum, in one search box.
              </h1>
              <p className="max-w-xl text-[15px] leading-relaxed text-slate-500">
                What each one teaches, the outcomes it's marked against, and the files we hold for it.
              </p>

              <div className="relative mt-3 w-full max-w-2xl">
                <MagnifyingGlass
                  size={20}
                  weight="bold"
                  className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-orange-500"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by code, name or skill…"
                  className="w-full rounded-2xl border border-white/60 bg-white/80 py-4 pl-14 pr-5 text-[15px] text-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.06)] outline-none backdrop-blur-md transition-colors placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Terms are the curriculum's real sequence, so they earn being a filter. */}
              {terms.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                  <button
                    onClick={() => setTerm(null)}
                    className={`rounded-lg border px-2.5 py-1 text-[12px] font-bold transition-colors ${
                      term === null
                        ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                        : "border-slate-200 bg-white/70 text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                    }`}
                  >
                    All
                  </button>
                  {terms.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTerm(t)}
                      className={`rounded-lg border px-2.5 py-1 text-[12px] font-bold transition-colors ${
                        term === t
                          ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                          : "border-slate-200 bg-white/70 text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                      }`}
                    >
                      Term {t}
                    </button>
                  ))}
                </div>
              )}

              {!loadingList && courses.length > 0 && (
                <p className="mt-1 text-[12.5px] font-semibold text-slate-400">
                  <span className="tabular-nums text-slate-600">{courses.length}</span> subjects ·{" "}
                  <span className="tabular-nums text-slate-600">{passed}</span> passed
                </p>
              )}
            </div>

            {/* ── Subject grid ─────────────────────────────── */}
            {loadingList ? (
              // Six cards in the grid's own shape, so the real subjects land in place
              // instead of shoving a centred spinner out of the way.
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`${PANEL} flex flex-col gap-2 p-4`}>
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-14" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-16 text-center text-[13px] text-slate-400">
                {courses.length === 0
                  ? "No subjects yet for your curriculum."
                  : `Nothing matches “${query}”.`}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setSelected(c.code)}
                    className={`${PANEL} group flex flex-col items-start p-4 text-left transition-all hover:-translate-y-px hover:bg-white hover:shadow-[0_8px_28px_rgb(0,0,0,0.09)] active:scale-[0.99]`}
                  >
                    <div className="flex w-full items-center gap-2">
                      <span className="rounded-md bg-slate-100/80 px-1.5 py-0.5 font-mono text-[12px] font-bold text-slate-700">
                        {c.code}
                      </span>
                      {c.status === "PASSED" && (
                        <CheckCircle size={15} weight="fill" className="text-emerald-500" />
                      )}
                      <ArrowUpRight
                        size={15}
                        weight="bold"
                        className="ml-auto text-slate-300 transition-colors group-hover:text-orange-500"
                      />
                    </div>
                    <p className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800">
                      {c.name}
                    </p>
                    {c.semester !== null && (
                      <p className="mt-auto pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Term {c.semester}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ── Detail ─────────────────────────────────────── */
          <div className="flex flex-col gap-4">
            <button
              onClick={back}
              className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-bold text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-900"
            >
              <ArrowLeft size={14} weight="bold" />
              All subjects
            </button>

            {loadingDetail ? (
              <div className={`${PANEL} flex flex-col gap-3 p-5`}>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : !detail || detail.code !== selected ? (
              <div className={`${PANEL} py-16 text-center text-[13px] text-slate-400`}>
                {failed === selected ? `Couldn't load ${selected}.` : "Pick a subject to see what it teaches."}
              </div>
            ) : (
              <>
                <div className={`${PANEL} p-5`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[13px] font-bold text-orange-700">{detail.code}</span>
                    {detail.credits !== null && <Badge variant="info">{detail.credits} credits</Badge>}
                    {detail.prerequisite && (
                      <span className="text-[11.5px] text-slate-400">Requires {detail.prerequisite}</span>
                    )}
                  </div>
                  <h1 className="mt-1 text-[22px] font-bold tracking-tight text-slate-900">{detail.name}</h1>

                  {detail.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Target size={14} weight="duotone" className="text-slate-400" />
                      {detail.skills.map((s) => (
                        <Badge key={s} variant="default">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {detail.description && (
                    <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500">
                      {detail.description}
                    </p>
                  )}
                </div>

                {/* What you'll be able to do — the syllabus's own words. */}
                {detail.clos.length > 0 && (
                  <div className={`${PANEL} p-5`}>
                    <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-slate-800">
                      <BookOpen size={16} weight="duotone" className="text-orange-600" />
                      What you'll learn
                    </h2>
                    <ul className="space-y-2">
                      {detail.clos.map((c) => (
                        <li key={c.code} className="flex gap-2.5 text-[12.5px] leading-relaxed text-slate-600">
                          <span className="mt-px shrink-0 font-mono text-[11px] font-bold text-orange-600">
                            {c.code}
                          </span>
                          <span>{c.outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={`${PANEL} p-5`}>
                  <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-slate-800">
                    <FileArrowDown size={16} weight="duotone" className="text-emerald-600" />
                    Files
                    <span className="font-normal text-slate-400">({files.length})</span>
                  </h2>
                  {files.length === 0 ? (
                    <p className="py-6 text-center text-[12.5px] text-slate-400">
                      No files for this subject.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {files.map((f) => (
                        <li
                          key={f.id}
                          className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-[12.5px] font-medium text-slate-700">{f.title}</p>
                            {f.sizeBytes && (
                              <p className="text-[11px] text-slate-400">{formatSize(f.sizeBytes)}</p>
                            )}
                          </div>
                          <button
                            onClick={() => download(f.id)}
                            disabled={downloading === f.id}
                            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 px-3.5 py-1.5 text-[12px] font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                          >
                            {downloading === f.id ? (
                              <Spinner size={14} label="Preparing download" />
                            ) : (
                              <DownloadSimple size={14} weight="bold" />
                            )}
                            {downloading === f.id ? "Preparing…" : "Download"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Books and articles the syllabus points at; we don't host these. */}
                {detail.materials.length > 0 && (
                  <div className={`${PANEL} p-5`}>
                    <h2 className="mb-3 text-[13px] font-bold text-slate-800">Recommended reading</h2>
                    <ul className="space-y-1.5">
                      {detail.materials.map((m) => (
                        <li key={m.id} className="text-[12.5px] leading-relaxed text-slate-600">
                          {m.url ? (
                            <a
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-700 underline-offset-2 hover:underline"
                            >
                              {m.title}
                            </a>
                          ) : (
                            m.title
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
