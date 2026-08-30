import { useCallback, useEffect, useState } from "react"
import { CheckCircle, SealCheck, Target, Warning } from "@phosphor-icons/react"
import { studentDashboardService } from "../services"
import type { LearningPlan, NodeSelection, PlanNode, PlanStep, StudentRoadmap } from "../types"

interface LearningPlanPanelProps {
  /** Only fetch once the student has a target career; there is no plan without one. */
  hasCareer: boolean
  /**
   * Open the detail for a step's material.
   *
   * <p>Takes the whole node rather than its id: the plan can reference nodes the
   * roadmap's visibility filter is currently holding back, so the graph is not a
   * reliable place to look one up.
   */
  onOpenNode?: (node: PlanNode) => void
  /** Bump to reload after progress changes. */
  refreshSignal?: number
  /**
   * The roadmap the page has already loaded.
   *
   * <p>Passed in rather than fetched so the priority list is the very same nodes,
   * in the very same order, the canvas beside it is drawing. A second request
   * here would be a second opinion, and two rankings of one roadmap on one screen
   * is the bug this panel is meant to answer, not repeat.
   */
  roadmap?: StudentRoadmap | null
  /**
   * Stored CHOOSE_ONE decisions, so the ones the system made can explain
   * themselves. A branch picked on the student's behalf that never says why is
   * indistinguishable from one they chose and forgot.
   */
  selections?: NodeSelection[]
}

/** Highest-priority unfinished nodes worth listing before the student scrolls. */
const TOP_PRIORITY_COUNT = 5

const PRIORITY_STYLE: Record<string, string> = {
  CRITICAL: "bg-rose-50 text-rose-600 ring-rose-100",
  HIGH: "bg-amber-50 text-amber-600 ring-amber-100",
  NORMAL: "bg-slate-100 text-slate-500 ring-slate-200"
}

const pct = (ratio: number) => Math.round(ratio * 100)

const IMPORTANCE_STYLE: Record<string, string> = {
  HIGH: "bg-rose-50 text-rose-600 ring-rose-100",
  AVG: "bg-amber-50 text-amber-600 ring-amber-100",
  LOW: "bg-slate-100 text-slate-500 ring-slate-200"
}

/** 1..4 on the behaviourally-anchored scale the assessment writes. */
const PROFICIENCY_LABEL = ["", "Aware", "Practiced", "Applied", "Professional"]

/**
 * What this student should learn next, and why.
 *
 * <p>The roadmap graph beside this panel answers "what exists in Backend". This
 * answers "what should I do on Monday", which is a different question and the
 * one a student actually arrives with.
 *
 * <p>Every step shows its reason. That is not decoration: a plan a student
 * cannot disagree with is a plan they cannot trust. "Learn Docker" invites
 * nothing; "Docker is required for Backend and appears in 34 of 120 recent
 * postings" can be argued with, and being arguable is the point.
 */
