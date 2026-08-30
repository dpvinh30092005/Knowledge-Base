import React, { forwardRef } from "react"
import { Sparkles, RefreshCw, AlertCircle, BookOpen, Search, TrendingDown, MessageSquare, Clock, Paperclip } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { useCareerDistribution, useMissingSkills, useFeedbackList } from "@/features/counselor/hooks/useCounselorDashboard"
import type { Feedback } from "@/features/counselor/api/counselorApi"
import { StatItem } from "@/types/dashboard"

// ----------------------------------------------------------------------
// 1. SMALL HELPERS (Inlined to match mentor pattern)
// ----------------------------------------------------------------------

export function ChartTooltip({ active, payload, labelKey, valueColorClass }: { active?: boolean; payload?: any[]; labelKey: string; valueColorClass: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 z-50">
      <p className="text-[13px] font-bold text-slate-900">
        {payload[0].payload[labelKey]}
      </p>
      <p className={`text-[13px] font-semibold mt-0.5 ${valueColorClass}`}>
        {payload[0].value} students
      </p>
    </div>
  )
}

export function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Icon size={36} className="mb-3 text-slate-200" />
      <p className="text-[14px] font-medium">{label}</p>
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-[13px] text-rose-600 font-medium">
      <AlertCircle size={15} />
      {message}
    </div>
  )
}

export function WidgetSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-5 rounded bg-slate-100" style={{ width: `${82 - i * 10}%` }} />
      ))}
    </div>
  )
}

export function StatPill({ icon: Icon, label, value }: StatItem) {
  return (
    <div className="stat-pill flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5">
      <Icon size={16} className="text-white/80" />
      <div>
        <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide">
          {label}
        </p>
        <p className="text-white text-[16px] font-bold leading-none">
          {value ?? "—"}
        </p>
      </div>
    </div>
  )
}

const FEEDBACK_TYPE_COLOR: Record<string, string> = {
  CAREER: "bg-[#e0f2fe] text-[#0284c7]",
  SKILL: "bg-[#f0fdf4] text-[#16a34a]",
  GENERAL: "bg-[#fef9c3] text-[#ca8a04]",
  ACADEMIC: "bg-[#f3e8ff] text-[#7c3aed]",
  OTHER: "bg-slate-100 text-slate-600"
}

