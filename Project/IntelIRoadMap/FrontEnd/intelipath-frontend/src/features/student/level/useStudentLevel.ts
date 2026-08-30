import { useCallback, useEffect, useState } from 'react'
import { assessmentService } from '../assessment'
import type { StudentLevel } from '../types'

/**
 * The student's level, fetched once per page that shows it.
 *
 * `reload` exists because the level is not a static fact — importing a GitHub
 * repository raises the verified share, which is the whole point of the prompt
 * that sits next to this badge. Without it the student would sync three
 * repositories and watch the same number stare back until they reloaded.
 *
 * Never throws and never invents a level: a student who skipped the assessment
 * has no level, and that is expressed as null rather than as BEGINNER.
 */
export function useStudentLevel() {
  const [level, setLevel] = useState<StudentLevel | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      setLevel(await assessmentService.getLevel())
    } catch {
      // A missing level must never take down the page it decorates.
      setLevel(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { level, isLoading, reload }
}
