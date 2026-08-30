export type AdminRole = "STUDENT" | "COUNSELOR" | "MENTOR" | "ADMIN"

export type AdminUserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

export interface AdminUserMetric {
  total: number
  growth: number
}

export interface AdminCourseMetric {
  total: number
  status: string
  progress: number
}

export interface AdminServiceStatus {
  name: string
  up: boolean
}

export interface AdminSystemHealth {
  status: string
  servicesUp: number
  servicesTotal: number
  services: AdminServiceStatus[]
  uptimeMillis?: number
  version?: string
  javaVersion?: string
  db?: { active: number; idle: number; total: number; max: number } | null
  memory?: { usedMb: number; maxMb: number } | null
}

export interface AdminUserListItem {
  id: string
  name: string
  email?: string
  role: AdminRole
  status?: AdminUserStatus
  joinedDate: string
}
