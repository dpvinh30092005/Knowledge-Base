import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import type { DashboardLoadStatus, RoadmapProgress } from "../types"
import { studentDashboardService } from "../services"

type RoadmapProgressValue = {
  data: RoadmapProgress | null
  status: DashboardLoadStatus
  /** Refetch, e.g. after a shortcut is applied and progress changes. */
  reload: () => Promise<void>
}

const RoadmapProgressContext = createContext<RoadmapProgressValue | null>(null)

/**
 * Fetches the roadmap progress once and shares it with every widget below,
 * so the dashboard's milestone banner, quick stats and action list don't each
 * fire the same (heavy) query. Exposes reload so mutations can refresh it.
 */
export const RoadmapProgressProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<RoadmapProgress | null>(null)
  const [status, setStatus] = useState<DashboardLoadStatus>("loading")

  const reload = useCallback(async () => {
    try {
      const next = await studentDashboardService.getRoadmapProgress()
      setData(next)
      setStatus("success")
    } catch (error) {
      console.error("[Student Dashboard] Failed to load roadmap progress:", error)
      setStatus("error")
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return (
    <RoadmapProgressContext.Provider value={{ data, status, reload }}>
      {children}
    </RoadmapProgressContext.Provider>
  )
}

export const useRoadmapProgress = (): RoadmapProgressValue => {
  const ctx = useContext(RoadmapProgressContext)
  if (!ctx) {
    throw new Error("useRoadmapProgress must be used within a RoadmapProgressProvider")
  }
  return ctx
}
