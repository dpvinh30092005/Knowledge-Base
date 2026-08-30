import { ENDPOINTS, mainClient } from "@/shared/api"

import type {
  UpdateCounselorProfilePayload,
  CareerStatistics,
  CounselorResponse,
  MissingSkillItem,
  Feedback,
  FeedbackListResponse,
  MyStudent,
  CreateFeedback,
  PaginatedStudentResponse,
  ImportStudentAccount
} from "../types"

export type {
  UpdateCounselorProfilePayload,
  CareerStatistics,
  CounselorResponse,
  MissingSkillItem,
  Feedback,
  FeedbackListResponse,
  MyStudent,
  CreateFeedback,
  PaginatedStudentResponse
}

/**
 * Đóng gói payload thành FormData theo chuẩn multipart/form-data.
 *
 * Lý do dùng Blob cho phần "message":
 *   - Backend yêu cầu phần JSON phải có Content-Type là "application/json".
 *   - Nếu append thẳng chuỗi string, trình duyệt sẽ gửi Content-Type là "text/plain" → backend bị lỗi.
 *   - Bọc JSON trong Blob cho phép chỉ định Content-Type chính xác là "application/json".
 */
const buildFeedbackFormData = (payload: any): FormData => {
  const formData = new FormData()

  // Tách attachments ra, phần còn lại sẽ được đóng gói thành JSON request
  const { attachments, ...requestPayload } = payload

  // Phần 1: Thêm thông tin tin nhắn dưới dạng JSON (gói vào Blob để đặt đúng Content-Type)
  formData.append(
    "request",
    new Blob([JSON.stringify(requestPayload)], { type: "application/json" })
  )

  // Phần 2: Thêm từng file đính kèm (nếu có)
  if (attachments?.length) {
    attachments.forEach((file: File) => formData.append("files", file))
  }
  return formData
}

