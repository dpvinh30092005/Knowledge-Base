import { isAxiosError } from 'axios'
import assessmentApi from './assessmentApi'
import { normalizeGradedPaper, normalizeGradedResult } from './gradedAssessmentNormalizers'
import type {
  GradedAnswerDraft,
  GradedAssessmentPaper,
  GradedAssessmentResult,
} from './gradedAssessmentTypes'
import {
  normalizeAssessmentQuestionSet,
  normalizeAssessmentResult,
  normalizeStudentLevel,
} from './assessmentNormalizers'
import type { AssessmentAnswer, AssessmentQuestionSet, AssessmentResult, StudentLevel } from '../types'

/**
 * The career self-assessment, as its own module rather than another set of
 * methods on the shared dashboard service.
 *
 * <p>Three unrelated features read the level it produces, and the assessment
 * itself is optional — keeping it separate means none of them has to import the
 * dashboard service to ask a question about levels, and removing the feature
 * would not touch a shared file.
 */
export const assessmentService = {
  getQuestions: async (): Promise<AssessmentQuestionSet> => {
    const response = await assessmentApi.getQuestions()
    return normalizeAssessmentQuestionSet(response.data)
  },

  submit: async (answers: AssessmentAnswer[]): Promise<AssessmentResult | null> => {
    const payload = {
      answers: answers.map(({ skillId, level, note }) => ({
        skillId,
        level,
        ...(note && note.trim() ? { note: note.trim() } : {}),
      })),
    }
    const response = await assessmentApi.submit(payload)
    return normalizeAssessmentResult(response.data)
  },

  /**
   * The graded paper for this student's career, or null when that career has no
   * bank. Null is a routing decision, not a failure: the caller shows the
   * self-report form instead.
   */
  getPaper: async (): Promise<GradedAssessmentPaper | null> => {
    const response = await assessmentApi.getPaper()
    return normalizeGradedPaper(response.data)
  },

  submitPaper: async (
    drafts: Record<string, GradedAnswerDraft>
  ): Promise<GradedAssessmentResult | null> => {
    // Every item is sent, answered or not. An omitted item would be a question
    // the server never sees an answer to, and "unanswered" has to be a recorded
    // zero rather than a gap the grader has to guess at.
    const payload = {
      answers: Object.entries(drafts).map(([itemId, draft]) => ({
        itemId,
        ...(draft.choiceKeys.length ? { choiceKeys: draft.choiceKeys } : {}),
        ...(draft.text.trim() ? { text: draft.text.trim() } : {}),
      })),
    }
    const response = await assessmentApi.submitPaper(payload)
    return normalizeGradedResult(response.data)
  },

  /** Null when the student never took it — a normal state, not an error. */
  getLatest: async (): Promise<AssessmentResult | null> => {
    const response = await assessmentApi.getLatest()
    return normalizeAssessmentResult(response.data)
  },

  /** Null when the student has no level. Callers must not substitute FRESHER. */
  getLevel: async (): Promise<StudentLevel | null> => {
    const response = await assessmentApi.getLevel()
    return normalizeStudentLevel(response.data)
  },
}

export const getAssessmentErrorMessage = (error: unknown): string => {
  if (!isAxiosError(error)) return 'Cannot connect to server.'

  const backendMessage =
    typeof error.response?.data === 'object' && error.response?.data
      ? (error.response.data as { message?: string }).message
      : undefined
  if (backendMessage) return backendMessage

  switch (error.response?.status) {
    case 400:
      return 'Some answers could not be read. Check the highlighted questions and try again.'
    case 401:
      return 'Your session expired. Sign in again to continue.'
    default:
      return 'Could not grade your answers right now. Try again in a moment.'
  }
}
