import { ENDPOINTS, mainClient } from "@/shared/api"
import type {
  AdminCourseMetric,
  AdminRole,
  AdminSystemHealth,
  AdminUserListItem,
  AdminUserMetric,
  AdminUserStatus
} from "@/features/admin/admin.types"

/**
 * Admin API Service
 * Each widget/section on the admin dashboard fetches its own data independently.
 */
const adminApi = {
  getTotalUsers: async () => {
    const response = await mainClient.get<AdminUserMetric>(ENDPOINTS.ADMIN_DASHBOARD.METRICS_USERS)
    return response.data
  },
  
  getTotalCourses: async () => {
    const response = await mainClient.get<AdminCourseMetric>(ENDPOINTS.ADMIN_DASHBOARD.METRICS_COURSES)
    return response.data
  },

  getSystemHealth: async () => {
    const response = await mainClient.get<AdminSystemHealth>(ENDPOINTS.ADMIN_DASHBOARD.METRICS_HEALTH)
    return response.data
  },

  getUsersList: async () => {
    const response = await mainClient.get<AdminUserListItem[]>(ENDPOINTS.ADMIN_DASHBOARD.USERS)
    return response.data
  },

  updateUserRole: async (userId: string, role: AdminRole) => {
    const response = await mainClient.patch<AdminUserListItem>(ENDPOINTS.ADMIN_DASHBOARD.USER_ROLE(userId), { role })
    return response.data
  },

  updateUserStatus: async (userId: string, status: AdminUserStatus) => {
    const response = await mainClient.patch<AdminUserListItem>(ENDPOINTS.ADMIN_DASHBOARD.USER_STATUS(userId), { status })
    return response.data
  },

  deleteUser: async (userId: string) => {
    await mainClient.delete(ENDPOINTS.ADMIN_DASHBOARD.USER(userId))
  },

  triggerSkillExtraction: async () => {
    const response = await mainClient.post(ENDPOINTS.ADMIN_DASHBOARD.TRIGGER_SKILL_EXTRACTION)
    return response.data
  },

  triggerJobScraper: async (source: "topcv" | "itviec" = "topcv") => {
    const response = await mainClient.post(
      ENDPOINTS.ADMIN_DASHBOARD.TRIGGER_JOB_SCRAPER,
      null,
      { params: { source } },
    )
    return response.data
  },

  // ─── FLM curriculum sync (paste cookie → scrape → import) ──────────────────
  startFlmSync: async (payload: FlmSyncPayload) => {
    const response = await mainClient.post<FlmSyncStart>(ENDPOINTS.ADMIN_FLM.SYNC, payload)
    return response.data
  },

  getFlmSyncStatus: async (jobId: string) => {
    const response = await mainClient.get<FlmSyncStatus>(ENDPOINTS.ADMIN_FLM.SYNC_STATUS(jobId))
    return response.data
  },

  /** Copies the synced syllabi's files into our own storage. Background job — poll it. */
  startMaterialMirror: async (subjectCode?: string, force = false) => {
    const response = await mainClient.post<{ jobId: string }>(ENDPOINTS.ADMIN_FLM.MIRROR, null, {
      params: { ...(subjectCode ? { subjectCode } : {}), force }
    })
    return response.data
  },

  getMaterialMirrorStatus: async (jobId: string) => {
    const response = await mainClient.get<MirrorStatus>(ENDPOINTS.ADMIN_FLM.MIRROR_STATUS(jobId))
    return response.data
  }
}

export interface FlmSyncPayload {
  cookie: string
  curriculumCode: string
  curid?: string
  prefixes?: string
  career?: string
}

export interface FlmSyncStart {
  jobId: string
}

export interface FlmSyncSummary {
  subjects: number
  skillLinks: number
  unmatchedSkills: number
  resources: number
}

export interface FlmSyncStatus {
  state: "pending" | "running" | "error" | "imported"
  phase: string
  done: number
  total: number
  message?: string | null
  error?: string | null
  summary?: FlmSyncSummary | null
}

export default adminApi;

export interface MirrorSummary {
  /** Files that had a source to fetch. */
  attempted: number
  mirrored: number
  skipped: number
  /** Expected to be non-zero: FLM's scheduleId download handler currently 500s. */
  failed: number
  bytes: number
}

export interface MirrorStatus {
  state: "pending" | "running" | "done" | "error"
  phase: string
  done: number
  total: number
  message?: string | null
  summary?: MirrorSummary | null
  error?: string | null
}