const counselorApi = {
  // getStudentsMetric: async () => {
  //   return await mainClient.get(ENDPOINTS.COUNSELOR_DASHBOARD.METRICS_STUDENTS)
  // },
  // getStudentsMetric: async () => {
  //   return await mainClient.get(ENDPOINTS.COUNSELOR_DASHBOARD.METRICS_STUDENTS)
  // },

  // getProgressMetric: async () => {
  //   return await mainClient.get(ENDPOINTS.COUNSELOR_DASHBOARD.METRICS_PROGRESS)
  // },
  // getProgressMetric: async () => {
  //   return await mainClient.get(ENDPOINTS.COUNSELOR_DASHBOARD.METRICS_PROGRESS)
  // },

  // getAtRiskMetric: async () => {
  //   return await mainClient.get(ENDPOINTS.COUNSELOR_DASHBOARD.METRICS_AT_RISK)
  // },
  // getAtRiskMetric: async () => {
  //   return await mainClient.get(ENDPOINTS.COUNSELOR_DASHBOARD.METRICS_AT_RISK)
  // },

  // getEngagementMetric: async () => {
  //   return await mainClient.get(
  //     ENDPOINTS.COUNSELOR_DASHBOARD.METRICS_ENGAGEMENT
  //   )
  // },
  // getEngagementMetric: async () => {
  //   return await mainClient.get(
  //     ENDPOINTS.COUNSELOR_DASHBOARD.METRICS_ENGAGEMENT
  //   )
  // },

  // getLearningActivity: async () => {
  //   return await mainClient.get(ENDPOINTS.COUNSELOR_DASHBOARD.LEARNING_ACTIVITY)
  // },
  //---------- counselor dashboard
  getCareerDistribution: async (): Promise<CareerStatistics[]> => {
    const res = await mainClient.get(
      ENDPOINTS.COUNSELOR_DASHBOARD.CAREER_DISTRIBUTION
    )
    return res.data
  },

  getCurriculums: async (): Promise<{ curriculums: string[] }> => {
    const res = await mainClient.get(ENDPOINTS.COUNSELOR_DASHBOARD.CURRICULUMS)
    return res.data
  },

  getSkillMissing: async (careerName: string): Promise<CounselorResponse> => {
    const url = `${ENDPOINTS.COUNSELOR_DASHBOARD.MISSING_SKILLS}/${encodeURIComponent(careerName)}`
    const res = await mainClient.get(url)
    return res.data
  },

  getFeedback: async (): Promise<FeedbackListResponse> => {
    const res = await mainClient.get(
      ENDPOINTS.COUNSELOR_DASHBOARD.GET_STUDENT_FEEDBACK
    )
    const data = res.data?.data || res.data
    if (data && Array.isArray(data.content)) return { feedbacks: data.content }
    if (Array.isArray(data)) return { feedbacks: data }
    return data
  },
  // counselor feedbackS
  getMyStudent: async (
    page: number = 0,
    size: number = 7,
    search?: string,
    career?: string,
    signal?: AbortSignal
  ): Promise<PaginatedStudentResponse> => {
    const searchParam =
      search && search.trim() ? encodeURIComponent(search.trim()) : ""
    const careerParam =
      career && career.trim() ? encodeURIComponent(career.trim()) : ""
    let url = `${ENDPOINTS.COUNSELOR_DASHBOARD.GET_STUDENT_LIST}?page=${page}&size=${size}`
    if (searchParam) url += `&search=${searchParam}`
    if (careerParam) url += `&career=${careerParam}`

    try {
      const res = await mainClient.get(url, { signal })
      const data = res.data?.data || res.data

      return {
        totalPages: data?.totalPages ?? 1,
        currentPage: data?.currentPage ?? 0,
        careers: data?.careers ?? [],
        students: data?.students ?? data?.content ?? []
      }
    } catch {
      return { totalPages: 1, currentPage: 0, careers: [], students: [] }
    }
  },
  // New Add
  getStudentInfo: async (
    studentId: string,
    signal?: AbortSignal
  ): Promise<any> => {
    const res = await mainClient.get(
      ENDPOINTS.COUNSELOR_DASHBOARD.GET_STUDENT_INFO(studentId),
      { signal }
    )
    return res.data?.data || res.data
  },
  getHistoryFeedback: async (
    studentId: string
  ): Promise<FeedbackListResponse> => {
    const res = await mainClient.get(
      ENDPOINTS.COUNSELOR_DASHBOARD.GET_STUDENT_INFO(studentId)
    )
    return res.data
  },
  createFeedback: async (payload: CreateFeedback): Promise<CreateFeedback> => {
    const res = await mainClient.post(
      ENDPOINTS.COUNSELOR_DASHBOARD.CREATE_FEEDBACK,
      buildFeedbackFormData(payload),
      // Let the browser set multipart/form-data with the boundary (mainClient
      // otherwise forces application/json).
      {
        transformRequest: [
          (data, headers) => {
            delete headers["Content-Type"]
            return data
          }
        ]
      }
    )
    return res.data
  },
  modifyFeedback: async (payload: {
    feedbackId: string
    content: string
    type: string
    attachments?: File[]
  }): Promise<any> => {
    const res = await mainClient.patch(
      ENDPOINTS.COUNSELOR_DASHBOARD.MODIFY_FEEDBACK,
      buildFeedbackFormData(payload),
      // Let the browser set multipart/form-data with the boundary (mainClient
      // otherwise forces application/json).
      {
        transformRequest: [
          (data, headers) => {
            delete headers["Content-Type"]
            return data
          }
        ]
      }
    )
    return res.data
  },
  deleteFeedback: async (feedbackId: string): Promise<any> => {
    const res = await mainClient.patch(
      ENDPOINTS.COUNSELOR_DASHBOARD.DELETE_FEEDBACK(feedbackId)
    )
    return res.data
  },
  exportStudents: async (studentIds: string[]): Promise<Blob> => {
    const res = await mainClient.post(
      ENDPOINTS.COUNSELOR_DASHBOARD.EXPORT_STUDENTS,
      { studentIds },
      { responseType: "blob" } //"Kết quả trả về là File Excel dạng Byte, đừng dịch ra JSON kẻo lỗi!"
    )
    return res.data
  },
  importStudents: async (students: ImportStudentAccount[]): Promise<Blob> => {
    const res = await mainClient.post(
      ENDPOINTS.COUNSELOR_DASHBOARD.IMPORT_STUDENTS,
      { accounts: students },
      { responseType: "blob" } //"Kết quả trả về là File Excel dạng Byte, đừng dịch ra JSON kẻo lỗi!"
    )
    return res.data
  },
  checkStudentEmail: async (email: string): Promise<boolean> => {
    try {
      await mainClient.get(
        ENDPOINTS.COUNSELOR_DASHBOARD.CHECK_STUDENT_EMAIL(email)
      )
      // If it succeeds (HTTP 200), the email is valid and does not exist.
      return false
    } catch (err: any) {
      // If it throws HTTP 400, our backend returns BadRequestException indicating it exists.
      if (err?.response?.status === 400) {
        return true
      }
      throw err
    }
  }
}

export default counselorApi
