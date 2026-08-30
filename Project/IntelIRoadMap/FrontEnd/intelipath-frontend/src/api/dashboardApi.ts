import { ENDPOINTS, mainClient } from "@/shared/api"

const dashboardApi = {
  getOverview: () =>
    mainClient.get(ENDPOINTS.STUDENT_DASHBOARD.OVERVIEW),
    
  getRoadmapProgress: () =>
    mainClient.get(ENDPOINTS.STUDENT_DASHBOARD.ROADMAP_PROGRESS),
  

  getMentorFeedback: () =>
    mainClient.get(ENDPOINTS.STUDENT_DASHBOARD.MENTOR_FEEDBACK),

  /** Persists the read flag. Returns 204; the caller reconciles its own optimistic state. */
  markMentorFeedbackRead: (id: string) =>
    mainClient.patch(ENDPOINTS.STUDENT_DASHBOARD.MENTOR_FEEDBACK_READ(id)),

  /** Soft-hides one item (server sets status DELETED) so it stays gone after a reload. */
  dismissMentorFeedback: (id: string) =>
    mainClient.delete(ENDPOINTS.STUDENT_DASHBOARD.MENTOR_FEEDBACK_DISMISS(id)),

  getRecommendations: () =>
    mainClient.get(ENDPOINTS.STUDENT_DASHBOARD.RECOMMENDATIONS),

  getMarketDemand: () =>
    mainClient.get(ENDPOINTS.STUDENT_DASHBOARD.MARKET_DEMAND),
  
  getAiHistory: () =>
    mainClient.get(ENDPOINTS.STUDENT_DASHBOARD.AI_HISTORY)
}

export default dashboardApi
