export interface UpdateCounselorProfilePayload {
  fullName: string
  yob: string
  bio: string
  email: string
  university: string
  department: string
}

export interface CareerStatistics {
  careerName: string
  studentCount: number
}

export interface CounselorResponse {
  total: number
  careerStatistics: Record<string, number> | null
  missingSkills: Record<string, number>
  careerName?: string
}

export interface MissingSkillItem {
  skillName: string
  count: number
}

export interface MyStudent {
  studentId: string
  fullName: string
  email?: string
  university: string
  careerPath: string | null
  roadmapProgress: number
  missingSkills: MissingSkillItem[]
}
