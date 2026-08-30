// Pure transforms for the career self-assessment: raw API payload -> typed model.
// No API calls in here, mirroring studentDashboardNormalizers.

import type {
  AssessedSkill,
  AssessmentQuestion,
  AssessmentQuestionSet,
  AssessmentResult,
  StudentLevel,
} from '../types'

const numberOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

/** Unwrap a `{ data: T }` envelope, or return the payload unchanged. */
const unwrap = <T>(responseData: unknown): T => {
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    return (responseData as { data: T }).data
  }
  return responseData as T
}

const normalizeQuestion = (raw: any): AssessmentQuestion | null => {
  const skillId = raw?.skillId ?? raw?.skill_id
  const skillName = raw?.skillName ?? raw?.skill_name
  if (!skillId || !skillName) return null
  return {
    skillId: String(skillId),
    skillName: String(skillName),
    category: raw?.category ?? null,
    importance: raw?.importance ?? null,
    noteRequired: Boolean(raw?.noteRequired ?? raw?.note_required),
  }
}

export const normalizeAssessmentQuestionSet = (data: unknown): AssessmentQuestionSet => {
  const raw = unwrap<any>(data) ?? {}
  const questions = Array.isArray(raw.questions) ? raw.questions : []
  return {
    careerId: raw.careerId ?? raw.career_id ?? null,
    careerName: raw.careerName ?? raw.career_name ?? null,
    questions: questions
      .map(normalizeQuestion)
      .filter((q: AssessmentQuestion | null): q is AssessmentQuestion => q !== null),
    notice: raw.notice ?? null,
  }
}

const normalizeAssessedSkill = (raw: any): AssessedSkill | null => {
  const skillId = raw?.skillId ?? raw?.skill_id
  const skillName = raw?.skillName ?? raw?.skill_name
  if (!skillId || !skillName) return null
  return {
    skillId: String(skillId),
    skillName: String(skillName),
    declaredLevel: raw?.declaredLevel ?? raw?.declared_level ?? null,
    assessedLevel: raw?.assessedLevel ?? raw?.assessed_level ?? null,
    confidence: typeof raw?.confidence === 'number' ? raw.confidence : null,
    justification: raw?.justification ?? null,
  }
}

/**
 * Returns null for an empty body.
 *
 * The latest-result endpoint answers 204 when the student skipped the
 * assessment, and that has to stay distinguishable from a real result —
 * coercing it to an empty object would render a blank level badge as though
 * they had been graded.
 */
export const normalizeAssessmentResult = (data: unknown): AssessmentResult | null => {
  const raw = unwrap<any>(data)
  if (!raw || typeof raw !== 'object' || !(raw.assessmentId ?? raw.assessment_id)) return null

  const assessed = Array.isArray(raw.assessedSkills ?? raw.assessed_skills)
    ? (raw.assessedSkills ?? raw.assessed_skills)
    : []

  return {
    assessmentId: String(raw.assessmentId ?? raw.assessment_id),
    careerId: raw.careerId ?? raw.career_id ?? null,
    careerName: raw.careerName ?? raw.career_name ?? null,
    level: raw.level ?? null,
    rawLevel: raw.rawLevel ?? raw.raw_level ?? null,
    rationale: raw.rationale ?? null,
    coverage: typeof raw.coverage === 'number' ? raw.coverage : null,
    appliedNodeCount: Number(raw.appliedNodeCount ?? raw.applied_node_count ?? 0) || 0,
    assessedSkills: assessed
      .map(normalizeAssessedSkill)
      .filter((s: AssessedSkill | null): s is AssessedSkill => s !== null),
    computedAt: raw.computedAt ?? raw.computed_at ?? null,
  }
}

/** Null when the student has no level — never a placeholder FRESHER. */
export const normalizeStudentLevel = (data: unknown): StudentLevel | null => {
  const raw = unwrap<any>(data)
  if (!raw || typeof raw !== 'object' || !raw.level) return null
  return {
    level: raw.level,
    rationale: raw.rationale ?? null,
    source: raw.source ?? null,
    coverage: typeof raw.coverage === 'number' ? raw.coverage : null,
    verifiedCoverage: numberOrNull(raw.verifiedCoverage ?? raw.verified_coverage),
    verifiedFloor: numberOrNull(raw.verifiedFloor ?? raw.verified_floor),
    requiredCount: numberOrNull(raw.requiredCount ?? raw.required_count),
    heldCount: numberOrNull(raw.heldCount ?? raw.held_count),
    verifiedCount: numberOrNull(raw.verifiedCount ?? raw.verified_count),
    assessedAt: raw.assessedAt ?? raw.assessed_at ?? null,
  }
}
