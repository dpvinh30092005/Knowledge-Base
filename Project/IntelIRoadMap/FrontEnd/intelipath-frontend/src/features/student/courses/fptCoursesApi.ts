import { ENDPOINTS, mainClient } from "@/shared/api"

export interface FptCourseListItem {
  code: string
  name: string
  semester: number | null
  credits: number | null
  prerequisite: string | null
  skills: string[]
  /** "PASSED" when the student has declared it, else null. */
  status: string | null
}

export interface FptClo {
  /** The syllabus's own label, e.g. CLO1. */
  code: string
  outcome: string
}

export interface FptMaterial {
  id: string
  title: string
  topic: string | null
  /** Which CLO(s) the session maps to, as the syllabus wrote it. */
  cloRef: string | null
  /** A reference link the syllabus published — never a link to the file itself. */
  url: string | null
  sizeBytes: number | null
  /** False for most sessions: FLM's own handler errors for ~145 of 207 files. */
  downloadable: boolean
}

export interface FptCourseDetail {
  code: string
  name: string
  credits: number | null
  prerequisite: string | null
  description: string | null
  skills: string[]
  clos: FptClo[]
  /** Textbooks and articles — nothing to download. */
  materials: FptMaterial[]
  /** Class sessions; the downloadable ones carry the files. */
  sessions: FptMaterial[]
}

const fptCoursesApi = {
  /** The student's own curriculum + combo, already scoped server-side. */
  list: async (): Promise<FptCourseListItem[]> => {
    const response = await mainClient.get(ENDPOINTS.CURRICULUM.FPT_SUBJECTS)
    return response.data?.subjects ?? []
  },

  detail: async (code: string): Promise<FptCourseDetail> => {
    const response = await mainClient.get(ENDPOINTS.CURRICULUM.FPT_SUBJECT_DETAIL(code))
    return response.data
  },

  /**
   * A signed link, valid for ~2 minutes. Fetched per click rather than stored: it is the
   * only key to a private file, so it must not sit in component state going stale.
   */
  downloadLink: async (materialId: string): Promise<string> => {
    const response = await mainClient.get(ENDPOINTS.CURRICULUM.FPT_MATERIAL_DOWNLOAD(materialId))
    return response.data.downloadUrl
  }
}

export default fptCoursesApi