const LearningPlanPanel = ({ hasCareer, onOpenNode, refreshSignal, roadmap, selections }: LearningPlanPanelProps) => {
  const [plan, setPlan] = useState<LearningPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [openStep, setOpenStep] = useState<number | null>(null)

  const loadPlan = useCallback(async () => {
    setIsLoading(true)
    setFailed(false)
    try {
      setPlan(await studentDashboardService.getStudentPlan())
    } catch (error) {
      console.error("[Learning Plan] Failed to load the plan:", error)
      setFailed(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasCareer) {
      loadPlan()
    } else {
      setPlan(null)
    }
  }, [hasCareer, loadPlan, refreshSignal])

  if (!hasCareer) {
    return (
      <p className="py-3 text-[11px] leading-relaxed text-slate-500">
        Pick a target career first — a plan needs something to aim at.
      </p>
    )
  }

  if (isLoading) {
    return <p className="py-3 text-[11px] text-slate-400">Working out what comes next…</p>
  }

  if (failed) {
    return (
      <div className="py-3">
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
          <Warning size={13} weight="bold" className="mt-px shrink-0 text-amber-500" />
          The plan could not be loaded. The roadmap beside it is unaffected.
        </p>
        <button
          type="button"
          onClick={loadPlan}
          className="mt-2 rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200"
        >
          Try again
        </button>
      </div>
    )
  }

  const steps = plan?.steps ?? []
  const covered = plan?.coveredSkillCount ?? 0
  const required = plan?.requiredSkillCount ?? 0

  // Readiness is not `progress`. Progress counts nodes ticked off on the canvas;
  // readiness counts the career's essential skills actually held. A student can
  // finish this whole view and still be 12% ready for the job, and they are
  // entitled to both numbers rather than only the flattering one.
  const readiness = roadmap?.readiness
  const readinessVerified = roadmap?.readinessVerified

  // Top priorities read straight off the nodes the canvas is drawing, so the list
  // and the map can never rank the same roadmap differently.
  const topPriority = (roadmap?.nodes ?? [])
    .filter(node =>
      typeof node.priorityScore === "number" &&
      node.status !== "completed" &&
      node.status !== "alternative")
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
    .slice(0, TOP_PRIORITY_COUNT)

  // Only the ones the system decided, and only those that can say why.
  const autoPicked = (selections ?? []).filter(s => s.autoSelected && s.autoReason)

  return (
    <>
      {typeof readiness === "number" && (
        <div className="mb-2.5 border-b border-black/[0.06] pb-2.5">
          <p className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            <Target size={12} weight="bold" />
            Career readiness
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[18px] font-black tabular-nums text-slate-900">{pct(readiness)}%</span>
            {typeof roadmap?.readinessHeldCount === "number"
              && typeof roadmap?.readinessRequiredCount === "number" && (
              <span className="text-[10px] text-slate-500">
                {roadmap.readinessHeldCount} of {roadmap.readinessRequiredCount} essential skills
              </span>
            )}
          </div>
          {typeof readinessVerified === "number" && (
            <p className="mt-1 text-[10px] text-slate-500">
              <span className="font-semibold text-slate-700">{pct(readinessVerified)}%</span> of it
              backed by evidence rather than your own account.
            </p>
          )}
        </div>
      )}

      {autoPicked.length > 0 && (
        <div className="mb-2.5 border-b border-black/[0.06] pb-2.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            <SealCheck size={12} weight="bold" />
            Branches chosen for you
          </p>
          <ul className="flex flex-col gap-1.5">
            {autoPicked.map(selection => (
              <li key={selection.groupNodeId} className="text-[10.5px] leading-relaxed text-slate-600">
                {selection.autoReason}
              </li>
            ))}
          </ul>
          {/* Said plainly, because a suggestion the student cannot tell from a
              decision is one they will never think to overrule. */}
          <p className="mt-1.5 text-[10px] text-slate-400">
            Pick a different option on the map to change any of these.
          </p>
        </div>
      )}

      {topPriority.length > 0 && (
        <div className="mb-2.5 border-b border-black/[0.06] pb-2.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            <Target size={12} weight="bold" />
            Highest priority on the map
          </p>
          <ul className="flex flex-col gap-1">
            {topPriority.map(node => (
              <li key={node.id}>
                <button
                  type="button"
                  title={node.priorityReason || undefined}
                  onClick={() => onOpenNode?.({
                    nodeId: node.id,
                    nodeName: node.title,
                    description: node.description,
                    status: node.status,
                    resources: (node.resources ?? []).map(r => r.url)
                  } as PlanNode)}
                  className="flex w-full items-center gap-1.5 rounded-lg bg-slate-50/80 px-2 py-1 text-left ring-1 ring-black/[0.04] transition-colors hover:bg-slate-100"
                >
                  <span className="flex-1 truncate text-[10.5px] font-semibold text-slate-800">
                    {node.title}
                  </span>
                  {node.priorityLabel && (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ring-1 ${
                        PRIORITY_STYLE[node.priorityLabel] ?? PRIORITY_STYLE.NORMAL
                      }`}
                    >
                      {node.priorityLabel}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
        <Target size={12} weight="bold" />
        What to learn next
      </p>

      {plan?.summary && (
        <p className="text-[11px] leading-relaxed text-slate-600">{plan.summary}</p>
      )}

      {required > 0 && (
        <div className="mt-2.5 flex items-baseline gap-1.5 border-t border-black/[0.06] pt-2.5">
          <span className="text-[13px] font-black tabular-nums text-slate-900">
            {covered}/{required}
          </span>
          <span className="text-[10px] text-slate-500">core skills covered</span>
          {plan?.level && (
            <span className="ml-auto rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
              {plan.level}
            </span>
          )}
        </div>
      )}

      {steps.length === 0 ? (
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Nothing to add right now. Declaring more skills or finishing the assessment
          gives the plan more to work with.
        </p>
      ) : (
        <ol className="mt-3 flex flex-col gap-1.5">
          {steps.map((step: PlanStep) => {
            const isOpen = openStep === step.order
            return (
              <li key={step.skillId} className="rounded-xl bg-slate-50/80 ring-1 ring-black/[0.04]">
                <button
                  type="button"
                  onClick={() => setOpenStep(isOpen ? null : step.order)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-900 text-[10px] font-bold text-white tabular-nums">
                    {step.order}
                  </span>
                  <span className="flex-1 truncate text-[11px] font-semibold text-slate-800">
                    {step.skillName}
                  </span>
                  {step.importance && (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ring-1 ${
                        IMPORTANCE_STYLE[step.importance] ?? IMPORTANCE_STYLE.LOW
                      }`}
                    >
                      {step.importance}
                    </span>
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-black/[0.04] px-2.5 py-2">
                    {/* The reason comes first, before the material. A student who
                        disagrees with the reason should not have to read the
                        reading list to find out they can skip it. */}
                    {step.why && (
                      <p className="text-[10.5px] leading-relaxed text-slate-600">{step.why}</p>
                    )}

                    {step.currentProficiency != null && (
                      <p className="mt-1.5 text-[10px] text-slate-500">
                        Already at{" "}
                        <span className="font-semibold text-slate-700">
                          {PROFICIENCY_LABEL[step.currentProficiency] ?? step.currentProficiency}
                        </span>
                      </p>
                    )}

                    {step.nodes.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        {step.nodes.map(node => (
                          <button
                            key={node.nodeId}
                            type="button"
                            onClick={() => onOpenNode?.(node)}
                            className="truncate rounded-lg bg-white px-2 py-1 text-left text-[10.5px] text-slate-700 ring-1 ring-black/[0.05] transition-colors hover:bg-slate-100"
                          >
                            {node.nodeName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {/* "We left this out" is a claim about the student, so it travels with the
          evidence that earned it — including the absence of evidence, which is
          why a self-declared skill is not shown as if it were verified. */}
      {plan && plan.alreadyCovered.length > 0 && (
        <div className="mt-3 border-t border-black/[0.06] pt-2.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            <CheckCircle size={12} weight="bold" />
            Skipped — already covered
          </p>
          <ul className="flex flex-col gap-1">
            {plan.alreadyCovered.map(skip => (
              <li key={skip.skillId} className="flex items-center gap-1.5 text-[10.5px] text-slate-600">
                <span className="flex-1 truncate">{skip.skillName}</span>
                {skip.verifiedBy ? (
                  <span
                    title={`Verified by ${skip.verifiedBy.toLowerCase()}`}
                    className="flex shrink-0 items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-600"
                  >
                    <SealCheck size={11} weight="bold" />
                    {skip.verifiedBy}
                  </span>
                ) : (
                  <span className="shrink-0 text-[9px] font-medium uppercase tracking-wide text-slate-400">
                    self-declared
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

export default LearningPlanPanel
