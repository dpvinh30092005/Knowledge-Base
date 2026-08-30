import { ENDPOINTS, mainClient } from '@/shared/api'

export interface SubmitAssessmentPayload {
  answers: {
    skillId: string
    /** NONE | AWARE | PRACTICED | APPLIED | PROFESSIONAL */
    level: string
    note?: string
  }[]
}

/**
 * The optional career self-assessment.
 *
 * `getLatest` and `getLevel` answer 204 when the student has never taken it,
 * which axios surfaces as a 200-family response with an empty body — callers
 * must treat that as "no result", not as an error.
 */
export interface SubmitGradedAssessmentPayload {
  answers: {
    itemId: string
    /** Selected option keys. Absent or empty means unanswered, which scores zero. */
    choiceKeys?: string[]
    /** Prose or code, for the rubric-graded kinds. */
    text?: string
  }[]
}

const assessmentApi = {
  getQuestions: () => mainClient.get(ENDPOINTS.STUDENT.ASSESSMENT_QUESTIONS),

  /**
   * The graded paper for the student's career.
   *
   * Answers 204 with an empty body when that career has no bank yet, which is a
   * normal state and not an error — the caller falls back to `getQuestions`.
   */
  getPaper: () => mainClient.get(ENDPOINTS.STUDENT.ASSESSMENT_PAPER),

  submitPaper: (payload: SubmitGradedAssessmentPayload) =>
    mainClient.post(ENDPOINTS.STUDENT.ASSESSMENT_PAPER_SUBMIT, payload),

  submit: (payload: SubmitAssessmentPayload) =>
    mainClient.post(ENDPOINTS.STUDENT.ASSESSMENT_SUBMIT, payload),

  getLatest: () => mainClient.get(ENDPOINTS.STUDENT.ASSESSMENT_LATEST),

  getLevel: () => mainClient.get(ENDPOINTS.STUDENT.LEVEL),

  /** Careers ranked by skill overlap. Advisory: it never changes the target career. */
  getCareerAffinity: (limit?: number) =>
    mainClient.get(ENDPOINTS.STUDENT.CAREER_AFFINITY, { params: limit ? { limit } : undefined }),
}

export default assessmentApi
