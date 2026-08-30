export type RoadmapStep = {
  id: string
  // Original: status: "completed" | "current" | "locked"
  status: RoadmapNodeStatus
  title: string
  /**
   * The node this one sits under. A bare title is not always a task: "$eq" is
   * meaningless until you know it is a MongoDB comparison operator.
   */
  parentTitle?: string | null
  /** Tree depth — a depth-4 leaf is a detail, not a milestone. */
  depth?: number | null
}

// Original: export type RoadmapNodeStatus = "completed" | "current" | "locked"
// "alternative" = an unchosen option inside a decided CHOOSE_ONE group (greyed, not on the path).
export type RoadmapNodeStatus = "completed" | "current" | "locked" | "in_progress" | "alternative"

/** One stored choose-one decision, e.g. "Java" picked within "Pick a Language". */
export type NodeSelection = {
  groupNodeId: string
  groupNodeName?: string
  chosenNodeId: string
  chosenNodeName?: string
  createdAt?: string
  /**
   * True when the system picked this branch rather than the student.
   *
   * Worth telling them apart: an auto-pick is a suggestion they are entitled to
   * overrule, and presenting it as their own past decision quietly removes the
   * invitation to disagree with it.
   */
  autoSelected?: boolean | null
  /** Why, in their own numbers — "you already have Spring Boot at PROFESSIONAL (verified)". */
  autoReason?: string | null
}

/** One alternative of a CHOOSE_ONE group, ranked against its siblings. */
export type ChoiceOption = {
  nodeId: string
  name: string
  /** Fit relative to the strongest option in the group, 0..1. */
  fitScore: number | null
  /** Only set on the option the scorer would have picked. */
  fitReason: string | null
  matchedSkills: { skillName?: string; proficiency?: number; verified?: boolean }[]
  /** Null, not zero, when no posting data exists — the two say different things. */
  marketFrequency: number | null
  marketJobCount: number | null
  /** The skill the count was measured over — the key for opening the postings behind it. */
  skillId: string | null
  nodeCount: number | null
  chosen: boolean
  autoSelected: boolean
  /**
   * Safe to highlight. False for every option unless the ranking was DECISIVE,
   * so a tie or an empty profile can never produce a recommendation the student
   * would be unable to tell apart from a real one.
   */
  recommended: boolean
}

export type ChoiceOptions = {
  groupNodeId: string
  groupName: string
  /** `DECISIVE` · `TOO_CLOSE` · `NO_SIGNAL`. */
  verdict: string
  options: ChoiceOption[]
}

export type RoadmapResource = {
  title: string
  url: string
  type?: string
}

export type RoadmapNode = {
  id: string
  title: string
  status: RoadmapNodeStatus
  description?: string
  level?: number
  resources: RoadmapResource[]
  children: RoadmapNode[]
  /** 0..1 — the score the backend already ordered this roadmap by. */
  priorityScore?: number | null
  priorityLabel?: 'CRITICAL' | 'HIGH' | 'NORMAL' | string | null
  /** One clause per term of the score, each traceable to a number. */
  priorityReason?: string | null
}

export type RoadmapProgress = {
  steps: RoadmapStep[]
  aiTip?: string
}

/** A standalone roadmap under the career — a language, a framework, a DB track. */
export type SubRoadmap = {
  nodeId: string
  name: string | null
  description: string | null
  nodeCount: number | null
  completedCount: number | null
  chosen: boolean | null
}

/** One step of the trail back out: `nodeId` is null for the career itself. */
export type RoadmapCrumb = {
  nodeId: string | null
  name: string | null
}

export type StudentRoadmap = {
  targetCareerRole?: string
  progress?: number
  nodes: RoadmapNode[]
  /** Roadmaps to enter rather than steps on this path. */
  subRoadmaps?: SubRoadmap[]
  /** Present only inside a sub-roadmap; absent at the career root. */
  breadcrumb?: RoadmapCrumb[]
  /**
   * Share of the career's essential skills held, 0..1 — a different measure from
   * `progress`, which counts nodes ticked off on this view.
   */
  readiness?: number | null
  /** The part of `readiness` backed by evidence rather than self-report. */
  readinessVerified?: number | null
  readinessRequiredCount?: number | null
  readinessHeldCount?: number | null
  readinessVerifiedCount?: number | null
  /**
   * The skills those counts are over, one row each, held or missing.
   *
   * Carries the readiness denominator itself and not only its size, so the skill
   * map draws the very set the level badge counts.
   */
  coreSkills?: CoreSkill[] | null
  /** The untouched API payload, kept so the graph builder can render from the
   *  same fetch instead of hitting the roadmap endpoint a second time. */
  _rawResponse?: unknown
}

