import { useMemo } from 'react'
import { Check, Sparkle, TrendUp } from '@phosphor-icons/react'
import type { ChoiceOptions, NodeSelection } from '../types'
import { MIN_OPTIONS, barFraction, buildChoiceGroups, type ChoiceGroup, type ChoiceOption } from './marketChoiceData'

type Props = {
  rawNodes: unknown[] | null | undefined
  selections: NodeSelection[] | null | undefined
  /** Preferred source: raw posting counts from the ranking endpoint. */
  rankedGroups?: ChoiceOptions[] | null
  /** Jump the canvas to a group when the student clicks its heading. */
  onFocusGroup?: (groupNodeId: string) => void
  /** Open the job ads a posting count was measured over. */
  onOpenPostings?: (skillId: string, skillName: string) => void
  /** Open an option's own sub-roadmap — what "N topics inside" is counting. */
  onOpenNode?: (nodeId: string) => void
  className?: string
}

const CHOSEN_FILL = '#0f172a'
const REST_FILL = '#cbd5e1'

/**
 * The market standing of every option the student had to choose between.
 *
 * <p>Two roadmaps for two students differ most at the CHOOSE_ONE groups — one
 * picked Java, one picked Node.js, and everything downstream of that follows.
 * The canvas showed the consequence of the choice and never the choice itself,
 * so the difference was real but invisible, and a roadmap you cannot see
 * reasoning behind reads as the same roadmap everyone else got.
 *
 * <p>This is that reasoning, drawn: what the student picked, what they turned
 * down, and how the job market ranks the whole set. Bars are scaled within the
 * group (see {@link barFraction}) because "most wanted of these six" is the
 * question a chooser asks, not "what share of all postings".
 *
 * <p>Nothing here is invented. An option with no posting data says so rather
 * than drawing an empty bar, which would read as "the market does not want
 * this" when it means "we have not measured it".
 */
export default function MarketChoiceRail({ rawNodes, selections, rankedGroups, onFocusGroup, onOpenPostings, onOpenNode, className = '' }: Props) {
  // The ranking endpoint when it answered, the graph payload otherwise.
  //
  // Not interchangeable: the payload carries relevance-filtered demand, which
  // measures how *characteristic* a skill is of the career and drops Vue (16
  // postings) and Go (39) below its floor. The rail then printed "No posting
  // data" next to skills that have posting data. The endpoint reports raw
  // counts, which is what a line reading "N postings" has to be built from.
  const groups = useMemo(() => {
    const fromEndpoint = (rankedGroups ?? [])
      .filter(group => group.options.length >= MIN_OPTIONS)
      .map(group => ({
        groupNodeId: group.groupNodeId,
        groupName: group.groupName,
        options: group.options.map(option => ({
          nodeId: option.nodeId,
          name: option.name,
          frequency: option.marketFrequency,
          jobCount: option.marketJobCount,
          skillId: option.skillId,
          subtreeSize: option.nodeCount,
          chosen: option.chosen,
          autoSelected: option.autoSelected,
          autoReason: option.fitReason,
        })),
      }))
      .map(group => ({ ...group, chosen: group.options.find(o => o.chosen) ?? null }))
    if (fromEndpoint.length > 0) return fromEndpoint
    return buildChoiceGroups(rawNodes as never, selections)
  }, [rankedGroups, rawNodes, selections])

  if (groups.length === 0) return null

  return (
    <aside
      className={`flex w-full min-w-0 flex-col gap-4 ${className}`}
      aria-label="Your choices, ranked by market demand"
    >
      {groups.map(group => (
        <GroupCard key={group.groupNodeId} group={group} onFocusGroup={onFocusGroup} onOpenPostings={onOpenPostings} onOpenNode={onOpenNode} />
      ))}
    </aside>
  )
}

