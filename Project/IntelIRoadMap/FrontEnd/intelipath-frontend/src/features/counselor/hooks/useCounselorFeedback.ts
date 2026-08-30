import { useEffect, useState, useCallback } from "react"

import counselorApi, {
  type MyStudent,
  type Feedback,
  type CreateFeedback
} from "@/features/counselor/api/counselorApi"

// ─── useStudentList ───────────────────────────────────────────────────────────
export interface UseStudentListResult {
  students: MyStudent[]
  loading: boolean
  page: number
  setPage: (page: number) => void
  search: string
  setSearch: (search: string) => void
  career: string
  setCareer: (career: string) => void
  careers: string[]
  totalPages: number
  size: number
  setSize: (size: number) => void
  refetch: (signal?: AbortSignal) => void
}

export function useStudentList(): UseStudentListResult {
  const [students, setStudents] = useState<MyStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0) // 0-indexed for backend
  const [search, setSearch] = useState("")
  const [career, setCareer] = useState("")
  const [careers, setCareers] = useState<string[]>([])
  const [size, setSize] = useState(7)
  const [totalPages, setTotalPages] = useState(1)

  const refetch = useCallback(
    (signal?: AbortSignal) => {
      setLoading(true)
      counselorApi
        .getMyStudent(page, size, search, career, signal)
        .then((r) => {
          setStudents(r.students)
          setTotalPages(r.totalPages)
          if (r.careers) setCareers(r.careers)
        })
        .catch((error) => {
          if (error?.name === "CanceledError" || error?.message === "canceled")
            return // Axios aborted
          console.error("Failed to fetch students:", error)
          setStudents([])
          setTotalPages(1)
        })
        .finally(() => setLoading(false))
    },
    [page, search, career, size]
  )

  useEffect(() => {
    const controller = new AbortController()
    refetch(controller.signal)
    return () => {
      controller.abort()
    }
  }, [refetch])

  return {
    students,
    loading,
    page,
    setPage,
    search,
    setSearch,
    career,
    setCareer,
    careers,
    totalPages,
    size,
    setSize,
    refetch
  }
}

// ─── useStudentDetailInfo ───────────────────────────────────────────────────────
export interface UseStudentDetailInfoResult {
  roadmapProgress: number
  missingSkills: string[]
  feedbacks: Feedback[]
  loading: boolean
  refetch: () => void
}

export function useStudentDetailInfo(
  studentId: string
): UseStudentDetailInfoResult {
  const [roadmapProgress, setRoadmapProgress] = useState(0)
  const [missingSkills, setMissingSkills] = useState<string[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    setLoading(true)
    counselorApi
      .getStudentInfo(studentId)
      .then((r) => {
        setRoadmapProgress(r?.roadmapProgress ?? 0)
        setMissingSkills(r?.missingSkills ?? [])
        setFeedbacks(r?.feedbacks ?? [])
      })
      .catch(() => {
        setRoadmapProgress(0)
        setMissingSkills([])
        setFeedbacks([])
      })
      .finally(() => setLoading(false))
  }, [studentId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { roadmapProgress, missingSkills, feedbacks, loading, refetch }
}

// ─── useSendFeedback ──────────────────────────────────────────────────────────

export interface UseSendFeedbackResult {
  send: (payload: CreateFeedback) => Promise<void>
  sending: boolean
  sent: boolean
  resetSent: () => void
}

export function useSendFeedback(onSuccess?: () => void): UseSendFeedbackResult {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const send = useCallback(
    async (payload: CreateFeedback) => {
      if (!payload.content.trim()) return
      setSending(true)
      try {
        await counselorApi.createFeedback(payload)
        setSent(true)
        setTimeout(() => setSent(false), 3000)
        onSuccess?.()
      } catch {
        // silently fail — API may not be ready
      } finally {
        setSending(false)
      }
    },
    [onSuccess]
  )

  const resetSent = useCallback(() => setSent(false), [])

  return { send, sending, sent, resetSent }
}
