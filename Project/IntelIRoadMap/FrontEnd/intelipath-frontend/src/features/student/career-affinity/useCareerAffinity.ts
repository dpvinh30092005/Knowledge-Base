import { useCallback, useEffect, useState } from 'react'
import { assessmentApi } from '@/api'
import type { CareerAffinity } from '../types'

const unwrap = (data: unknown): CareerAffinity[] => {
  const payload =
    data && typeof data === 'object' && 'data' in data ? (data as { data: unknown }).data : data
  return Array.isArray(payload) ? (payload as CareerAffinity[]) : []
}

/**
 * Careers ranked by how much their essential skills overlap the student's.
 *
 * Advisory only — nothing here or behind it changes the student's target
 * career. Never throws: a suggestion that fails to load must not take down the
 * screen it decorates.
 */
export function useCareerAffinity(limit = 3, enabled = true) {
  const [affinities, setAffinities] = useState<CareerAffinity[]>([])
  const [isLoading, setIsLoading] = useState(enabled)

  const reload = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    try {
      const response = await assessmentApi.getCareerAffinity(limit)
      setAffinities(unwrap(response.data))
    } catch {
      setAffinities([])
    } finally {
      setIsLoading(false)
    }
  }, [limit, enabled])

  useEffect(() => {
    reload()
  }, [reload])

  return { affinities, isLoading, reload }
}
