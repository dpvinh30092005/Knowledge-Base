import { ENDPOINTS, mainClient } from '@/shared/api'

/**
 * The postings behind a market number.
 *
 * <p>Every market figure on the roadmap is an aggregate — "158 postings", "19%
 * of jobs" — and the student is asked to choose a language on the strength of
 * them. A number nobody can open is a number taken on faith. These are the rows
 * the count is made of, each with a link out to the original ad, so the claim is
 * checkable against the source rather than against us.
 */
export type SkillPosting = {
  id: string
  title: string | null
  location: string | null
  salary: string | null
  /** As the ad words it — "10 months". Not normalised, not invented. */
  experience: string | null
  link: string | null
  postedDate: string | null
  seniority: string | null
}

export type SkillPostings = {
  skillName: string | null
  /** Every posting that mentions the skill, not just the ones returned. */
  totalCount: number
  postings: SkillPosting[]
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null

export async function fetchSkillPostings(skillId: string, limit = 20): Promise<SkillPostings> {
  const response = await mainClient.get(ENDPOINTS.MARKET_TRENDS.SKILL_POSTINGS(skillId), {
    params: { limit },
  })
  const data = (response.data && typeof response.data === 'object' && 'data' in response.data
    ? (response.data as { data: unknown }).data
    : response.data) as any

  return {
    skillName: text(data?.skillName),
    // Never postings.length: the list is capped, and a sample of 20 reported as
    // the total would quietly contradict the number the student clicked on.
    totalCount: typeof data?.totalCount === 'number' ? data.totalCount : 0,
    postings: Array.isArray(data?.postings)
      ? data.postings.map((row: any) => ({
          id: String(row?.id ?? ''),
          title: text(row?.title),
          location: text(row?.location),
          salary: text(row?.salary),
          experience: text(row?.experience),
          link: text(row?.link),
          postedDate: text(row?.postedDate),
          seniority: text(row?.seniority),
        }))
      : [],
  }
}
