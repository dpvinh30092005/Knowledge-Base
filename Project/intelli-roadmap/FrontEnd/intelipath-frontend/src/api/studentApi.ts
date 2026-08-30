import type { AxiosRequestConfig } from "axios"
import { ENDPOINTS, mainClient, type RequestConfig } from "@/shared/api"

/** One mentor feedback row, normalized from the dashboard feedback endpoint. */
export interface StudentFeedbackItem {
  id: string;
  mentorName: string;
  mentorRole: string;
  type: string;
  submittedAt: string | number;
  content: string;
}

/** Mirrors backend MentorDirectoryResponse — one mentor a student can pick to review them. */
export interface MentorDirectoryEntry {
  userId: string;
  fullName: string;
  // The identifier request-review takes. Carried so the student never has to know it.
  email: string;
  avatarUrl: string | null;
  company: string | null;
  industryFocus: string | null;
}

const studentApi = {
  getFeedback: async (): Promise<StudentFeedbackItem[]> => {
    try {
      const res = await mainClient.get(ENDPOINTS.STUDENT_DASHBOARD.MENTOR_FEEDBACK);
      const data = res.data?.data || res.data;
      let results: StudentFeedbackItem[] = [];
      if (data && Array.isArray(data)) {
        results = data.map((fb: any) => ({
          id: fb.feedbackId || fb.id || Math.random().toString(),
          mentorName: fb.senderName || 'Reviewer',
          mentorRole: 'Professional Reviewer',
          type: fb.type || 'GENERAL',
          submittedAt: fb.createAt || Date.now(),
          content: fb.content || ''
        }));
      }

      return results;
    } catch {
      return [];
    }
  },

  /**
   * Sends the student's reply back to whoever wrote the feedback.
   *
   * Errors are deliberately NOT swallowed here: this used to return a hardcoded
   * success without calling anything, so the reply silently vanished while the UI
   * confirmed it had been sent. The caller must be able to tell the difference.
   */
  replyFeedback: async (feedbackId: string, content: string) => {
    const res = await mainClient.post(
      ENDPOINTS.STUDENT_DASHBOARD.MENTOR_FEEDBACK_REPLY(feedbackId),
      { content }
    )
    return res.data?.data ?? res.data
  },

  // Mentors the student can ask for a review. Fetched as one page rather than paged in the
  // UI: the roster is small enough to filter in the browser, and someone choosing a reviewer
  // wants to compare the whole list rather than click through it.
  getMentorDirectory: async (): Promise<MentorDirectoryEntry[]> => {
    const res = await mainClient.get(
      ENDPOINTS.MENTOR_DIRECTORY.LIST,
      { params: { page: 0, size: 100 }, skipErrorToast: true } as AxiosRequestConfig & RequestConfig
    );
    return res.data?.content ?? [];
  },

  requestPortfolioReview: async (mentorEmail: string) => {
    // We send the email to the backend, backend maps to mentor_id and creates portfolio_review_requests.
    // skipErrorToast: RequestReviewModal already renders its own inline error banner —
    // without this the global interceptor's toast duplicates the same message.
    const res = await mainClient.post(
      ENDPOINTS.STUDENT.PORTFOLIO_REQUEST_REVIEW,
      { email: mentorEmail },
      { skipErrorToast: true } as AxiosRequestConfig & RequestConfig
    );
    return res.data;
  }
}

export default studentApi;