export function FeedbackItem({ feedback: fb }: { feedback: Feedback }) {
  const name = fb.receiverName || "Unknown Student"
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "UN"
  const typeStyle = FEEDBACK_TYPE_COLOR[fb.type] ?? FEEDBACK_TYPE_COLOR.OTHER
  const dateStr = new Date(fb.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })

  return (
    <div className="feedback-item py-4 flex gap-3 hover:bg-slate-50 -mx-2 px-3 rounded-xl transition-all hover:shadow-sm group/fb">
      <div className="w-9 h-9 rounded-full bg-[#e0f2fe] text-[#006064] flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm group-hover/fb:shadow-md transition-shadow">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[14px] font-bold text-slate-900 group-hover/fb:text-[#006064] transition-colors">
            {name}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeStyle}`}>
            {fb.type}
          </span>
        </div>
        <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-2">
          {fb.content}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Clock size={11} />
            {dateStr}
          </div>
          {fb.attachments && fb.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip size={11} />
              <span className="font-medium text-slate-400">
                {fb.attachments.length} {fb.attachments.length === 1 ? 'file' : 'files'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// 2. MAIN WIDGETS
// ----------------------------------------------------------------------

interface CounselorHeroProps {
  stats: StatItem[]
}

export const CounselorHero = forwardRef<SVGSVGElement, CounselorHeroProps>(
  ({ stats }, sparkleRef) => {
    return (
      <div className="page-header relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003d40] via-[#005f63] to-[#00838f] p-7 md:p-9 shadow-[0_30px_60px_rgba(0,96,100,0.35)]">
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-[#00838f]/30 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 rounded-full bg-white/[0.03] blur-2xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="hero-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-inner">
              <Sparkles ref={sparkleRef} size={28} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </div>
            <div>
              <p className="text-white/60 text-[12px] font-semibold uppercase tracking-widest mb-1">
                Counselor Portal
              </p>
              <h1 className="text-white text-[26px] md:text-[30px] font-bold leading-tight">
                Counselor Dashboard
              </h1>
              <p className="text-white/70 text-[13px] mt-1">
                Overview of student learning, skill gaps &amp; feedback signals
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {stats.map((stat, idx) => (
              <StatPill key={idx} icon={stat.icon} label={stat.label} value={stat.value} />
            ))}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 text-[13px] font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 rounded-2xl transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    )
  }
)
CounselorHero.displayName = "CounselorHero"

const CAREER_COLORS = ["#024abd", "#026bff", "#1876ff", "#418dff", "#4293ff", "#69b9ff", "#7ad1ff", "#8dcdfb"]
const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.05) return null
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function CareerDistributionChart({ onSelectCareer, onTotalLoaded }: { onSelectCareer?: (name: string) => void; onTotalLoaded?: (total: number) => void }) {
  const { data, error, total } = useCareerDistribution(onTotalLoaded)
  const getDistributionColor = (idx: number) => {
    if (data.length <= 1) return CAREER_COLORS[0]
    const colorIdx = Math.round((idx / (data.length - 1)) * (CAREER_COLORS.length - 1))
    return CAREER_COLORS[Math.min(colorIdx, CAREER_COLORS.length - 1)]
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] widget-container group hover:border-[#00838f]/30 transition-colors flex flex-col md:h-[450px]">
      <div className="flex flex-col md:flex-row gap-8 items-stretch w-full chart-wrapper flex-1 md:min-h-0">
        <div className="flex-1 w-full flex flex-col">
          <div className="mb-6">
            <h2 className="text-[18px] font-bold text-slate-900 widget-title">Students by Career Path</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Distribution of students across career tracks</p>
          </div>
          <div className="h-[320px] w-full flex items-center justify-center relative">
            {error ? (
              <ErrorBanner message="Cannot load career distribution data." />
            ) : data.length === 0 ? (
              <EmptyState icon={BookOpen} label="No career data available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ChartTooltip labelKey="careerName" valueColorClass="text-[#006064]" />} isAnimationActive={false} />
                  <Pie
                    data={data}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={140}
                    dataKey="studentCount"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {data.map((item, idx) => (
                      <Cell key={idx} fill={getDistributionColor(idx)} cursor="pointer" onClick={() => onSelectCareer?.(item.careerName)} className="hover:opacity-80 transition-opacity outline-none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        {!error && data.length > 0 && (
          <div className="w-full md:w-[35%] flex flex-col self-stretch min-h-0 bg-transparent md:pl-5 pt-2 legend-container">
            <div className="flex items-center justify-between pb-3 mb-3 shrink-0">
              <span className="text-[15px] font-bold text-slate-800">Total Students</span>
              <span className="bg-[#e6f7f8] text-[#006064] px-3 py-1 rounded-lg text-[14px] font-bold">{total}</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
              {data.map((item, idx) => (
                <button key={item.careerName} type="button" onClick={() => onSelectCareer?.(item.careerName)} className="flex items-center w-full group/btn hover:bg-white p-2 -mx-2 rounded-lg transition-all">
                  <div className="w-3.5 h-3.5 rounded-sm shrink-0 shadow-sm" style={{ background: getDistributionColor(idx) }} />
                  <span className="text-[13.5px] text-slate-600 font-medium ml-3 text-left line-clamp-1 group-hover/btn:text-[#00838f] transition-colors">{item.careerName}</span>
                  <span className="text-[14px] font-bold text-slate-900 ml-auto pl-2">{item.studentCount}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function MissingSkillsChart({ careerFilter, onTotalLoaded }: { careerFilter?: string; onTotalLoaded?: (total: number) => void }) {
  const { data, totalStudents, loading, error, searchInput, setSearchInput, activeSearch, resolvedCareerName, handleSearch } = useMissingSkills(careerFilter, onTotalLoaded)

  const getSkillColor = (count: number) => {
    if (totalStudents === 0) return "#00FF19FF"
    const ratio = count / totalStudents
    if (ratio >= 0.75) return "#FF0000FF"
    if (ratio >= 0.5) return "#FF8000FF"
    if (ratio >= 0.25) return "#FFE900FF"
    return "#00FF19FF"
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-stretch w-full">
      <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] widget-container group hover:border-[#00838f]/30 transition-colors flex flex-col md:h-[480px]">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900 widget-title">Missing Skills</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {resolvedCareerName ? `Missing skills for ${resolvedCareerName}` : activeSearch ? `Missing skills for ${activeSearch}` : "Search a career to view missing skills"}
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search career..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-[#00838f] focus:ring-2 focus:ring-[#00838f]/20 transition-all w-full md:w-[220px]"
              />
            </div>
            <button type="submit" className="bg-[#00838f] text-white px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-[#006064] transition-colors">
              Search
            </button>
          </form>
        </div>

        <div className="h-[320px] w-full flex items-center justify-center relative flex-1 min-h-0">
          {!activeSearch ? (
            <EmptyState icon={Search} label="Search a career to see skill gaps" />
          ) : error ? (
            <ErrorBanner message={error} />
          ) : data.length === 0 ? (
            <EmptyState icon={TrendingDown} label="No skill gap data available" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.slice(0, 10)} margin={{ top: 20, right: 10, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="skillName" tick={{ fontSize: 11, fill: "#64748b", angle: -45, textAnchor: "end", dy: 10 } as any} tickLine={false} axisLine={false} interval={0} height={80} tickFormatter={(value) => (value.length > 15 ? value.substring(0, 15) + "..." : value)} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} content={<ChartTooltip labelKey="skillName" valueColorClass="text-rose-500" />} isAnimationActive={false} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {data.map((item, idx) => (
                    <Cell key={idx} fill={getSkillColor(item.count)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="w-full xl:w-[380px] bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] widget-container group hover:border-[#00838f]/30 transition-colors flex flex-col md:h-[480px]">
        {activeSearch && !loading && !error && data.length > 0 ? (
          <>
            <div className="flex items-center justify-between pb-4 mb-4 shrink-0 border-b border-slate-100">
              <span className="text-[16px] font-bold text-slate-800">Skill Details</span>
              <span className="bg-[#fff1f2] text-[#e11d48] px-3 py-1 rounded-lg text-[13px] font-bold">Total: {totalStudents}</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
              {data.map((item) => (
                <div key={item.skillName} className="flex items-center w-full group/btn hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-all">
                  <div className="w-3.5 h-3.5 rounded-sm shrink-0 shadow-sm" style={{ background: getSkillColor(item.count) }} />
                  <span className="text-[13.5px] text-slate-600 font-medium ml-3 text-left">{item.skillName}</span>
                  <span className="text-[14px] font-bold text-slate-900 ml-auto pl-2">{item.count}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
            <TrendingDown size={36} className="mb-3 text-slate-200" />
            <p className="text-[14px] font-medium text-center px-4">Search a career to view detailed skill breakdown</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function FeedbackListWidget({ onTotalLoaded }: { onTotalLoaded?: (total: number) => void }) {
  const { feedbacks, error } = useFeedbackList(onTotalLoaded)

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] widget-container group hover:border-blue-400/30 transition-colors flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 widget-title">History Feedback</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Feedback history sent to your students</p>
        </div>
        {!error && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] text-slate-600 font-semibold stats-badge">
            {feedbacks.length} feedbacks
          </span>
        )}
      </div>

      {error ? (
        <ErrorBanner message="Cannot load feedback data." />
      ) : feedbacks.length === 0 ? (
        <EmptyState icon={MessageSquare} label="No feedbacks yet" />
      ) : (
        <div className="divide-y divide-slate-100 feedback-list flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
          {feedbacks.map((fb) => (
            <FeedbackItem key={fb.feedbackId} feedback={fb} />
          ))}
        </div>
      )}
    </div>
  )
}