/**
 * One skill the target career is graded on, whether or not the student has it.
 *
 * A missing skill is a row with `proficiency: null` — the map draws it as a
 * hollow bubble. An absent row would say nothing; an empty bubble says "gap".
 */
export type CoreSkill = {
  skillId: string
  skillName: string
  /** HIGH today: the core set is HIGH-importance only. */
  importance?: string | null
  /** 1..4, or null when not held at a level that counts (APPLIED and up). */
  proficiency?: number | null
  /** GITHUB | TRANSCRIPT | MENTOR, null for a self-report. */
  verifiedBy?: string | null
  marketDemand?: {
    relevance?: number | null
    frequency?: number | null
    jobCount?: number | null
    sampleSize?: number | null
    reason?: string | null
  } | null
}

/**
 * How close one career sits to the student's declared skills.
 *
 * A suggestion, never a decision — nothing behind this endpoint changes the
 * student's target career. The counts travel with the score because a student
 * can argue with "9 of Backend's 29 essential skills" and cannot argue with a
 * bare 0.73.
 */
export type CareerAffinity = {
  careerId: string
  careerName: string
  /** 0 = identical skill sets, 1 = nothing in common. Lower is closer. */
  jaccardDistance?: number | null
  matched?: number | null
  required?: number | null
  topMatchingSkills?: string[] | null
  /** True for the career the student has already chosen. */
  current?: boolean | null
}

export type CareerRole = {
  careerId: string
  careerName: string
  prerequisite?: string
  description?: string
}

export type SkillItem = {
  skillId: string
  skillName: string
  category: string
  career: string
}

export type RequiredSkill = {
  skill: SkillItem
  importanceLevel: string
  progress?: number
}

export type SkillResponse = {
  selectedSkills: SkillItem[]
  skills: SkillItem[]
  requiredSkills: RequiredSkill[]
  missingSkills: SkillItem[]
  careerSkillGaps: CareerSkillGap[]
  marketSkillGaps: MarketSkillGap[]
  /**
   * Roadmap nodes the declaration just marked as already covered.
   *
   * <p>Filled only by the select endpoint — a receipt for something that just
   * happened, not a property of the skill list. Empty everywhere else.
   */
  markedNodeIds: string[]
}

export type CareerSkillGap = {
  skillId: string
  skillName: string
  category: string
  importance: string
}

export type MarketSkillGap = {
  skillId: string
  skillName: string
  demand: NonNullable<CoreSkill['marketDemand']>
}

export type SkillGap = {
  id: string
  type: "critical" | "market"
  severity: string
  title: string
  description: string
  progress?: number
}

export type MentorFeedback = {
  id: string
  name: string
  time: string
  text: string
}

export type AiHistoryItem = {
  id: string
  tag: string
  title: string
  preview: string
}

export type Recommendation = {
  id: string
  icon: "Network" | string
  type: string
  title: string
  description: string
}

export type MarketDemand = {
  growth: number
  role: string
  /** Job count per calendar week, oldest first. */
  chart: number[]
  /** One label per `chart` point, e.g. "27 Jul" — the Monday that week starts on. */
  chartLabels?: string[]
}

export type DashboardLoadStatus = "loading" | "success" | "error"

export type StudentSetupStep = "profile" | "skills" | "assessment" | null

// ─── Career self-assessment ────────────────────────────────────
/** What the student can claim about one skill. NONE means they do not have it. */
export type ProficiencyChoice = "NONE" | "AWARE" | "PRACTICED" | "APPLIED" | "PROFESSIONAL"

/**
 * All six rungs of the backend's SeniorityLevel.LADDER.
 *
 * BEGINNER and EXPERT are not edge cases. One assessment grades at most 15
 * skills and Backend's core set is 181, so 15/181 = 8.3% lands under the FRESHER
 * band every time — BEGINNER is the ordinary first result. Typing this as four
 * values meant a real backend response fell outside the type, and the result
 * screen looked up a blurb that was not there and rendered nothing.
 */
export type SeniorityLevel =
  | "BEGINNER"
  | "FRESHER"
  | "JUNIOR"
  | "MID"
  | "SENIOR"
  | "EXPERT"

