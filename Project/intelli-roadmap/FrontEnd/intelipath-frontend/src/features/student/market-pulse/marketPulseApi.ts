import { ENDPOINTS, mainClient } from "@/shared/api"

/**
 * `days` narrows every figure to postings from the last N days. Omitting it keeps
 * the server's original all-time behaviour, so nothing that has not opted in
 * changes meaning.
 */
const marketPulseApi = {
  getTopHiringCompanies: (limit: number = 10, days?: number, careerId?: string | null, seniority?: string | null) =>
    mainClient.get(ENDPOINTS.MARKET_TRENDS.TOP_HIRING, {
      params: { limit, ...(days ? { days } : {}), ...(careerId ? { careerId } : {}), ...(seniority ? { seniority } : {}) },
    }),

  getTrendingSkills: (days?: number, careerId?: string | null, seniority?: string | null) =>
    mainClient.get(ENDPOINTS.MARKET_TRENDS.TRENDING_SKILLS, {
      params: { ...(days ? { days } : {}), ...(careerId ? { careerId } : {}), ...(seniority ? { seniority } : {}) },
    }),

  getSalaryOverview: (days?: number, careerId?: string | null, seniority?: string | null) =>
    mainClient.get(ENDPOINTS.MARKET_TRENDS.SALARY_OVERVIEW, {
      params: { ...(days ? { days } : {}), ...(careerId ? { careerId } : {}), ...(seniority ? { seniority } : {}) },
    }),

  /** How current the data behind the charts is — window, new jobs, latest posting. */
  getFreshness: (days: number = 30, careerId?: string | null, seniority?: string | null) =>
    mainClient.get(`${ENDPOINTS.MARKET_TRENDS.BASE}/freshness`, { params: {
      days, ...(careerId ? { careerId } : {}), ...(seniority ? { seniority } : {})
    } }),

  /**
   * `seniority` narrows the list to roles at that level. Postings whose level
   * could not be read are still returned — a job we could not label is still a
   * job the student may qualify for.
   */
  getRecruitmentPosts: (seniority?: string | null, careerId?: string | null) =>
    mainClient.get(ENDPOINTS.RECRUITMENT_POSTS.ALL, {
      params: { ...(seniority ? { seniority } : {}), ...(careerId ? { careerId } : {}) },
    }),
}

export default marketPulseApi
