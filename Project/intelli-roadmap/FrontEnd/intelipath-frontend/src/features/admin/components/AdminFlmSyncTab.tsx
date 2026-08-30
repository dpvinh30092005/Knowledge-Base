import { useEffect, useRef, useState } from "react"
import {
  ArrowClockwise,
  BookOpen,
  CheckCircle,
  CloudArrowUp,
  DownloadSimple,
  GraduationCap,
  Info,
  LockKey,
  Warning,
} from "@phosphor-icons/react"
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components"
import adminApi, { type FlmSyncStatus, type MirrorStatus } from "@/features/admin/api/adminApi"
import { toast } from "@/lib/toast"

// Legacy autocomplete prefixes — only a hint now; the curriculum id drives discovery
// (combos + electives) so this stays empty unless someone needs the old fallback.
const LEGACY_PREFIXES = "PRO,PRF,PRN,CSD,DBI,SWE,SWD,SWT,SWR,SWP,PRJ,MAD,WED,IOT,LAB,OSG,NWC,SEG"
const POLL_MS = 4000
const RUNNING = new Set(["pending", "running"])

const MIRROR_RUNNING = new Set(["pending", "running"])

/** "419 MB" — admins care about the quota, not the exact byte count. */
function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  return `${Math.round(bytes / 1024 ** 2)} MB`
}

/**
 * Copies the synced syllabi's files into our own storage, so students download from us
 * and the FPT-only rule can actually withhold them.
 *
 * Split from the sync above because it is a different job with different failure modes:
 * it needs no cookie (the sources are public) and it moves hundreds of MB, so it runs in
 * the background and is polled.
 */
