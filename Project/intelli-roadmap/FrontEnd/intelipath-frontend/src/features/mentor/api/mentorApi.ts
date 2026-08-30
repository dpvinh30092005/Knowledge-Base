import { ENDPOINTS, mainClient } from "@/shared/api"
import type { AxiosRequestConfig } from "axios"
import type { RequestConfig } from "@/shared/api/httpClient"
import { mapToFrontendData, type GithubImportAudit } from "@/features/shared/portfolio/api/portfolioApi"

/**
 * Mentor Dashboard API.
 *
 * Errors are deliberately NOT caught here. Every function used to end in
 * `catch { return [] }`, which meant a 500 from the backend rendered as an empty
 * dashboard with no message — indistinguishable from "you have no students yet",
 * and invisible during a demo. Shape normalisation stays; failure handling belongs
 * to the view, which is the only layer that can tell the mentor something is wrong.
 */

/** Unwraps `{data: …}` envelopes and page objects into a plain array. */
const toArray = (payload: unknown): any[] => {
  const data = (payload as any)?.data?.data ?? (payload as any)?.data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data)) return data
  return []
}

const toObject = (payload: unknown) => (payload as any)?.data?.data ?? (payload as any)?.data

const mentorApi = {
  getWelcomeAlert: async () => {
    return await mainClient.get(ENDPOINTS.MENTOR_DASHBOARD.WELCOME_ALERT)
  },

  getMetrics: async () => toObject(await mainClient.get(ENDPOINTS.MENTOR_DASHBOARD.METRICS)),

  getPendingReviews: async (page = 0, size = 10) =>
    toArray(await mainClient.get(ENDPOINTS.MENTOR_DASHBOARD.PENDING_REVIEWS, { params: { page, size } })),

  getInsight: async () => toObject(await mainClient.get(ENDPOINTS.MENTOR_DASHBOARD.INSIGHT)),

  getCareerDistribution: async () =>
    toArray(await mainClient.get(ENDPOINTS.MENTOR_DASHBOARD.CAREER_DISTRIBUTION)),

  getStudentsList: async (page = 0, size = 10) =>
    toArray(await mainClient.get(ENDPOINTS.MENTOR_DASHBOARD.STUDENT_LIST, { params: { page, size } })),

  getStudentPortfolio: async (slug: string) => {
    const res = await mainClient.get(`/public-portfolio/slug/${slug}`)
    return mapToFrontendData(res.data?.data ?? res.data)
  },

  // This reads the already-stored audit snapshot. The backend verifies that the
  // student requested a portfolio review from the authenticated mentor first.
  getStudentGithubAudit: async (studentId: string, repoUrl: string): Promise<GithubImportAudit | null> => {
    try {
      const response = await mainClient.get(ENDPOINTS.MENTOR.PORTFOLIO_AUDIT, {
        params: { studentId, repoUrl },
        skipErrorToast: true,
      } as AxiosRequestConfig & RequestConfig)
      return response.data?.data ?? response.data
    } catch (error: any) {
      if (error?.response?.status === 404) return null
      throw error
    }
  },

  getFeedbackHistory: async () =>
    toArray(await mainClient.get(ENDPOINTS.MENTOR_DASHBOARD.FEEDBACK_HISTORY)),

  /**
   * Throws on failure rather than returning `{ success: false }`: the caller was
   * free to ignore that flag, and a feedback message the mentor believes was sent
   * but never left the browser is the worst outcome available here.
   */
  submitFeedback: async (receiverId: string, payload: { type: string; content: string }) => {
    const res = await mainClient.post(ENDPOINTS.MENTOR_DASHBOARD.SUBMIT_FEEDBACK, { receiverId, ...payload })
    return res.data?.data ?? res.data
  },

  getProgressReports: async () => toObject(await mainClient.get(ENDPOINTS.MENTOR_DASHBOARD.PROGRESS_REPORTS)),
}

export default mentorApi