function GroupCard({
  onOpenPostings,
  onOpenNode,
  group,
  onFocusGroup,
}: {
  group: ChoiceGroup
  onFocusGroup?: (groupNodeId: string) => void
  onOpenPostings?: (skillId: string, skillName: string) => void
  onOpenNode?: (nodeId: string) => void
}) {
  const heading = (
    <div className="flex items-baseline justify-between gap-2">
      <span className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {group.groupName}
      </span>
      <span className="shrink-0 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
        {group.options.length} options
      </span>
    </div>
  )

  return (
    <section className="rounded-2xl bg-white/80 p-3.5 ring-1 ring-slate-900/[0.06] backdrop-blur-sm">
      {onFocusGroup ? (
        <button
          type="button"
          onClick={() => onFocusGroup(group.groupNodeId)}
          className="w-full rounded-lg text-left transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          {heading}
        </button>
      ) : (
        heading
      )}

      <div className="mt-1 flex items-center gap-1 text-[9px] font-medium text-slate-400">
        <TrendUp size={11} weight="bold" />
        <span>Ranked by recent job postings</span>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {group.options.map(option => (
          <OptionRow key={option.nodeId} option={option} group={group} onOpenPostings={onOpenPostings} onOpenNode={onOpenNode} />
        ))}
      </ul>

      {group.chosen?.autoReason ? (
        <p className="mt-3 flex gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2 text-[10px] leading-relaxed text-slate-600">
          <Sparkle size={12} weight="fill" className="mt-px shrink-0 text-slate-400" />
          <span>
            <span className="font-semibold text-slate-800">
              {group.chosen.autoSelected ? 'Picked for you' : 'Your pick'}
            </span>{' '}
            — {group.chosen.autoReason}
          </span>
        </p>
      ) : !group.chosen ? (
        // The undecided state is the one worth designing for: this is the rail's
        // whole reason to exist, and saying nothing here would leave the student
        // reading a ranking without knowing it is theirs to act on.
        <p className="mt-3 rounded-xl bg-amber-50/70 px-2.5 py-2 text-[10px] leading-relaxed text-amber-900 ring-1 ring-amber-200/60">
          <span className="font-semibold">Still open</span> — everything after this
          group depends on which one you take.
        </p>
      ) : null}
    </section>
  )
}

function OptionRow({ option, group, onOpenPostings, onOpenNode }: {
  option: ChoiceOption
  group: ChoiceGroup
  onOpenPostings?: (skillId: string, skillName: string) => void
  onOpenNode?: (nodeId: string) => void
}) {
  const fraction = barFraction(option, group)
  const measured = option.frequency != null

  return (
    <li className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`flex min-w-0 items-center gap-1 text-[11px] ${
            option.chosen ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
          }`}
        >
          {option.chosen && <Check size={11} weight="bold" className="shrink-0" />}
          <span className="truncate">{option.name}</span>
        </span>
        <span className="shrink-0 text-[10px] font-bold tabular-nums text-slate-500">
          {measured ? `${Math.round((option.frequency as number) * 100)}%` : '—'}
        </span>
      </div>

      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        {measured ? (
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.max(fraction * 100, 2)}%`,
              backgroundColor: option.chosen ? CHOSEN_FILL : REST_FILL,
            }}
          />
        ) : (
          // No bar at all, not a zero-width one: an empty track reads as "the
          // market does not want this", which is a claim we have not measured.
          <div className="h-full w-full bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,#e2e8f0_3px,#e2e8f0_6px)]" />
        )}
      </div>

      {/* Both figures are claims, and until now both were plain text — the
          student could read "158 postings" and had no way to find out whether
          that was true, or what those 158 jobs actually were. Each is now the
          way in to what it counts: the postings open the ads themselves, the
          topic count opens the sub-roadmap it is counting. A figure with nothing
          behind it stays plain text rather than becoming a button that goes
          nowhere. */}
      <div className="mt-0.5 flex items-center gap-2 text-[9px] font-medium text-slate-400">
        {measured && option.jobCount != null && (
          option.skillId && onOpenPostings ? (
            <button
              type="button"
              onClick={() => onOpenPostings(option.skillId as string, option.name)}
              title={`See the ${option.jobCount} job ads that mention ${option.name}`}
              className="tabular-nums underline decoration-dotted underline-offset-2 transition-colors hover:text-slate-900"
            >
              {option.jobCount} postings
            </button>
          ) : (
            <span className="tabular-nums">{option.jobCount} postings</span>
          )
        )}
        {!measured && <span>No posting data</span>}
        {option.subtreeSize != null && option.subtreeSize > 0 && (
          onOpenNode ? (
            <button
              type="button"
              onClick={() => onOpenNode(option.nodeId)}
              title={`Open the ${option.subtreeSize} topics inside ${option.name}`}
              className="tabular-nums underline decoration-dotted underline-offset-2 transition-colors hover:text-slate-900"
            >
              {option.subtreeSize} topics inside
            </button>
          ) : (
            <span className="tabular-nums">{option.subtreeSize} topics inside</span>
          )
        )}
      </div>
    </li>
  )
}