export type AssessmentQuestion = {
  skillId: string
  skillName: string
  category?: string | null
  /** HIGH | AVG | LOW — how much the target career needs this skill. */
  importance?: string | null
  /** When true, an APPLIED or PROFESSIONAL answer must carry a written note. */
  noteRequired: boolean
}

export type AssessmentQuestionSet = {
  careerId?: string | null
  careerName?: string | null
  questions: AssessmentQuestion[]
  /** Set when the career has no skill data, in which case questions is empty. */
  notice?: string | null
}

export type AssessmentAnswer = {
  skillId: string
  level: ProficiencyChoice
  note?: string
}

export type AssessedSkill = {
  skillId: string
  skillName: string
  declaredLevel?: string | null
  /** Lower than declaredLevel when the written note did not support the claim. */
  assessedLevel?: string | null
  confidence?: number | null
  justification?: string | null
}

export type AssessmentResult = {
  assessmentId: string
  careerId?: string | null
  careerName?: string | null
  level?: SeniorityLevel | null
  /** What the model concluded before the deterministic ceiling was applied. */
  rawLevel?: string | null
  rationale?: string | null
  coverage?: number | null
  /** Roadmap nodes this run marked as already covered. Zero is a normal outcome. */
  appliedNodeCount: number
  assessedSkills: AssessedSkill[]
  computedAt?: string | null
}

/**
 * The student's level. A null result everywhere means they skipped the
 * assessment — which is not the same as FRESHER, and must render as "no level",
 * never as a beginner badge.
 */
export type StudentLevel = {
  level: SeniorityLevel
  rationale?: string | null
  source?: string | null
  coverage?: number | null
  /** Below verifiedFloor the level is capped at JUNIOR; explains an unexpectedly low result. */
  verifiedCoverage?: number | null
  /** The ceiling threshold, sent by the backend so it is not hardcoded twice. */
  verifiedFloor?: number | null
  /** Denominator behind both coverage figures. */
  requiredCount?: number | null
  /** Of those, held at APPLIED or above. */
  heldCount?: number | null
  /** Of those held, how many have objective evidence. Exact, not derived from a ratio. */
  verifiedCount?: number | null
  assessedAt?: string | null
}

// ─── Roadmap Personalization (AI recommendations) ──────────────
export type RoadmapRecommendationAction =
  | "MARK_COMPLETE" | "SKIP" | "UNLOCK" | "PRIORITIZE" | "ADD" | "REMOVE"

export type RoadmapRecommendationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED"

export type RoadmapRecommendationItem = {
  recItemId: string
  nodeId: string
  nodeName: string | null
  action: RoadmapRecommendationAction
  reason: string | null
  confidence: number | null
  evidenceIds: string[] | null
}

export type RoadmapRecommendation = {
  recommendationId: string
  type: string
  title: string | null
  summary: string | null
  reason: string | null
  confidence: number | null
  status: RoadmapRecommendationStatus
  createdAt: string
  decidedAt: string | null
  items: RoadmapRecommendationItem[]
}

export type RoadmapRecommendationDecision = {
  recommendationId: string
  status: RoadmapRecommendationStatus
  decidedAt: string | null
  roadmapProgress: number | null
}

// ─── Learning plan ──────────────────────────────────────────────
// The inverse of StudentRoadmap. That type describes what the career's catalog
// contains; this one describes what THIS student should do next and on what
// evidence, so every field that makes a claim about the student carries the
// reason for it.

export type PlanNode = {
  nodeId: string
  nodeName: string | null
  description: string | null
  /** completed | in_progress | current | locked */
  status: string | null
  resources: string[] | null
}

export type PlanStep = {
  order: number
  skillId: string
  skillName: string | null
  /** HIGH | AVG | LOW */
  importance: string | null
  marketDemand: { jobsNeeded?: number; totalJobs?: number; frequency?: number } | null
  /** Why this step is next, naming the numbers behind it. */
  why: string | null
  currentProficiency: number | null
  nodes: PlanNode[]
}

export type PlanSkip = {
  skillId: string
  skillName: string | null
  proficiency: number | null
  /** TRANSCRIPT | GITHUB | MENTOR, or null when self-declared. */
  verifiedBy: string | null
}

export type LearningPlan = {
  targetCareerRole: string | null
  level: string | null
  summary: string | null
  requiredSkillCount: number | null
  coveredSkillCount: number | null
  steps: PlanStep[]
  alreadyCovered: PlanSkip[]
}
