// Pure transforms for the graded assessment: raw API payload -> typed model.
// No API calls in here, mirroring assessmentNormalizers.

import type {
  AssessmentChoice,
  AssessmentItemKind,
  GradedAssessmentItem,
  GradedAssessmentPaper,
  GradedAssessmentResult,
  GradedItemResult,
} from './gradedAssessmentTypes'

const KINDS: AssessmentItemKind[] = ['SINGLE_CHOICE', 'MULTI_CHOICE', 'SHORT_ANSWER', 'CODE']

const numberOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const unwrap = <T>(responseData: unknown): T => {
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    return (responseData as { data: T }).data
  }
  return responseData as T
}

const normalizeChoice = (raw: any): AssessmentChoice | null => {
  if (!raw?.key) return null
  return { key: String(raw.key), text: String(raw.text ?? raw.key) }
}

/**
 * An item is dropped when it could not be answered — no id, no prompt, or an
 * unrecognised kind. Dropping is right rather than rendering a broken card: an
 * item the student cannot answer still counts against them when the server grades
 * the paper, so showing it half-rendered is worse than showing a shorter paper.
 */
const normalizeItem = (raw: any): GradedAssessmentItem | null => {
  const id = raw?.id
  const kind = String(raw?.kind ?? '') as AssessmentItemKind
  if (!id || !raw?.prompt || !KINDS.includes(kind)) return null
  return {
    id: String(id),
    kind,
    tier: numberOrNull(raw?.tier) ?? 1,
    topic: String(raw?.topic ?? ''),
    prompt: String(raw.prompt),
    choices: Array.isArray(raw?.choices)
      ? (raw.choices.map(normalizeChoice).filter(Boolean) as AssessmentChoice[])
      : [],
    language: raw?.language ? String(raw.language) : null,
    starterCode: raw?.starterCode ?? raw?.starter_code ?? null,
    points: numberOrNull(raw?.points) ?? 1,
  }
}

/**
 * Null means "this career has no paper", which the endpoint says with a 204 and
 * an empty body. The caller falls back to the self-report question set — it is a
 * normal state for the five careers whose banks are not written yet, not an error.
 */
export const normalizeGradedPaper = (responseData: unknown): GradedAssessmentPaper | null => {
  const data = unwrap<any>(responseData)
  if (!data || !Array.isArray(data.items)) return null
  const items = data.items.map(normalizeItem).filter(Boolean) as GradedAssessmentItem[]
  if (items.length === 0) return null
  return {
    careerId: data.careerId ? String(data.careerId) : null,
    careerName: data.careerName ? String(data.careerName) : null,
    scope: String(data.scope ?? ''),
    version: numberOrNull(data.version) ?? 1,
    items,
  }
}

const normalizeItemResult = (raw: any): GradedItemResult | null => {
  if (!raw?.id) return null
  return {
    id: String(raw.id),
    topic: String(raw?.topic ?? ''),
    tier: numberOrNull(raw?.tier) ?? 1,
    // Tri-state on purpose: `null` is "not a yes/no question", and collapsing it
    // to false would tell a student their code answer was wrong.
    correct: typeof raw?.correct === 'boolean' ? raw.correct : null,
    awarded: numberOrNull(raw?.awarded) ?? 0,
    possible: numberOrNull(raw?.possible) ?? 0,
    correctKeys: Array.isArray(raw?.correctKeys) ? raw.correctKeys.map(String) : [],
    explanation: raw?.explanation ? String(raw.explanation) : null,
    feedback: raw?.feedback ? String(raw.feedback) : null,
  }
}

export const normalizeGradedResult = (responseData: unknown): GradedAssessmentResult | null => {
  const data = unwrap<any>(responseData)
  if (!data?.level) return null
  return {
    assessmentId: data.assessmentId ? String(data.assessmentId) : null,
    level: String(data.level),
    objectiveLevel: data.objectiveLevel ? String(data.objectiveLevel) : null,
    objectiveScore: numberOrNull(data.objectiveScore),
    rubricScore: numberOrNull(data.rubricScore),
    tierReach: numberOrNull(data.tierReach) ?? 0,
    rationale: data.rationale ? String(data.rationale) : null,
    evidencedSkillCount: numberOrNull(data.evidencedSkillCount) ?? 0,
    appliedNodeCount: numberOrNull(data.appliedNodeCount) ?? 0,
    markedNodeIds: Array.isArray(data.markedNodeIds) ? data.markedNodeIds.map(String) : [],
    items: Array.isArray(data.items)
      ? (data.items.map(normalizeItemResult).filter(Boolean) as GradedItemResult[])
      : [],
  }
}
