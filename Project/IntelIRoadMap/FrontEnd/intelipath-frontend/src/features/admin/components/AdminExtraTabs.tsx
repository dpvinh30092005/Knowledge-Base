import { useEffect, useState, type ReactNode } from "react"
import { Briefcase, GraduationCap, Buildings, MapPin, Money, ArrowSquareOut, Clock, Database, Cpu, Tag, Coffee } from "@phosphor-icons/react"
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components"
import { mainClient } from "@/shared/api"
import adminApi from "@/features/admin/api/adminApi"
import type { AdminSystemHealth } from "@/features/admin/admin.types"
import { normalizeTags } from "@/lib/tags"

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>()
  useEffect(() => {
    let alive = true
    mainClient
      .get<T>(url)
      .then((res) => { if (alive) setData(res.data) })
      .catch(() => { if (alive) setData(null) })
    return () => { alive = false }
  }, [url])
  return data // undefined = loading, null = error, T = loaded
}

function SectionSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-40 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="p-8 text-center text-sm text-slate-400">{text}</p>
}

// ─── Content tab: Careers & Roadmaps ───────────────────────────────────────────
export function AdminContentTab() {
  const careers = useFetch<any[]>("/careers")

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center gap-3 border-b border-slate-100 p-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-black/5">
            <GraduationCap size={19} weight="duotone" />
          </div>
          <div>
            <CardTitle className="text-base">Careers & Roadmaps</CardTitle>
            <CardDescription>{Array.isArray(careers) ? `${careers.length} career paths` : "Loading…"}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          {careers === undefined ? (
            <SectionSkeleton />
          ) : !careers || careers.length === 0 ? (
            <EmptyState text="No careers found." />
          ) : (
            <ul className="max-h-[440px] overflow-auto">
              {careers.map((c) => {
                const nodes = Array.isArray(c.skillNodes) ? c.skillNodes.length : undefined
                return (
                  <li key={c.careerId} className="flex items-start gap-3 rounded-lg px-2.5 py-2.5 hover:bg-slate-50">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                      <Briefcase size={16} weight="duotone" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-slate-800">{c.careerName}</p>
                      {c.description && <p className="line-clamp-2 text-[12px] leading-4 text-slate-400">{c.description}</p>}
                    </div>
                    {nodes !== undefined && (
                      <Badge variant={nodes > 0 ? "success" : "default"} className="shrink-0">
                        {nodes > 0 ? `${nodes} nodes` : "No roadmap"}
                      </Badge>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

    </div>
  )
}

// ─── System tab: live runtime health & diagnostics ─────────────────────────────
function formatUptime(ms?: number): string {
  if (!ms || ms < 0) return "—"
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s % 60}s`
}

function StatTile({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-2 font-display text-[22px] font-semibold leading-none text-slate-950">{value}</p>
      {sub && <p className="mt-1 text-[12px] text-slate-400">{sub}</p>}
    </div>
  )
}

function UsageBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function AdminSystemTab() {
  const [health, setHealth] = useState<AdminSystemHealth | null>()
  useEffect(() => {
    let alive = true
    void adminApi.getSystemHealth().then((h) => { if (alive) setHealth(h) }).catch(() => { if (alive) setHealth(null) })
    return () => { alive = false }
  }, [])

  if (health === undefined) return <SectionSkeleton />
  if (health === null) return <EmptyState text="Could not load system status." />

  const operational = health.status === "Operational"
  const db = health.db
  const mem = health.memory

  return (
    <div className="space-y-4">
      {/* Overall + component checks */}
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between border-b border-slate-100 p-4">
          <div>
            <CardTitle className="text-base">System status</CardTitle>
            <CardDescription>{health.servicesUp}/{health.servicesTotal} services online</CardDescription>
          </div>
          <Badge variant={operational ? "success" : "warning"} className="gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${operational ? "animate-pulse bg-emerald-500" : "bg-amber-500"}`} />
            {health.status}
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          {health.services.map((s) => (
            <div key={s.name} className={`flex items-center gap-3 rounded-xl border p-3.5 ${s.up ? "border-emerald-100 bg-emerald-50/40" : "border-rose-100 bg-rose-50/40"}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${s.up ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${s.up ? "bg-emerald-500" : "bg-rose-500"}`} />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-slate-800">{s.name}</p>
                <p className={`text-[12px] font-medium ${s.up ? "text-emerald-600" : "text-rose-600"}`}>{s.up ? "Operational" : "Unreachable"}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Runtime detail */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={<Clock size={15} weight="duotone" />} label="Uptime" value={formatUptime(health.uptimeMillis)} sub="since last restart" />
        <StatTile icon={<Tag size={15} weight="duotone" />} label="Version" value={health.version || "—"} sub="backend build" />
        <StatTile icon={<Coffee size={15} weight="duotone" />} label="Java" value={health.javaVersion || "—"} sub="runtime" />
        <StatTile
          icon={<Cpu size={15} weight="duotone" />}
          label="Memory"
          value={mem ? `${mem.usedMb} MB` : "—"}
          sub={mem ? `of ${mem.maxMb} MB max` : undefined}
        />
      </div>

      {/* DB pool + memory usage bars */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-3 p-4 pb-2">
            <Database size={18} weight="duotone" className="text-indigo-700" />
            <CardTitle className="text-base">Database pool</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {db ? (
              <>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[["Active", db.active], ["Idle", db.idle], ["Total", db.total], ["Max", db.max]].map(([l, v]) => (
                    <div key={String(l)} className="rounded-lg bg-slate-50 py-2">
                      <p className="font-display text-lg font-semibold text-slate-900">{String(v)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{l}</p>
                    </div>
                  ))}
                </div>
                <UsageBar used={db.active} total={db.max} color="bg-indigo-600" />
                <p className="mt-1.5 text-[12px] text-slate-400">{db.active} of {db.max} connections in use</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Pool stats unavailable.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3 p-4 pb-2">
            <Cpu size={18} weight="duotone" className="text-indigo-700" />
            <CardTitle className="text-base">Heap memory</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {mem ? (
              <>
                <p className="font-display text-2xl font-semibold text-slate-900">
                  {mem.usedMb} <span className="text-base font-medium text-slate-400">/ {mem.maxMb} MB</span>
                </p>
                <UsageBar used={mem.usedMb} total={mem.maxMb} color="bg-indigo-600" />
                <p className="mt-1.5 text-[12px] text-slate-400">{mem.maxMb > 0 ? Math.round((mem.usedMb / mem.maxMb) * 100) : 0}% of max heap used</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Memory stats unavailable.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Market tab: scraped recruitment posts ─────────────────────────────────────
export function AdminMarketTab() {
  const posts = useFetch<any[]>("/recruitment-posts/")

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center gap-3 border-b border-slate-100 p-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-black/5">
          <Briefcase size={19} weight="duotone" />
        </div>
        <div>
          <CardTitle className="text-base">Recruitment posts</CardTitle>
          <CardDescription>{Array.isArray(posts) ? `${posts.length} jobs from the latest scrape` : "Loading…"}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {posts === undefined ? (
          <SectionSkeleton />
        ) : !posts || posts.length === 0 ? (
          <EmptyState text="No recruitment posts yet. Run the Job Scraper from the Overview tab." />
        ) : (
          <div className="grid max-h-[560px] grid-cols-1 gap-2.5 overflow-auto md:grid-cols-2">
            {posts.map((p) => {
              const r = p.recruitment || {}
              const c = p.company || {}
              return (
                <div key={p.postId} className="rounded-xl border border-slate-200 p-3.5 transition-colors hover:border-slate-300 hover:bg-slate-50/50">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500">
                      {c.logo ? <img src={c.logo} alt="" className="h-full w-full object-cover" /> : (c.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-slate-900">{r.title || "Untitled role"}</p>
                      <p className="truncate text-[12.5px] text-slate-500">{c.name || "Unknown company"}</p>
                    </div>
                    {c.companyLink && (
                      <a href={c.companyLink} target="_blank" rel="noreferrer" className="shrink-0 text-slate-300 hover:text-indigo-600">
                        <ArrowSquareOut size={16} weight="bold" />
                      </a>
                    )}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
                    {r.salary && <span className="flex items-center gap-1"><Money size={13} weight="duotone" /> {r.salary}</span>}
                    {r.location && <span className="flex items-center gap-1"><MapPin size={13} weight="duotone" /> {r.location}</span>}
                    {r.experience && <span className="flex items-center gap-1"><Briefcase size={13} weight="duotone" /> {r.experience}</span>}
                  </div>
                  {(() => {
                    const tags = normalizeTags(r.tags)
                    return tags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.slice(0, 6).map((t, i) => (
                          <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{t}</span>
                        ))}
                      </div>
                    ) : null
                  })()}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
