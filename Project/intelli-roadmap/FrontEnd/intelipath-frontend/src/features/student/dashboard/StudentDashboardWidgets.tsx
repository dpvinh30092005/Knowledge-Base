import React, { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/shared"
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Check,
  Clock,
  TrendingUp,
  Target,
  Zap,
  Lock,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from "recharts"
import { Skeleton } from "@/components/ui"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useAuth } from "@/context"
import roadmapApi from "@/api/roadmapApi"
import { toast } from "@/lib/toast"
import { studentDashboardService } from "../services"
import { useDashboardData, useRoadmapProgress } from "../hooks"
import type {
  MarketDemand,
  RoadmapProgress,
  SkillResponse,
  RoadmapRecommendation,
  RoadmapRecommendationDecision
} from "../types"

const LoadingState = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-3 py-2 w-full">
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton
        key={index}
        className="h-4 rounded"
        style={{ width: `${index % 3 === 0 ? 68 : index % 3 === 1 ? 100 : 82}%` }}
      />
    ))}
  </div>
)

const EmptyState = ({ title, description }: { title: string; description?: string }) => (
  <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl bg-slate-50 p-8 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
      <Zap size={20} className="text-slate-400" />
    </div>
    <h3 className="text-[16px] font-bold text-slate-900">{title}</h3>
    {description && <p className="mt-1 text-[13px] text-slate-500">{description}</p>}
  </div>
)

// 1. Welcome Header (Replaces Top Banner)
export const StudentWelcomeHeader = () => {
  const { user } = useAuth()
  
  const { data } = useDashboardData<any>(
    () => studentDashboardService.getStudentRoadmap()
  )
  
  // Progress from API or 0
  const progress = data?.progress || 0
  
  // Calculate stroke dasharray for the circular progress (circumference = 2 * pi * r)
  // r = 24, circumference ≈ 150.7
  const circumference = 150.7
  const strokeDashoffset = circumference - (progress / 100) * circumference
  
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-3xl bg-black p-8 text-white mb-8 gap-6">
      <div>
        <h1 className="text-[32px] font-black tracking-tight mb-2">Hello, {user?.fullName || "Student"}!</h1>
        <p className="text-[16px] text-slate-400 font-medium">It's a great day to expand your knowledge.</p>
      </div>
      <div className="flex items-center gap-5 bg-white/10 p-5 rounded-3xl border border-white/10">
        <div className="flex flex-col">
          <span className="text-[15px] font-black text-white">Course Progress</span>
          <span className="text-[13px] text-slate-400 font-medium">Keep up the good work!</span>
        </div>
        
        <div className="relative flex h-[64px] w-[64px] items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 64 64">
            {/* Background circle */}
            <circle
              cx="32"
              cy="32"
              r="24"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="6"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="32"
              cy="32"
              r="24"
              stroke="white"
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute text-[15px] font-black text-white">{progress}%</span>
        </div>
      </div>
    </div>
  )
}

