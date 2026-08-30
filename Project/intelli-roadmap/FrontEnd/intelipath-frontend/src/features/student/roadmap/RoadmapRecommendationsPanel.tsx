import { useCallback, useEffect, useState } from "react"
import { CaretDown, CaretUp, Check, Sparkle, X } from "@phosphor-icons/react"
import roadmapApi from "@/api/roadmapApi"
import { toast } from "@/lib/toast"
import type { RoadmapRecommendation, RoadmapRecommendationDecision } from "../types"

interface RoadmapRecommendationsPanelProps {
  /** Only fetch/generate when the student already has a target career. */
  hasCareer: boolean
  /** Called after an accepted recommendation so the parent can reload the roadmap graph. */
  onApplied?: () => void
  /** Bump to force a reload of pending recommendations (e.g. after declaring FPT subjects). */
  refreshSignal?: number
}

const formatConfidence = (confidence: number | null) =>
  confidence != null ? `${Math.round(Number(confidence) * 100)}%` : null

/**
 * Floating AI-suggestions panel for the student roadmap page.
 * Lists PENDING roadmap recommendations; accepting applies them on the
 * backend (progress + skill sync) and refreshes the graph via onApplied.
 */
const RoadmapRecommendationsPanel = ({ hasCareer, onApplied, refreshSignal }: RoadmapRecommendationsPanelProps) => {
  const [recommendations, setRecommendations] = useState<RoadmapRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [decidingId, setDecidingId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const loadPending = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await roadmapApi.getPendingRecommendations()
      setRecommendations(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("[Roadmap Recommendations] Failed to load pending recommendations:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasCareer) {
      loadPending()
    } else {
      setRecommendations([])
    }
  }, [hasCareer, loadPending, refreshSignal])

  const handleGenerate = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      const response = await roadmapApi.generateRecommendations()
      const created: RoadmapRecommendation[] = Array.isArray(response.data) ? response.data : []
      if (created.length === 0) {
        toast.info("No new suggestions — your roadmap already matches your skills.")
      } else {
        toast.success("New roadmap suggestions are ready for review.")
        setIsCollapsed(false)
      }
      await loadPending()
    } catch (error) {
      console.error("[Roadmap Recommendations] Failed to generate recommendations:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDecision = async (recommendationId: string, decision: "accept" | "reject") => {
    if (decidingId) return
    setDecidingId(recommendationId)
    try {
      const response = decision === "accept"
        ? await roadmapApi.acceptRecommendation(recommendationId)
        : await roadmapApi.rejectRecommendation(recommendationId)
      const result: RoadmapRecommendationDecision = response.data

      setRecommendations((prev) => prev.filter((rec) => rec.recommendationId !== recommendationId))

      if (decision === "accept") {
        toast.success(
          result.roadmapProgress != null
            ? `Roadmap updated — you are now at ${result.roadmapProgress}%.`
            : "Roadmap updated."
        )
        onApplied?.()
      } else {
        toast.info("Suggestion dismissed.")
      }
    } catch (error) {
      console.error(`[Roadmap Recommendations] Failed to ${decision} recommendation:`, error)
    } finally {
      setDecidingId(null)
    }
  }

  if (!hasCareer) return null

  const current = recommendations[0]

  // Compact chip when there is nothing to review (or while collapsed).
  if (!current || isCollapsed) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={current ? () => setIsCollapsed(false) : handleGenerate}
          disabled={isGenerating || isLoading}
          className="group flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2.5 rounded-xl ring-1 ring-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:bg-white/80 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          <Sparkle size={14} weight="fill" className="text-indigo-500" />
          <span className="text-[12px] font-semibold text-slate-700">
            {isGenerating
              ? "Scanning your skills..."
              : current
                ? `AI Suggestions (${recommendations.length})`
                : "Scan skills for shortcuts"}
          </span>
          {current && <CaretUp size={12} weight="bold" className="text-slate-400" />}
        </button>
      </div>
    )
  }

  const isDeciding = decidingId === current.recommendationId

  return (
    <div className="w-[340px] bg-white/60 backdrop-blur-md rounded-2xl ring-1 ring-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.08)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/60 bg-white/50">
        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
          <Sparkle size={12} weight="fill" className="text-indigo-500" />
          AI Suggestion
          {recommendations.length > 1 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-500 text-[9px] font-bold">
              +{recommendations.length - 1} more
            </span>
          )}
        </p>
        <button
          onClick={() => setIsCollapsed(true)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100/60 hover:text-slate-600 transition-colors"
        >
          <CaretDown size={12} weight="bold" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-[14px] font-bold tracking-tight text-slate-900 leading-snug">
            {current.title || "Skip skills you already know"}
          </h3>
          {formatConfidence(current.confidence) && (
            <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
              {formatConfidence(current.confidence)}
            </span>
          )}
        </div>
        {current.summary && (
          <p className="text-[12px] text-slate-500 leading-relaxed mb-3">{current.summary}</p>
        )}

        {/* Proposed nodes */}
        <div className="max-h-[160px] overflow-y-auto pr-1 mb-3 flex flex-col gap-1.5">
          {current.items.map((item) => (
            <div
              key={item.recItemId}
              className="flex items-start gap-2 p-2 bg-white/70 rounded-lg ring-1 ring-black/[0.03]"
            >
              <div className="w-4 h-4 mt-0.5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Check size={9} weight="bold" className="text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-700 truncate">
                  {item.nodeName || "Roadmap node"}
                </p>
                {item.reason && (
                  <p className="text-[10px] text-slate-400 leading-snug">{item.reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDecision(current.recommendationId, "accept")}
            disabled={isDeciding}
            className="group flex-1 flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl transition-transform active:scale-[0.98] shadow-[0_4px_15px_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgb(0,0,0,0.15)] disabled:opacity-50 disabled:active:scale-100"
          >
            <Check size={13} weight="bold" />
            <span className="text-[12px] font-semibold tracking-wide">
              {isDeciding ? "Applying..." : "Apply"}
            </span>
          </button>
          <button
            onClick={() => handleDecision(current.recommendationId, "reject")}
            disabled={isDeciding}
            className="flex items-center justify-center gap-1.5 bg-white text-slate-600 px-4 py-2.5 rounded-xl ring-1 ring-slate-200 hover:bg-slate-50 transition-colors text-[12px] font-medium disabled:opacity-50"
          >
            <X size={12} weight="bold" /> Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoadmapRecommendationsPanel
