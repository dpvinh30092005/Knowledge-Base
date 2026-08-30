import { ENDPOINTS, mainClient } from "@/shared/api"

export interface UpdateUserProfilePayload {
  fullName: string
  yob: string
  bio: string
}

export interface UpdateStudentProfilePayload {
  universityName?: string | null
  /** ISO date, e.g. "2023-09-05" — what an <input type="date"> already produces. */
  admissionDate?: string | null
  major?: string | null
  careerId?: string | null
  bio?: string | null
  yob?: string | null
}

export interface UpdateMentorProfilePayload {
  company: string
  industryFocus: string
}

export interface UpdateCounselorProfilePayload {
  department: string
  admissionDate?: string | null
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface StudentLevelResponse {
  level: 'BEGINNER' | 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'EXPERT' | string
  source: 'ASSESSMENT' | 'MENTOR_OVERRIDE' | string
  assessedAt: string | null
}

const profileApi = {
  getStudentProfile: () => mainClient.get(ENDPOINTS.STUDENT.PROFILE),
  getStudentLevel: () => mainClient.get<StudentLevelResponse | null>(ENDPOINTS.STUDENT.LEVEL),
  getMentorProfile: () => mainClient.get(ENDPOINTS.MENTOR.PROFILE),
  getCounselorProfile: () =>
    mainClient.get(ENDPOINTS.COUNSELOR_DASHBOARD.GET_COUNSELOR_PROFILE),

  updateUserProfile: (data: UpdateUserProfilePayload) =>
    mainClient.patch(ENDPOINTS.USERS.PROFILE, data),

  updateStudentProfile: (data: UpdateStudentProfilePayload) =>
    mainClient.patch(ENDPOINTS.STUDENT.PROFILE, data),

  updateMentorProfile: (data: UpdateMentorProfilePayload) =>
    mainClient.patch(ENDPOINTS.MENTOR.PROFILE, data),

  updateCounselorProfile: (data: UpdateCounselorProfilePayload) =>
    mainClient.patch(ENDPOINTS.COUNSELOR.PROFILE, data),

  changePassword: (data: ChangePasswordPayload) =>
    mainClient.patch(ENDPOINTS.USERS.CHANGE_PASSWORD, data),

  updateAvatar: (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    // Remove Content-Type so Axios/Browser can automatically generate it with the required boundary string
    return mainClient.patch("/users/profile/avatar", formData, {
      transformRequest: [
        (data, headers) => {
          delete headers["Content-Type"]
          return data
        }
      ]
    })
  },

  uploadTranscript: (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    return mainClient.post(ENDPOINTS.STUDENT.UPLOAD_TRANSCRIPT, formData, {
      transformRequest: [
        (data, headers) => {
          delete headers["Content-Type"]
          return data
        }
      ]
    })
  }
}

export default profileApi
