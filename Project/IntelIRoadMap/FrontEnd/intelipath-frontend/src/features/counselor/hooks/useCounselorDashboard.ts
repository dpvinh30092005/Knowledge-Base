import { useEffect, useState } from "react"
import counselorApi, {
  type CareerStatistics,
  type MissingSkillItem,
  type Feedback
} from "@/features/counselor/api/counselorApi"

// ─── useCareerDistribution ────────────────────────────────────────────────────
export interface UseCareerDistributionResult {
  data: CareerStatistics[]
  error: boolean
  loading: boolean
  total: number
}

export function useCareerDistribution(
  onTotalLoaded?: (total: number) => void
): UseCareerDistributionResult {
  const [data, setData] = useState<CareerStatistics[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    counselorApi
      .getCareerDistribution()
      .then((payload: any) => {
        let formatted: CareerStatistics[] = []
        if (payload?.totalCareerStatistics) {
          formatted = Object.entries(
            payload.totalCareerStatistics as Record<string, number>
          )
            .map(([name, count]) => ({
              careerName: name,
              studentCount: Number(count)
            }))
            .sort((a, b) => b.studentCount - a.studentCount)
        } else if (payload?.careerStatistics) {
          formatted = Object.entries(
            payload.careerStatistics as Record<string, number>
          )
            .map(([name, count]) => ({
              careerName: name,
              studentCount: Number(count)
            }))
            .sort((a, b) => b.studentCount - a.studentCount)
        } else if (Array.isArray(payload)) {
          formatted = [...payload].sort(
            (a, b) => b.studentCount - a.studentCount
          )
        } else if (payload && typeof payload === "object") {
          formatted = Object.entries(payload as Record<string, number>)
            .map(([name, count]) => ({
              careerName: name,
              studentCount: Number(count)
            }))
            .sort((a, b) => b.studentCount - a.studentCount)
        }
        setData(formatted)
        const total = formatted.reduce((s, c) => s + c.studentCount, 0)
        onTotalLoaded?.(total)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    error,
    loading,
    total: data.reduce((s, c) => s + c.studentCount, 0)
  }
}

// ─── useMissingSkills ─────────────────────────────────────────────────────────
export interface UseMissingSkillsResult {
  data: MissingSkillItem[]
  totalStudents: number
  loading: boolean
  error: string | null
  searchInput: string
  setSearchInput: (v: string) => void
  activeSearch: string
  resolvedCareerName: string | null
  handleSearch: (e: React.FormEvent) => void
}

export function useMissingSkills(
  careerFilter?: string,
  onTotalLoaded?: (total: number) => void
): UseMissingSkillsResult {
  const [data, setData] = useState<MissingSkillItem[]>([])
  const [totalStudents, setTotalStudents] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(careerFilter || "")
  const [activeSearch, setActiveSearch] = useState(careerFilter || "")
  const [resolvedCareerName, setResolvedCareerName] = useState<string | null>(
    null
  )

  useEffect(() => {
    setSearchInput(careerFilter || "")
    setActiveSearch(careerFilter || "")
  }, [careerFilter])

  useEffect(() => {
    if (!activeSearch) {
      setData([])
      setTotalStudents(0)
      setResolvedCareerName(null)
      return
    }

    setLoading(true)
    setError(null)

    counselorApi
      .getSkillMissing(activeSearch)
      .then((res: any) => {
        setTotalStudents(res.total ?? 0) // 1. Lưu tổng số sinh viên đang theo đuổi nghề này
        // 2. Lấy object chứa dữ liệu skill bị hổng từ Backend
        const missingSkillsData =
          res.totalMissingSkills ?? res.missingSkills ?? {}
        const items: MissingSkillItem[] = Object.entries(missingSkillsData)
          .map(([skillName, count]) => ({ skillName, count: Number(count) }))
          .sort((a, b) => b.count - a.count)
        // 4. Lưu vào state để component Chart render
        setData(items)
        setResolvedCareerName(res.careerName || activeSearch)
        onTotalLoaded?.(items.length)
      })
      .catch((err: any) => {
        const msg =
          err?.response?.data?.message || "Cannot load missing skill data."
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [activeSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchInput.trim())
  }

  return {
    data,
    totalStudents,
    loading,
    error,
    searchInput,
    setSearchInput,
    activeSearch,
    resolvedCareerName,
    handleSearch
  }
}

// ─── useFeedbackList ──────────────────────────────────────────────────────────
export interface UseFeedbackListResult {
  feedbacks: Feedback[]
  error: boolean
  loading: boolean
}

export function useFeedbackList(
  onTotalLoaded?: (total: number) => void
): UseFeedbackListResult {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    counselorApi
      .getFeedback()
      .then((res) => {
        const list = res.feedbacks ?? []
        setFeedbacks(list)
        onTotalLoaded?.(list.length)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { feedbacks, error, loading }
}