// 2. Current Progress Banner
export const CurrentProgressBanner = () => {
  const navigate = useNavigate();
  const { data: roadmapData, status: roadmapStatus } = useRoadmapProgress()

  const steps = roadmapData?.steps ?? []
  const currentIdx = Math.max(0, steps.findIndex(s => s.status === 'current' || s.status === 'in_progress'))
  // null until the user browses; then the arrows drive which milestone shows.
  const [browseIdx, setBrowseIdx] = useState<number | null>(null)
  const activeIdx = browseIdx ?? currentIdx
  const node = steps[activeIdx]

  if (roadmapStatus === 'loading') return <LoadingState rows={1} />
  if (!node) return null

  const caption = node.status === 'completed'
    ? 'Completed milestone'
    : node.status === 'current' || node.status === 'in_progress'
      ? 'Current milestone'
      : 'Upcoming milestone'

  return (
    <div className="mt-6 flex flex-col md:flex-row items-center justify-between rounded-3xl bg-[#f5f5f5] p-4 md:p-5 gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm font-bold text-[18px]">
          <Target size={22} className="text-black" />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-black line-clamp-1 max-w-[220px]">{node.title}</h3>
          <p className="text-[13px] font-medium text-slate-500">{caption} · {activeIdx + 1}/{steps.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto justify-end">
        <button
          onClick={() => navigate(ROUTES.DASHBOARD_STUDENT_ROADMAP)}
          className="rounded-2xl bg-black px-6 py-3 text-[14px] font-bold text-white transition-transform hover:scale-105 active:scale-95"
        >
          Continue
        </button>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setBrowseIdx(Math.max(0, activeIdx - 1))}
            disabled={activeIdx === 0}
            aria-label="Previous milestone"
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 transition-colors ${activeIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200'}`}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => setBrowseIdx(Math.min(steps.length - 1, activeIdx + 1))}
            disabled={activeIdx === steps.length - 1}
            aria-label="Next milestone"
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 transition-colors ${activeIdx === steps.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200'}`}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Windowed page list: always first/last + current neighbours, gaps become "…".
const buildPageList = (current: number, total: number): (number | "ellipsis")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const wanted = [1, total, current, current - 1, current + 1]
    .filter(p => p >= 1 && p <= total)
  const unique = Array.from(new Set(wanted)).sort((a, b) => a - b)
  const out: (number | "ellipsis")[] = []
  let prev = 0
  for (const p of unique) {
    if (p - prev > 1) out.push("ellipsis")
    out.push(p)
    prev = p
  }
  return out
}

// Roadmap Personalization shortcuts: real, actionable "skip what you already
// know" suggestions from the student's skills/evidence (rule-based, not an LLM).
// Applying one marks nodes complete and reloads the shared roadmap progress.
const ShortcutSuggestions = () => {
  const { reload } = useRoadmapProgress()
  const [recs, setRecs] = useState<RoadmapRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [decidingId, setDecidingId] = useState<string | null>(null)

  const loadPending = useCallback(async () => {
    setLoading(true)
    try {
      const res = await roadmapApi.getPendingRecommendations()
      setRecs(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error("[Shortcuts] Failed to load pending recommendations:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPending() }, [loadPending])

  const handleGenerate = async () => {
    if (generating) return
    setGenerating(true)
    try {
      const res = await roadmapApi.generateRecommendations()
      const created: RoadmapRecommendation[] = Array.isArray(res.data) ? res.data : []
      toast[created.length === 0 ? "info" : "success"](
        created.length === 0
          ? "No shortcuts found — your roadmap already matches your skills."
          : "New shortcuts are ready to review."
      )
      await loadPending()
    } catch (error) {
      console.error("[Shortcuts] Failed to generate:", error)
    } finally {
      setGenerating(false)
    }
  }

  const handleDecision = async (id: string, decision: "accept" | "reject") => {
    if (decidingId) return
    setDecidingId(id)
    try {
      const res = decision === "accept"
        ? await roadmapApi.acceptRecommendation(id)
        : await roadmapApi.rejectRecommendation(id)
      const result: RoadmapRecommendationDecision = res.data
      setRecs(prev => prev.filter(r => r.recommendationId !== id))
      if (decision === "accept") {
        toast.success(result.roadmapProgress != null
          ? `Roadmap updated — you're now at ${result.roadmapProgress}%.`
          : "Roadmap updated.")
        reload()
      } else {
        toast.info("Shortcut dismissed.")
      }
    } catch (error) {
      console.error(`[Shortcuts] Failed to ${decision}:`, error)
    } finally {
      setDecidingId(null)
    }
  }

  if (loading) return <LoadingState rows={4} />

  if (recs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl bg-[#f9f9f9] py-12 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
          <Zap size={22} className="text-black" />
        </div>
        <p className="text-[15px] font-bold text-black">No shortcuts yet</p>
        <p className="text-[13px] text-slate-500 mt-1 max-w-[280px]">Scan your skills and evidence to find roadmap nodes you can skip.</p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-4 rounded-2xl bg-black px-5 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {generating ? "Scanning…" : "Scan for shortcuts"}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {recs.map((rec) => {
        const deciding = decidingId === rec.recommendationId
        const confidence = rec.confidence != null ? `${Math.round(Number(rec.confidence) * 100)}%` : null
        return (
          <div key={rec.recommendationId} className="rounded-3xl bg-[#f9f9f9] p-5">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
                  <Zap size={12} /> Shortcut
                </span>
                <h4 className="text-[16px] font-bold text-black">{rec.title || "Skip skills you already know"}</h4>
              </div>
              {confidence && (
                <span className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">{confidence}</span>
              )}
            </div>
            {rec.summary && <p className="text-[13px] text-slate-500 mb-3">{rec.summary}</p>}

            <div className="flex flex-col gap-1.5 mb-4">
              {rec.items.map((item) => (
                <div key={item.recItemId} className="flex items-start gap-2 rounded-xl bg-white p-2.5">
                  <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-700 truncate">{item.nodeName || "Roadmap node"}</p>
                    {item.reason && <p className="text-[11px] text-slate-400 leading-snug">{item.reason}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDecision(rec.recommendationId, "accept")}
                disabled={deciding}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                <Check size={14} /> {deciding ? "Applying…" : "Apply"}
              </button>
              <button
                onClick={() => handleDecision(rec.recommendationId, "reject")}
                disabled={deciding}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-[13px] font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 3. Your Action Items — "what to do next": the roadmap queue plus real,
// applyable shortcuts. Task-oriented, so it complements (not repeats) Skill Match.
export const ActionableListWidget = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'next' | 'shortcuts'>('next')
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 6

  const { data: roadmap, status } = useRoadmapProgress()

  const handleTabSwitch = (tab: 'next' | 'shortcuts') => {
    setActiveTab(tab)
    setPage(1)
  }

  // Up-next queue = the immediate roadmap steps you haven't finished, in order.
  // Capped so the list stays a short "what's next", not the whole roadmap.
  const UP_NEXT_LIMIT = 15
  const pending = (roadmap?.steps ?? []).filter(s => s.status !== 'completed')
  const upNext = pending.slice(0, UP_NEXT_LIMIT)

  const isNext = activeTab === 'next'
  const totalPages = Math.ceil(upNext.length / ITEMS_PER_PAGE)
  const currentData = upNext.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-[24px] font-black text-black tracking-tight">Your Action Items</h2>

        <div className="flex gap-6 text-[14px] font-bold text-slate-400">
          <button
            onClick={() => handleTabSwitch('next')}
            className={`pb-1 ${isNext ? 'text-black border-b-2 border-black' : 'hover:text-black transition-colors'}`}>
            Up Next
          </button>
          <button
            onClick={() => handleTabSwitch('shortcuts')}
            className={`pb-1 ${!isNext ? 'text-black border-b-2 border-black' : 'hover:text-black transition-colors'}`}>
            Shortcuts
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 h-[660px]">
        {!isNext ? (
          <ShortcutSuggestions />
        ) : status === "loading" ? (
          <LoadingState rows={6} />
        ) : currentData.length === 0 ? (
          <EmptyState
            title="You're all caught up"
            description="Every roadmap milestone is complete. Nice work."
          />
        ) : (
          <>
            {currentData.map((item: any, index: number) => {
              const active = item.status === 'current' || item.status === 'in_progress'
              return (
                <div key={item.id || index} className="group flex flex-col sm:flex-row items-center justify-between rounded-3xl bg-[#f9f9f9] p-4 pr-5 transition-colors hover:bg-[#f0f0f0] gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                      {active ? <Zap size={24} className="text-black" /> : <BookOpen size={24} className="text-black" />}
                    </div>
                    <div className="min-w-0">
                      {/* Name the context before the node. "$eq" on its own is not a
                          task; "MongoDB › Comparison Operators › $eq" is. */}
                      {item.parentTitle && (
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 line-clamp-1 max-w-[280px]">
                          {item.parentTitle}
                        </p>
                      )}
                      <h4 className="text-[16px] font-bold text-black line-clamp-1">{item.title}</h4>
                      <p className="text-[13px] font-medium text-slate-500 line-clamp-1 max-w-[280px]">{active ? 'In progress' : 'Up next'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0">
                    <span className={`flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full ${active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {active ? <Zap size={13} /> : <Clock size={13} />}
                      {active ? 'Current' : 'Locked'}
                    </span>
                    <button
                      onClick={() => navigate(ROUTES.DASHBOARD_STUDENT_ROADMAP)}
                      className="rounded-2xl bg-black px-5 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-105 active:scale-95"
                    >
                      {active ? 'Continue' : 'View'}
                    </button>
                  </div>
                </div>
              )
            })}

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 transition-colors ${page === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 text-black'}`}
                >
                  <ArrowLeft size={16} />
                </button>

                <div className="flex items-center gap-1">
                  {buildPageList(page, totalPages).map((p, i) => (
                    p === "ellipsis" ? (
                      <span key={`e${i}`} className="h-10 w-8 flex items-center justify-center text-[14px] font-bold text-slate-300 select-none">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`h-10 w-10 rounded-full text-[14px] font-bold transition-colors ${page === p ? 'bg-black text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-black'}`}
                      >
                        {p}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 transition-colors ${page === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 text-black'}`}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// 4. Quick Stats
export const QuickStatsWidget = () => {
  const { data } = useRoadmapProgress()

  const completed = data?.steps?.filter(s => s.status === 'completed').length || 0;
  const inProgress = data?.steps?.filter(s => s.status === 'current').length || 0;

  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <div className="flex flex-col justify-center rounded-3xl bg-[#f5f5f5] p-6">
        <div className="flex items-end gap-2">
          <span className="text-[42px] font-black leading-none text-black">{completed}</span>
          <span className="mb-1 text-[14px] font-bold leading-tight text-slate-500 max-w-[60px]">Milestones completed</span>
        </div>
      </div>
      <div className="flex flex-col justify-center rounded-3xl bg-[#f5f5f5] p-6">
        <div className="flex items-end gap-2">
          <span className="text-[42px] font-black leading-none text-black">{inProgress}</span>
          <span className="mb-1 text-[14px] font-bold leading-tight text-slate-500 max-w-[60px]">Skills in progress</span>
        </div>
      </div>
    </div>
  )
}

// 5. Market Demand Chart
export const MarketDemandChartWidget = () => {
  const { data, status } = useDashboardData<MarketDemand>(
    () => studentDashboardService.getMarketDemand() as Promise<MarketDemand>
  )

  // One point per calendar week, labelled by the backend with the Monday it starts
  // on. The old code padded to 7 and named the points ['mon'..'sun'][i % 7], which
  // printed an axis of "sat sun tue" unrelated to the dates — and the padding
  // invented zero weeks that never happened, dragging the line down at the left.
  const rawChart = data?.chart || []
  const labels = data?.chartLabels || []

  const chartData = rawChart.map((val, i) => ({
    name: labels[i] ?? `W${i + 1}`,
    value: val
  }))

  return (
    <div className="mt-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[20px] font-black text-black tracking-tight">Market Trend</h2>
        <button className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-black">
          Weekly <ChevronRight size={14} />
        </button>
      </div>

      <div className="h-[220px] w-full mt-4">
        {status === "loading" ? (
          <LoadingState rows={4} />
        ) : status === "error" || chartData.length === 0 ? (
          <EmptyState title="No trend data" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#000', color: '#fff', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.2)', fontSize: '13px', fontWeight: 700, padding: '8px 12px' }} 
                itemStyle={{ color: '#fff' }}
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                name="Demand"
                stroke="#000000" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorDemand)" 
                activeDot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 3 }}
                dot={{ r: 4, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// 6. Skill Match — horizontal bar chart (replaces an unreadable 22-axis radar).
type SkillRow = {
  id: string
  name: string
  importance: "HIGH" | "AVG" | "LOW"
  pct: number
}

const IMPORTANCE_GROUPS: { key: SkillRow["importance"]; label: string; accent: string }[] = [
  { key: "HIGH", label: "Essential", accent: "#ef4444" },
  { key: "AVG", label: "Recommended", accent: "#f59e0b" },
]

/**
 * The denominator behind the headline figures, mirroring the backend's
 * `SeniorityCalculator.CORE_IMPORTANCE`.
 *
 * Backend for `vinh.student` carries 1466 required-skill rows: 29 HIGH, 152 AVG
 * and 1285 LOW. Averaging mastery over all 1466 pinned "Career readiness" at 0%
 * no matter what the student did, and printed "5/1466 mastered" on the same
 * screen where the level badge said "0 of 29 required skills" — two different
 * answers to one question. The headline follows the badge; LOW is not a career
 * requirement in any sense a student would recognise.
 */
const CORE_IMPORTANCE: SkillRow["importance"][] = ["HIGH"]

/** What the bar chart plots: the core skills plus the recommended tier around them. */
const CHARTED_IMPORTANCE: SkillRow["importance"][] = ["HIGH", "AVG"]

const IMPORTANCE_ACCENT: Record<SkillRow["importance"], string> = {
  HIGH: "#ef4444",
  AVG: "#f59e0b",
  LOW: "#94a3b8",
}

const skillChartConfig: ChartConfig = {
  pct: { label: "Mastery" },
}

const ReadinessGauge = ({ value }: { value: number }) => {
  const data = [{ value: Math.min(value, 100), fill: value >= 100 ? "#10b981" : "#000000" }]
  return (
    <div className="relative h-24 w-24 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          startAngle={90}
          endAngle={-270}
          innerRadius="72%"
          outerRadius="100%"
          barSize={10}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "#e2e8f0" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[17px] font-black text-black tabular-nums">{value}%</span>
      </div>
    </div>
  )
}

const SKILL_ROW_HEIGHT = 34
const SKILL_CHART_MAX_HEIGHT = 340
const SKILL_CHART_MARGIN = { top: 4, right: 28, left: 4, bottom: 4 }
const SKILL_Y_AXIS_WIDTH = 120

const SkillGapChart = ({ rows }: { rows: SkillRow[] }) => {
  // Longest gaps first so the most important thing to fix is at the top.
  const data = [...rows].sort((a, b) => a.pct - b.pct)
  const height = Math.max(data.length * SKILL_ROW_HEIGHT, 120)
  const scrollable = height > SKILL_CHART_MAX_HEIGHT

  return (
    <div>
      {/* % scale stays fixed above the list — only the rows below scroll. */}
      <ChartContainer config={skillChartConfig} className="w-full" style={{ height: 24 }}>
        <BarChart data={[]} layout="vertical" margin={SKILL_CHART_MARGIN}>
          <XAxis
            type="number"
            domain={[0, 100]}
            orientation="top"
            height={20}
            tickFormatter={(v) => `${v}%`}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
          />
          <YAxis type="category" dataKey="name" width={SKILL_Y_AXIS_WIDTH} hide />
        </BarChart>
      </ChartContainer>

      <div
        className={scrollable ? "overflow-y-auto pr-1" : undefined}
        style={scrollable ? { maxHeight: SKILL_CHART_MAX_HEIGHT } : undefined}
      >
    <ChartContainer config={skillChartConfig} className="w-full" style={{ height }}>
      <BarChart
        data={data}
        layout="vertical"
        margin={SKILL_CHART_MARGIN}
        barCategoryGap={10}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" domain={[0, 100]} height={0} tick={false} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          width={SKILL_Y_AXIS_WIDTH}
          tick={{ fontSize: 12, fill: "#334155", fontWeight: 700 }}
        />
        <ReferenceLine x={100} stroke="#cbd5e1" strokeDasharray="4 4" />
        <ChartTooltip
          cursor={{ fill: "#f8fafc" }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => {
                const row = item.payload as SkillRow
                return (
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="font-bold text-slate-700">{row.name}</span>
                    <span className="font-mono font-bold text-slate-950">
                      {row.pct >= 100 ? "Mastered" : `${Math.round(Number(value))}%`}
                    </span>
                  </div>
                )
              }}
            />
          }
        />
        <Bar dataKey="pct" radius={[0, 6, 6, 0]} maxBarSize={16}>
          {data.map((row) => (
            <Cell key={row.id} fill={row.pct >= 100 ? "#10b981" : IMPORTANCE_ACCENT[row.importance]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
      </div>
    </div>
  )
}

export const SkillMatchWidget = () => {
  const { data, status } = useDashboardData<SkillResponse>(
    () => studentDashboardService.compareRoadmapSkills()
  )
  const [gapsOnly, setGapsOnly] = useState(false)

  const rows: SkillRow[] = (data?.requiredSkills ?? []).map(({ skill, importanceLevel, progress }) => {
    // Mastery is authoritative backend data: it applies the same proficiency
    // threshold as SeniorityCalculator and can also include measurable roadmap
    // progress. A selected skill without proficiency is only a claim, not 100%.
    const pct = progress !== undefined && progress !== null
      ? progress
      : 0
    const imp = String(importanceLevel || "AVG").toUpperCase()
    return {
      id: skill.skillId,
      name: skill.skillName,
      importance: (imp === "HIGH" || imp === "LOW" ? imp : "AVG") as SkillRow["importance"],
      pct,
    }
  })

  // Headline follows the level badge's denominator; the chart shows one tier wider
  // so the student can see what sits just outside the core.
  const coreRows = rows.filter((r) => CORE_IMPORTANCE.includes(r.importance))
  const chartedRows = rows.filter((r) => CHARTED_IMPORTANCE.includes(r.importance))

  const total = coreRows.length
  const mastered = coreRows.filter((r) => r.pct >= 100).length
  const readiness = total > 0 ? Math.round(coreRows.reduce((s, r) => s + r.pct, 0) / total) : 0

  const visible = gapsOnly ? chartedRows.filter((r) => r.pct < 100) : chartedRows

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[20px] font-black text-black tracking-tight">Skill Match</h2>
        {chartedRows.length > 0 && (
          <button
            onClick={() => setGapsOnly((v) => !v)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${
              gapsOnly ? "bg-black text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {gapsOnly ? "Showing gaps" : "Show gaps only"}
          </button>
        )}
      </div>

      <div className="w-full min-h-[420px] rounded-3xl bg-[#f9f9f9] p-5">
        {status === "loading" ? (
          <LoadingState rows={5} />
        ) : status === "error" || rows.length === 0 ? (
          <EmptyState title="No skills to compare" description="Pick a target career to see your skill match." />
        ) : (
          <>
            {/* Readiness summary */}
            <div className="mb-5 flex items-center gap-5">
              <ReadinessGauge value={readiness} />
              <div className="flex-1">
                <div className="text-[13px] font-bold text-slate-700">Career readiness</div>
                <div className="mt-1 text-[12px] font-medium text-slate-400">
                  Based on the {total} essential skill{total === 1 ? "" : "s"} for your target
                  career — the same set your level is graded on.
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[20px] font-black text-black tabular-nums">{mastered}<span className="text-slate-400">/{total}</span></div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">essential mastered</div>
              </div>
            </div>

            {/* Legend */}
            <div className="mb-3 flex items-center gap-4">
              {IMPORTANCE_GROUPS.map((group) => (
                <div key={group.key} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: group.accent }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {group.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Per-skill mastery, longest gaps first */}
            <SkillGapChart rows={visible} />
          </>
        )}
      </div>
    </div>
  )
}