function MirrorMaterialsCard() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<MirrorStatus | null>(null)
  const [starting, setStarting] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const running = starting || (!!status && MIRROR_RUNNING.has(status.state))
  const done = status?.state === "done"
  const errored = status?.state === "error"

  useEffect(() => {
    if (!jobId) return
    let alive = true

    const tick = async () => {
      try {
        const next = await adminApi.getMaterialMirrorStatus(jobId)
        if (!alive) return
        setStatus(next)
        if (next.state === "done") {
          toast.success(`Stored ${next.summary?.mirrored ?? 0} files. Students download from us now.`)
          return
        }
        if (next.state === "error") {
          toast.error(next.error || "The mirror failed.")
          return
        }
        timer.current = setTimeout(tick, POLL_MS)
      } catch {
        if (alive) toast.error("Lost contact with the mirror job.")
      }
    }
    timer.current = setTimeout(tick, POLL_MS)

    return () => {
      alive = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [jobId])

  const start = async () => {
    setStarting(true)
    setStatus(null)
    setJobId(null)
    try {
      const { jobId: newJob } = await adminApi.startMaterialMirror()
      setJobId(newJob)
    } catch {
      toast.error("Could not start the mirror.")
    } finally {
      setStarting(false)
    }
  }

  const pct = status && status.total > 0 ? Math.round((status.done / status.total) * 100) : running ? 6 : 0

  return (
    <Card className="overflow-hidden lg:col-span-5">
      <CardHeader className="flex-row items-center gap-3 border-b border-slate-100 p-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-black/5">
          <CloudArrowUp size={19} weight="duotone" />
        </div>
        <div>
          <CardTitle className="text-base">Store course materials</CardTitle>
          <CardDescription>
            Keeps our own copy of each file, so students download from us and only FPT accounts can.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          <Info size={14} weight="duotone" className="mt-0.5 shrink-0" />
          <span>
            Run this after a sync. Many files fail because FLM's own download handler returns an
            error for them — that is expected and not something this run can fix.
          </span>
        </p>

        <Button variant="brand" className="w-full gap-2" disabled={running} onClick={start}>
          {running ? (
            <>
              <ArrowClockwise size={16} weight="bold" className="animate-spin" /> Storing files…
            </>
          ) : (
            <>
              <CloudArrowUp size={16} weight="bold" /> Store files
            </>
          )}
        </Button>

        {(running || status) && (
          <>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="font-semibold text-slate-600">
                  {errored ? "Failed" : status && status.total > 0 ? `${status.done} / ${status.total} files` : "Working…"}
                </span>
                <Badge variant={errored ? "destructive" : done ? "success" : "info"}>
                  {status?.state ?? "starting"}
                </Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    errored ? "bg-rose-500" : done ? "bg-emerald-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${errored ? 100 : pct}%` }}
                />
              </div>
            </div>

            {status?.message && !errored && <p className="text-[12.5px] text-slate-500">{status.message}</p>}
            {errored && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">{status?.error}</p>
            )}

            {done && status?.summary && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Stored", String(status.summary.mirrored)],
                  ["Unavailable", String(status.summary.failed)],
                  ["Skipped", String(status.summary.skipped)],
                  ["Size", formatBytes(status.summary.bytes)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 py-2.5 text-center">
                    <p className="font-display text-xl font-semibold text-slate-900">{value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Admin-only FLM sync. The admin pastes a live FLM session cookie plus the SE
 * curriculum id (for per-term semesters) and/or subject-code prefixes (for syllabi),
 * then pulls fresh course data. The scrape runs async on the backend; we poll for
 * progress and show the import summary. The cookie is sent once and cleared from the
 * form on submit — it is never stored client-side beyond the request.
 *
 * Storing the files themselves is the separate step below.
 */
export function AdminFlmSyncTab() {
  const [cookie, setCookie] = useState("")
  const [curriculumCode, setCurriculumCode] = useState("")
  const [curid, setCurid] = useState("")
  const [prefixes, setPrefixes] = useState("")
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<FlmSyncStatus | null>(null)
  const [starting, setStarting] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const running = starting || (!!status && RUNNING.has(status.state))

  // Poll while a job is active; stop on the terminal imported/error states.
  useEffect(() => {
    if (!jobId) return
    let alive = true

    const tick = async () => {
      try {
        const next = await adminApi.getFlmSyncStatus(jobId)
        if (!alive) return
        setStatus(next)
        if (next.state === "imported") {
          toast.success("FLM data imported. Roadmaps now reflect the fresh curriculum.")
          return
        }
        if (next.state === "error") {
          toast.error(next.error || "The FLM sync failed.")
          return
        }
        timer.current = setTimeout(tick, POLL_MS)
      } catch {
        if (alive) toast.error("Lost contact with the sync job.")
      }
    }
    timer.current = setTimeout(tick, POLL_MS)

    return () => {
      alive = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [jobId])

  const start = async () => {
    if (!cookie.trim()) {
      toast.error("Paste an FLM cookie first.")
      return
    }
    if (!curriculumCode.trim()) {
      toast.error("Enter the curriculum code (e.g. BIT_SE_K21B).")
      return
    }
    if (!curid.trim() && !prefixes.trim()) {
      toast.error("Provide a curriculum id and/or subject prefixes.")
      return
    }
    setStarting(true)
    setStatus(null)
    setJobId(null)
    try {
      const { jobId: newJob } = await adminApi.startFlmSync({
        cookie: cookie.trim(),
        curriculumCode: curriculumCode.trim(),
        curid: curid.trim() || undefined,
        prefixes: prefixes.trim() || undefined,
      })
      setCookie("") // don't keep the secret around after it's been sent
      setJobId(newJob)
    } catch {
      toast.error("Could not start the sync. Check the AI service is reachable.")
    } finally {
      setStarting(false)
    }
  }

  const pct = status && status.total > 0 ? Math.round((status.done / status.total) * 100) : running ? 6 : 0
  const done = status?.state === "imported"
  const errored = status?.state === "error"

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* ── Form ─────────────────────────────────────────────── */}
      <Card className="overflow-hidden lg:col-span-3">
        <CardHeader className="flex-row items-center gap-3 border-b border-slate-100 p-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-black/5">
            <GraduationCap size={19} weight="duotone" />
          </div>
          <div>
            <CardTitle className="text-base">Pull FPT curriculum from FLM</CardTitle>
            <CardDescription>Refreshes subjects, semesters, skill coverage and lesson resources.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <LockKey size={13} weight="duotone" /> FLM session cookie
            </label>
            <textarea
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              disabled={running}
              rows={3}
              placeholder="Paste the full Cookie header from a logged-in flm.fpt.edu.vn request…"
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[12px] text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 disabled:bg-slate-50 disabled:text-slate-400"
            />
            <p className="mt-1 flex items-start gap-1.5 text-[11.5px] text-slate-400">
              <Info size={13} weight="duotone" className="mt-0.5 shrink-0" />
              Used once to authenticate the scrape, then cleared. Never stored or logged.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Curriculum code
            </label>
            <Input
              value={curriculumCode}
              onChange={(e) => setCurriculumCode(e.target.value.toUpperCase())}
              disabled={running}
              placeholder="e.g. BIT_SE_K21B"
            />
            <p className="mt-1 text-[11.5px] text-slate-400">
              Identifies the cohort/program. Program, khóa (K) and batch are parsed from it — versions never overwrite each other.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Curriculum id (curid)
              </label>
              <Input
                value={curid}
                onChange={(e) => setCurid(e.target.value)}
                disabled={running}
                placeholder="e.g. 2941"
                inputMode="numeric"
              />
              <p className="mt-1 text-[11.5px] text-slate-400">Pulls every subject in the curriculum — including combos &amp; electives — with its term. This is all you need.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Subject prefixes <span className="font-medium normal-case text-slate-400">(legacy, optional)</span>
              </label>
              <Input
                value={prefixes}
                onChange={(e) => setPrefixes(e.target.value)}
                disabled={running}
                placeholder={LEGACY_PREFIXES}
              />
              <p className="mt-1 text-[11.5px] text-slate-400">Leave empty. Old autocomplete fallback for when no curriculum id is available.</p>
            </div>
          </div>

          <Button variant="brand" className="w-full gap-2" disabled={running} onClick={start}>
            {running ? (
              <>
                <ArrowClockwise size={16} weight="bold" className="animate-spin" /> Syncing…
              </>
            ) : (
              <>
                <DownloadSimple size={16} weight="bold" /> Pull data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Progress / result ────────────────────────────────── */}
      <Card className="overflow-hidden lg:col-span-2">
        <CardHeader className="flex-row items-center gap-3 border-b border-slate-100 p-4">
          <div className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset ring-black/5 ${
            errored ? "bg-rose-50 text-rose-700" : done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}>
            {errored ? <Warning size={19} weight="duotone" /> : done ? <CheckCircle size={19} weight="duotone" /> : <BookOpen size={19} weight="duotone" />}
          </div>
          <div>
            <CardTitle className="text-base">Sync progress</CardTitle>
            <CardDescription>
              {!status && !running ? "Idle — start a pull to see progress." : status?.phase || "Starting…"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {!status && !running ? (
            <p className="py-8 text-center text-[13px] text-slate-400">No sync running.</p>
          ) : (
            <>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-slate-600">
                    {errored ? "Failed" : done ? "Imported" : status && status.total > 0 ? `${status.done} / ${status.total} subjects` : "Working…"}
                  </span>
                  <Badge variant={errored ? "destructive" : done ? "success" : "info"}>
                    {status?.state ?? "starting"}
                  </Badge>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${errored ? "bg-rose-500" : done ? "bg-emerald-500" : "bg-indigo-500"}`}
                    style={{ width: `${errored ? 100 : pct}%` }}
                  />
                </div>
              </div>

              {status?.message && !errored && (
                <p className="text-[12.5px] text-slate-500">{status.message}</p>
              )}
              {errored && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">{status?.error}</p>
              )}

              {done && status?.summary && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Subjects", status.summary.subjects],
                    ["Skill links", status.summary.skillLinks],
                    ["Resources", status.summary.resources],
                    ["Unmatched", status.summary.unmatchedSkills],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg bg-slate-50 py-2.5 text-center">
                      <p className="font-display text-xl font-semibold text-slate-900">{String(value)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <MirrorMaterialsCard />
    </div>
  )
}
