import type { NodeSelection } from '../types'

/**
 * Turns a CHOOSE_ONE group plus its options into something rankable by market
 * demand — the data behind the rail, kept apart from the drawing so it can be
 * read (and argued with) on its own.
 */

/** One option inside a choice group, with whatever the market actually says about it. */
export type ChoiceOption = {
  nodeId: string
  name: string
  /** Share of recent postings mentioning it, 0..1. Null when no posting data exists. */
  frequency: number | null
  /** The catalog skill `jobCount` was measured over — the key for opening those ads. */
  skillId?: string | null
  /** Postings behind `frequency`. Null travels with it. */
  jobCount: number | null
  /** Descendants — what the student is signing up for by picking this. */
  subtreeSize: number | null
  chosen: boolean
  /** True when the system picked it rather than the student. */
  autoSelected: boolean
  /** The system's stated grounds, in the student's own numbers. */
  autoReason: string | null
}

export type ChoiceGroup = {
  groupNodeId: string
  groupName: string
  options: ChoiceOption[]
  /** The picked option, if any. Null while the decision is still open. */
  chosen: ChoiceOption | null
}

/** Minimal shape the graph nodes already carry; anything else is ignored. */
type GraphNode = {
  id: string
  data?: {
    title?: string | null
    label?: string | null
    parentNodeId?: string | null
    subtreeSize?: number | null
    selection?: string | null
    marketDemand?: { frequency?: number | null; jobCount?: number | null } | null
  } | null
}

/**
 * Options this rail is worth drawing for.
 *
 * A group with one option is not a decision, and a group whose options carry no
 * market data at all has nothing to rank — drawing either one is filling space.
 */
export const MIN_OPTIONS = 2

function nameOf(node: GraphNode): string {
  return String(node.data?.title ?? node.data?.label ?? '').trim()
}

/**
 * Build the choice groups from the graph payload, annotated with whatever the
 * student has decided so far.
 *
 * <p><b>Groups come from the nodes, not from the selections.</b> Keying on
 * selections looked natural — one row per resolved group — but it makes the rail
 * appear only once a choice already exists, and the moment a ranking of the
 * options is worth showing is the moment *before* the student picks. A student
 * with no selections at all is the one who most needs to see that React is named
 * by 61 postings and Svelte by none.
 */
export function buildChoiceGroups(
  rawNodes: GraphNode[] | null | undefined,
  selections: NodeSelection[] | null | undefined
): ChoiceGroup[] {
  if (!rawNodes?.length) return []

  const selectionByGroup = new Map<string, NodeSelection>()
  for (const selection of selections ?? []) {
    if (selection?.groupNodeId) selectionByGroup.set(selection.groupNodeId, selection)
  }

  const groups: ChoiceGroup[] = []

  for (const group of rawNodes) {
    if (String(group.data?.selection ?? '').toUpperCase() !== 'CHOOSE_ONE') continue

    const selection = selectionByGroup.get(group.id)

    const options: ChoiceOption[] = rawNodes
      .filter(node => node.data?.parentNodeId === group.id)
      .map(node => {
        const demand = node.data?.marketDemand
        const chosen = Boolean(selection) && node.id === selection?.chosenNodeId
        return {
          nodeId: node.id,
          name: nameOf(node),
          frequency: typeof demand?.frequency === 'number' ? demand.frequency : null,
          jobCount: typeof demand?.jobCount === 'number' ? demand.jobCount : null,
          subtreeSize: typeof node.data?.subtreeSize === 'number' ? node.data.subtreeSize : null,
          chosen,
          autoSelected: chosen ? Boolean(selection?.autoSelected) : false,
          autoReason: chosen ? selection?.autoReason ?? null : null,
        }
      })
      .filter(option => option.name.length > 0)

    if (options.length < MIN_OPTIONS) continue
    if (!options.some(option => option.frequency != null)) continue

    // Most-wanted first; options with no posting data sink below every option
    // that has some, rather than being ranked as if the market said zero.
    options.sort((a, b) => {
      if (a.frequency == null && b.frequency == null) return a.name.localeCompare(b.name)
      if (a.frequency == null) return 1
      if (b.frequency == null) return -1
      return b.frequency - a.frequency
    })

    groups.push({
      groupNodeId: group.id,
      groupName: nameOf(group) || String(selection?.groupNodeName ?? '').trim() || 'Your choice',
      options,
      chosen: options.find(option => option.chosen) ?? null,
    })
  }

  // The group the student is furthest into deserves the top of the rail; ties
  // fall back to name so the order does not wobble between requests.
  groups.sort((a, b) => b.options.length - a.options.length || a.groupName.localeCompare(b.groupName))
  return groups
}

/**
 * Bar width for an option, 0..1, scaled against the strongest option in its own
 * group.
 *
 * Scaled within the group, not against 1.0: a language named by 30% of postings
 * is the market leader among six languages, and a bar that renders it as
 * three-tenths-full says the opposite of what the number means.
 */
export function barFraction(option: ChoiceOption, group: ChoiceGroup): number {
  if (option.frequency == null) return 0
  const top = group.options.reduce((max, o) => (o.frequency != null && o.frequency > max ? o.frequency : max), 0)
  if (top <= 0) return 0
  return Math.min(1, option.frequency / top)
}
