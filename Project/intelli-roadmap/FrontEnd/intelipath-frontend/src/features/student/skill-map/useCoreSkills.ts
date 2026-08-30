import { useCallback, useEffect, useState } from 'react'
import { studentDashboardService } from '../services'
import type { CoreSkill } from '../types'

/**
 * The career's core skill set — the readiness denominator, as rows.
 *
 * Read off the roadmap endpoint rather than a new one, because that response
 * already carries the set the level badge counts and the readiness percentage
 * divides by. A second endpoint answering the same question is how a screen ends
 * up disagreeing with itself.
 *
 * Never throws: losing the map must not take down the page it sits on.
 */
export function useCoreSkills() {
  const [coreSkills, setCoreSkills] = useState<CoreSkill[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const roadmap = await studentDashboardService.getStudentRoadmap()
      setCoreSkills(roadmap.coreSkills ?? null)
    } catch {
      setCoreSkills(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { coreSkills, isLoading, reload }
}
