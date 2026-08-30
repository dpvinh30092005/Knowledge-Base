import type { CoreSkill } from '../types'

/**
 * One bubble on the skill map.
 *
 * `x` is market relevance, `y` is what the student can do, `z` is how big the
 * market for it is. Held and verified are kept as flags rather than baked into a
 * colour here, so the view owns the palette and this module stays testable
 * without a renderer.
 */
export type SkillBubble = {
  skillId: string
  skillName: string
  /**
   * Share of recent postings asking for this skill, 0..1.
   *
   * Not relevance. Relevance carries a TF-IDF term answering "does this skill
   * distinguish this career" — the right question for ordering a roadmap, the wrong
   * one for an axis labelled "Market wants it more". With eight careers that term
   * hits zero for anything seven of them want, so plotting it put Python — 193 of
   * 913 postings — at the far left of "the market wants this less", beside skills
   * nobody asked for at all. Java scored negative and was dropped outright.
   */
  x: number
  /** Proficiency 1..4, or 0 when the student does not hold it. */
  y: number
  /** Area for the symbol. See `bubbleArea` — recharts sizes by area, not radius. */
  z: number
  held: boolean
  verified: boolean
  importance: string | null
  /** Postings mentioning it in the window, for the tooltip. */
  jobCount: number | null
  frequency: number | null
}

/**
 * Area given to a skill with no market volume behind it.
 *
 * Not zero: "no posting mentioned it" and "nobody wants it" are different
 * claims, and a bubble collapsed to a point makes the second one.
 */
export const MIN_AREA = 60
export const MAX_AREA = 520

/** Proficiency is 1..4; missing skills sit on the floor at 0. */
export const MAX_PROFICIENCY = 4

/**
 * Map a market volume onto a symbol area.
 *
 * The rule that is easy to get wrong: the eye reads **area**, so a skill wanted
 * by twice as many employers must get twice the area — which is only ~1.41× the
 * radius. Recharts' `ZAxis range` is an area range and it derives the radius
 * itself, so this returns area and never touches radius. Scaling radius
 * linearly instead would square the difference and make a 2× skill look 4× as
 * important.
 */
export function bubbleArea(jobCount: number | null | undefined, maxJobCount: number): number {
  if (!jobCount || jobCount <= 0 || maxJobCount <= 0) return MIN_AREA
  const share = Math.min(1, jobCount / maxJobCount)
  return MIN_AREA + share * (MAX_AREA - MIN_AREA)
}

/**
 * Turn the career's core skill set into bubbles.
 *
 * Every core skill becomes a bubble, including the ones the student does not
 * have — that is the whole point of the view. A skill with no market data is
 * dropped instead of being plotted at x = 0, because the horizontal axis means
 * "the market wants this less", and an unmeasured skill has not earned that
 * claim.
 *
 * The measurement read is `frequency`, not `relevance` — see `SkillBubble.x`.
 */
export function toSkillBubbles(coreSkills: CoreSkill[] | null | undefined): SkillBubble[] {
  const skills = coreSkills ?? []
  const maxJobCount = skills.reduce(
    (max, skill) => Math.max(max, skill.marketDemand?.jobCount ?? 0),
    0,
  )

  const bubbles: SkillBubble[] = []
  for (const skill of skills) {
    const frequency = skill.marketDemand?.frequency
    if (typeof frequency !== 'number' || !Number.isFinite(frequency)) continue

    const proficiency = skill.proficiency ?? 0
    bubbles.push({
      skillId: skill.skillId,
      skillName: skill.skillName,
      x: frequency,
      y: proficiency,
      z: bubbleArea(skill.marketDemand?.jobCount ?? null, maxJobCount),
      held: proficiency > 0,
      verified: Boolean(skill.verifiedBy),
      importance: skill.importance ?? null,
      jobCount: skill.marketDemand?.jobCount ?? null,
      frequency: skill.marketDemand?.frequency ?? null,
    })
  }
  return bubbles
}

/**
 * The lower-right corner as a list: wanted by the market, not yet held.
 *
 * Same ordering the roadmap's `priorityScore` produces, because it is the same
 * two facts in the same direction — so the map and the priority badges can be
 * read against each other without contradicting.
 */
export function missingRankedByRelevance(bubbles: SkillBubble[]): SkillBubble[] {
  return bubbles.filter(b => !b.held).sort((a, b) => b.x - a.x)
}

export function heldRankedByRelevance(bubbles: SkillBubble[]): SkillBubble[] {
  return bubbles.filter(b => b.held).sort((a, b) => b.x - a.x)
}

/**
 * A skill the chart cannot place: required by the career, but named by no posting.
 *
 * `toSkillBubbles` drops these, and that is right — the horizontal axis means "the
 * market wants this less" and an unmeasured skill has not earned that claim. But
 * dropping them silently was making the chart lie by omission in the other
 * direction. Measured on the live database: four of this student's core skills sit
 * at PRACTICED, all four have zero postings behind them, and all four vanished — so
 * the Practiced row read as empty when the student had earned it four times over.
 *
 * The cause is upstream and known: the market extractor was only reading job ads
 * whose vocabulary its 44-name keyword list did not already recognise, so a backend
 * ad's Redis, JWT and RabbitMQ were never counted. Until re-extraction lands, these
 * skills are real and their demand figure is missing — two different things, and the
 * view now says which one it is.
 */
export type UnmeasuredSkill = {
  skillId: string
  skillName: string
  /** 1..4, or 0 when the student does not hold it. */
  proficiency: number
  held: boolean
  verified: boolean
}

/** Held skills first, strongest first — the student's own work leads. */
export function unmeasuredSkills(coreSkills: CoreSkill[] | null | undefined): UnmeasuredSkill[] {
  const out: UnmeasuredSkill[] = []
  for (const skill of coreSkills ?? []) {
    const frequency = skill.marketDemand?.frequency
    if (typeof frequency === 'number' && Number.isFinite(frequency)) continue

    const proficiency = skill.proficiency ?? 0
    out.push({
      skillId: skill.skillId,
      skillName: skill.skillName,
      proficiency,
      held: proficiency > 0,
      verified: Boolean(skill.verifiedBy),
    })
  }
  return out.sort((a, b) => b.proficiency - a.proficiency || a.skillName.localeCompare(b.skillName))
}
