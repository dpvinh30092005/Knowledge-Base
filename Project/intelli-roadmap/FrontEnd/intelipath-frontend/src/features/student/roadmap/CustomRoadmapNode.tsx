import { memo, type ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Check, LockKeyhole, GitFork, Flag, GraduationCap, TrendingUp, BookOpen, ChevronsDown, Gauge, CornerDownRight, Flame } from 'lucide-react';
import { getStageColor } from '../lib/stageColors';

/** Short "dd MMM yyyy" label for a completion timestamp (e.g. 15 Jul 2026). */
/** The behaviourally-anchored scale the assessment writes: 1..4. */
const PROFICIENCY_SHORT: Record<number, string> = {
  0: '—',
  1: 'Aware',
  2: 'Practiced',
  3: 'Applied',
  4: 'Pro',
};

const formatDoneDate = (raw?: string | null): string | null => {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface CustomRoadmapNodeProps {
  data: {
    label: string;
    status: 'completed' | 'current' | 'in_progress' | 'locked' | 'alternative';
    level?: number;
    stage?: string | null;
    themeColor?: string;
    isIsolated?: boolean;
    // v2 personalization
    selection?: 'ALL' | 'CHOOSE_ONE' | string;
    nodeKind?: 'CORE' | 'ALTERNATIVE' | 'OPTIONAL' | string;
    isOptional?: boolean;
    isCheckpoint?: boolean;
    isChosen?: boolean;
    completedAt?: string | null;
    // FLM overlay: set when ≥1 FPT subject teaches this node's skill.
    fptCoverage?: { covered?: boolean } | null;
    // The catalog skill this node teaches, when it maps to one.
    skillName?: string | null;
    // Live job-market demand for that skill. Null when the scrape sample is too
    // small to report a percentage honestly — the card then says nothing rather
    // than showing a zero, because "we don't know" and "nobody wants it" are
    // different claims.
    marketDemand?: {
      frequency?: number | null;
      jobCount?: number | null;
      sampleSize?: number | null;
      importance?: string | null;
      reason?: string | null;
    } | null;
    // Curated learning links (FR2.3 requires two on a technical node).
    links?: { title: string; url: string }[];
    // Children the visibility filter held back, so the card can offer them
    // instead of pretending this topic is a leaf.
    hiddenChildren?: number | null;
    childTotal?: number | null;
    childCompleted?: number | null;
    /** 1-based position on the path, assigned by the layout that wraps into rows. */
    step?: number | null;
    /** The bar this node sets, and where the student stands against it: 1..4. */
    requiredProficiency?: number | null;
    semanticType?: 'TOPIC' | 'SKILL' | 'CAPABILITY' | 'CHECKPOINT' | string;
    relativeDepth?: number | null;
    axis?: 'MAIN' | 'SIDE' | string | null;
    topic?: { childTotal?: number; childCompleted?: number; completionRule?: string | null } | null;
    skill?: {
      skillId?: string;
      skillName?: string;
      category?: string;
      requiredProficiency?: number | null;
      currentProficiency?: number | null;
      verifiedBy?: string | null;
      marketDemand?: { frequency?: number; reason?: string; jobCount?: number } | null;
    } | null;
    currentProficiency?: number | null;
    /** TRANSCRIPT | GITHUB | MENTOR, or null when the student declared it. */
    proficiencyVerifiedBy?: string | null;
    /** The rule that finishes this node, in a sentence. */
    completionRule?: string | null;
    /** Descendants inside it. Large ones open as their own roadmap. */
    subtreeSize?: number | null;
    entersRoadmap?: boolean | null;
    /**
     * How much this node is worth doing next: the very score the backend already
     * ordered the roadmap by, so the badge and the position can never disagree.
     */
    priorityScore?: number | null;
    priorityLabel?: 'CRITICAL' | 'HIGH' | 'NORMAL' | string | null;
    /** Each clause traces to one term of the score, e.g. "essential for this career, 19% of recent postings ask for it". */
    priorityReason?: string | null;
    /** Which student level this node is for: 1 Beginner · 2 Intermediate · 3 Advanced. */
    tier?: number | null;
    /** True when the student's level does not reach {@link tier} yet. */
    tierLocked?: boolean;
    // Set by the layout on a CHOOSE_ONE group once the student has decided, so
    // the pill can rename itself to the track taken instead of still asking.
    choiceChosenId?: string | null;
    choiceChosenName?: string | null;
    choiceChosenLevel?: string | null;
    choiceGroupLabel?: string | null;
    /**
     * The server just marked this node from evidence the student supplied —
     * declared skills, a graded paper, an imported repository.
     *
     * <p>Set for one render pass only, by the page that received the ids. It is
     * not a status: the node's status is already `completed`, and this says
     * "you watched it happen" rather than "it is done".
     */
    justMarked?: boolean;
    /** Position in the marking wave, so the ticks land in sequence. */
    markOrder?: number;
    /** The node's own id, so the card can act on itself. */
    id?: string;
    /** NEVER_COMPLETE means this node finishes through its sub-skills, not by hand. */
    completionPolicy?: string | null;
    /** Move this node's status without opening the drawer. */
    onSetStatus?: (nodeId: string, status: string) => void;
  };
  selected?: boolean;
}

/**
 * Delay before this node's tick lands, in ms.
 *
 * <p>Capped because a student who just evidenced forty nodes should not sit
 * through four seconds of ceremony — past the cap the tail lands together, which
 * still reads as a wave arriving rather than a page redrawing.
 */
const MARK_STAGGER_MS = 85;
const MARK_STAGGER_CAP_MS = 1600;

const markDelay = (order?: number): number =>
  Math.min((order ?? 0) * MARK_STAGGER_MS, MARK_STAGGER_CAP_MS);

const CustomRoadmapNode = ({ data, selected }: CustomRoadmapNodeProps) => {
  const isAlternativeStatus = data.status === 'alternative';
  const isCompleted = data.status === 'completed';
  // "in_progress" = the student is actively learning this node (blue pulse + glow).
  // "current" = merely unlocked / up-next; reachable but not started, so it gets a
  // calm "available" treatment instead of looking like work already underway.
  const isInProgress = data.status === 'in_progress';
  const isAvailable = data.status === 'current';
  const isCurrent = isInProgress; // drives the active-focus visuals (glow, pulse, pressed)
  // Tier gating is independent from prerequisite/status gating.  The API keeps
  // future nodes in the graph (so the roadmap remains legible), and explicitly
  // marks them tierLocked for the student's assessed level.  Treating only a
  // legacy `status: locked` as locked made Fresher and Senior render alike.
  const isLocked = !isAlternativeStatus
    && !isCompleted
    && !isInProgress
    && (!isAvailable || Boolean(data.tierLocked));
  // Legacy level fallback remains for old payloads. The current contract makes
  // visual meaning explicit and correctly rebases roots inside sub-roadmaps.
  // const legacyIsMain = data.level !== undefined && data.level > 0;
  const semanticType = String(data.semanticType ?? '').toUpperCase();
  // const legacySemanticMain = Number(data.relativeDepth ?? -1) === 0
  //   && (semanticType === 'TOPIC' || semanticType === 'CHECKPOINT');
  // Semantic type controls the card content. Placement on the current view's
  // spine is determined independently by relativeDepth and axis.
  const isMain = semanticType
    ? Number(data.relativeDepth ?? -1) === 0
      && (String(data.axis ?? 'MAIN').toUpperCase() === 'MAIN' || Number(data.level ?? 0) > 0)
    : data.level !== undefined && data.level > 0;
  const isIsolated = !!data.isIsolated;

  // v2 flags
  const isChooseGroup = data.selection === 'CHOOSE_ONE';
  const isAlternative = data.nodeKind === 'ALTERNATIVE';
  const isChosen = !!data.isChosen;
  const isOptional = !!data.isOptional;
  const isCheckpoint = !!data.isCheckpoint;

  // Node fill is its STAGE colour (so stages read as colour bands down the
  // spine); status is layered on top via opacity + badges rather than by
  // swapping the colour, so stage grouping survives every state.
  const stageColor = getStageColor(data.stage);

  // Turbo-style glow: a soft, animated coloured halo behind the card, only for
  // the node the student is on (current) or their chosen alternative.
  const glow = isCurrent
    ? 'from-indigo-400 via-sky-400 to-indigo-400'
    : isChosen
      ? 'from-emerald-400 via-teal-300 to-emerald-400'
      : '';
  const showGlow = (isCurrent || isChosen) && !isAlternativeStatus;

  /**
   * The one line of facts a spine topic can offer before it is opened.
   *
   * <p>Built only from values the server actually sent — a topic with no market
   * data and no children keeps its bare name rather than being padded out with
   * zeroes. Ordered by what decides "should I do this next?": how far in you
   * already are, how much is behind it, then what the market says.
  */
  const topicMeta: string[] = [];
  const hasTopicProgress = isMain && (data.childTotal ?? 0) > 0;
  const topicProgress = hasTopicProgress
    ? Math.max(0, Math.min(1, (data.childCompleted ?? 0) / (data.childTotal ?? 1)))
    : isCompleted ? 1 : 0;
  const topicBackground = hasTopicProgress
    ? `linear-gradient(90deg, ${stageColor} 0%, ${stageColor} ${topicProgress * 100}%, #cbd5e1 ${topicProgress * 100}%, #cbd5e1 100%)`
    : isLocked ? '#cbd5e1' : stageColor;
  if (isMain) {
    const total = data.childTotal ?? 0;
    if (total > 0) topicMeta.push(`${data.childCompleted ?? 0}/${total} done`);
    if (data.entersRoadmap && (data.subtreeSize ?? 0) > 0) {
      topicMeta.push(`${data.subtreeSize} nodes`);
    }
    const frequency = data.skill?.marketDemand?.frequency ?? data.marketDemand?.frequency;
    if (typeof frequency === 'number') {
      topicMeta.push(`${Math.round(frequency * 100)}% of jobs`);
    }
  }

  // "FPT" corner badge — same neo-brutalist pill as the OPTION / Pick-one badges, in
  // orange, flagging that an FPT subject teaches this skill. Sits top-left (OPTION owns
  // top-right). When the node also shows a status dot in that corner, the badge slides
  // right so the two sit side by side instead of overlapping.
  const hasFpt = !!data.fptCoverage?.covered;
  const hasCornerDot = !isMain && (isInProgress || (isAvailable && !isChosen && !isCompleted));
  const FptBadge = hasFpt ? (
    <div className={`absolute -top-2 z-20 flex items-center gap-1 rounded-full border-2 border-black bg-orange-300 px-1.5 py-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] ${hasCornerDot ? 'left-5' : '-left-1'}`}>
      <GraduationCap size={9} strokeWidth={2.5} className="text-black" />
      <span className="text-[8px] font-black uppercase tracking-wider text-black">FPT</span>
    </div>
  ) : null;

  /**
   * The status bar that appears over a card on hover.
   *
   * <p><b>Why on the card at all.</b> Moving a node used to cost three actions —
   * open the drawer, read a panel you did not ask for, close it — and the drawer
   * exists to answer "what is this?", not "I have done it". At a hundred nodes
   * that is the entire interaction budget spent on bookkeeping.
   *
   * <p><b>Two buttons, two real states.</b> `student_progress` accepts
   * NOT_STARTED, IN_PROGRESS, COMPLETED and LOCKED, and nothing else. A third
   * "skip" control would write COMPLETED like the second one and then be
   * indistinguishable from it the moment the page reloaded — a button that lies
   * about being its own state is worse than a button that is missing.
   *
   * <p>Both toggle: clicking the state a node is already in returns it to
   * not-started. Otherwise a misclick on Complete is unreachable from the card
   * that caused it, and the student is sent back to the drawer to undo it.
   */
  const canSetStatus = !!data.onSetStatus && !!data.id
    && !isAlternativeStatus
    // A topic ticks itself from its children. Offering a manual Complete here
    // would set a value the next refetch recomputes away, which reads as the
    // click not having worked.
    && !(isMain && (data.childTotal ?? 0) > 0)
    && data.completionPolicy !== 'NEVER_COMPLETE';

  const fire = (event: React.MouseEvent, status: string) => {
    // React Flow opens the drawer on node click, and the drawer is exactly what
    // this control exists to avoid.
    event.stopPropagation();
    event.preventDefault();
    data.onSetStatus?.(data.id as string, status);
  };

  const StatusBar = canSetStatus ? (
    <div
      // Also stops the mousedown, or React Flow begins a node interaction under
      // the button and the click never resolves.
      onMouseDown={event => event.stopPropagation()}
      className={`absolute -top-3.5 right-2 z-40 flex items-center gap-1 rounded-full bg-white/95 p-1 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/10 backdrop-blur transition-all duration-150 ${
        selected
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'
      }`}
    >
      <button
        type="button"
        title={isInProgress ? 'Stop learning this' : 'I am learning this'}
        aria-label={isInProgress ? 'Stop learning this' : 'I am learning this'}
        onClick={event => fire(event, isInProgress ? 'not_started' : 'in_progress')}
        className={`grid h-6 w-6 place-items-center rounded-full transition-colors ${
          isInProgress
            ? 'bg-indigo-500 text-white'
            : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
        }`}
      >
        <BookOpen size={13} strokeWidth={2.75} />
      </button>
      <button
        type="button"
        title={isCompleted ? 'Not done after all' : 'Mark complete'}
        aria-label={isCompleted ? 'Not done after all' : 'Mark complete'}
        onClick={event => fire(event, isCompleted ? 'not_started' : 'completed')}
        className={`grid h-6 w-6 place-items-center rounded-full transition-colors ${
          isCompleted
            ? 'bg-emerald-500 text-white'
            : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
        }`}
      >
        <Check size={14} strokeWidth={3.25} />
      </button>
    </div>
  ) : null;

  // The marking wave. Two pieces that sit OUTSIDE the card's own box so neither
  // is clipped by its overflow-hidden: a halo that expands and fades, and a tick
  // that stamps down on the corner. The card's own reaction (a settle) is a class
  // applied to the card element itself, further down.
  const isJustMarked = !!data.justMarked;
  const markStyle = { animationDelay: `${markDelay(data.markOrder)}ms` };
  const MarkHalo = isJustMarked ? (
    <div
      style={markStyle}
      className={`node-mark-halo pointer-events-none absolute -inset-1 z-0 ${isMain ? 'rounded-full' : 'rounded-2xl'} ring-[3px] ring-emerald-400`}
    />
  ) : null;
  // The tick lands top-left. Every other corner is spoken for — OPTION and
  // "Pick one" own top-right, +N owns the bottom — and top-left is only ever
  // used by the tier lock, which a node that just got marked cannot be showing.
  const MarkStamp = isJustMarked ? (
    <div
      style={markStyle}
      className="node-mark-stamp pointer-events-none absolute -left-2 -top-2 z-30 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.45)] ring-2 ring-white"
    >
      <Check size={15} strokeWidth={4} className="text-white" />
    </div>
  ) : null;

  // Completion date — kept quiet (muted, no colour) so it doesn't fight the node.
  const doneDate = isCompleted ? formatDoneDate(data.completedAt) : null;
  const DoneCaption = doneDate ? (
    <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-white/70 px-1.5 py-0.5 ring-1 ring-slate-200/70">
      <Check size={8} strokeWidth={3} className="text-slate-400" />
      <span className="text-[8.5px] font-semibold tracking-wide text-slate-400">{doneDate}</span>
    </div>
  ) : null;

  if (isMain) {
    const shadowClass = selected || isCurrent
      ? 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[4px] translate-y-[4px]'
      : 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-[2px] group-hover:-translate-x-[2px]';

    return (
      <div className="relative group cursor-pointer w-[280px]">
        {MarkHalo}
        {showGlow && (
          <div
            className={`pointer-events-none absolute -inset-[3px] rounded-full bg-gradient-to-r ${glow} opacity-60 blur-[10px] animate-pulse`}
          />
        )}
        <div
          style={{ background: topicBackground, ...(isJustMarked ? markStyle : {}) }}
          className={`
            relative z-10 flex items-center justify-center min-h-[64px] px-6 py-4
            rounded-full border-[3.5px] border-black ${shadowClass}
            transition-all duration-200 ease-out
            ${isLocked && topicProgress === 0 ? 'text-slate-500 saturate-0' : ''}
            ${isCompleted ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}
            ${isJustMarked ? 'node-mark-settle' : ''}
          `}
        >
          {isCompleted && <Check size={20} strokeWidth={4} className="text-black absolute left-5" />}
          {isLocked && <LockKeyhole size={18} strokeWidth={3} className="text-black/50 absolute left-5" />}
          {isCheckpoint && !isCompleted && !isLocked && <Flag size={17} strokeWidth={3} className="text-black absolute left-5" />}
          {/* Step number. The layout wraps into rows, so position alone stops
              being a reliable cue for order once the eye leaves the connector —
              this states it. Yields the left slot to the status icons, which
              answer the more urgent question ("can I start this?"). */}
          {data.step != null && !isCompleted && !isLocked && !isCheckpoint && (
            <span className="absolute left-4 grid h-6 w-6 place-items-center rounded-full border-2 border-black bg-white/85 text-[11px] font-black tabular-nums text-black">
              {data.step}
            </span>
          )}
          {/* A decided choice group renames itself to the track taken. "Pick a
              Language" is a question, and leaving the question up after it has
              been answered is how two students on different stacks ended up
              reading the same spine. The group name stays above in small caps
              so the pill is still recognisably the place to change your mind. */}
          {data.choiceChosenName ? (
            <div className="w-full px-6 text-center">
              <p className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-black/45">
                {data.choiceGroupLabel || data.label}
              </p>
              <p className="text-[15px] font-black uppercase leading-tight tracking-[0.08em] text-black">
                {data.choiceChosenName}
              </p>
              {data.choiceChosenLevel && (
                <p className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-black/55">
                  {data.choiceChosenLevel}
                </p>
              )}
            </div>
          ) : (
            <div className="w-full px-6 text-center">
              <p className="text-[15px] font-black uppercase leading-tight tracking-[0.08em] text-black">
                {data.label}
              </p>
              {/* What the topic is worth knowing before opening it. The pill
                  carried nothing but a name, so every step looked identical and
                  the student had to click each one to find out which mattered —
                  on a spine of 15 topics that is 15 clicks to make one decision.
                  Only measured values appear; a topic with no market data and no
                  children simply keeps its bare name. */}
              {topicMeta.length > 0 && (
                <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-black/55">
                  {topicMeta.map((part, i) => (
                    <span key={part} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-black/25">·</span>}
                      {part}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
        </div>

        {/* No "Pick one" badge here any more: the zone drawn around this group
            already carries "Pick 1 of N" on its header, and saying it twice made
            the pill compete with the frame that encloses it. */}

        {FptBadge}
        {DoneCaption}
        {MarkStamp}
        {StatusBar}

        {/* Handles */}
        <Handle type="target" position={Position.Top} id="t-top" className="w-1 h-1 opacity-0" />
        <Handle type="source" position={Position.Bottom} id="s-bottom" className="w-1 h-1 opacity-0" />
        <Handle type="target" position={Position.Left} id="t-left" className="w-1 h-1 opacity-0" />
        <Handle type="source" position={Position.Right} id="s-right" className="w-1 h-1 opacity-0" />
        <Handle type="source" position={Position.Left} id="s-left" className="w-1 h-1 opacity-0" />
        <Handle type="target" position={Position.Right} id="t-right" className="w-1 h-1 opacity-0" />
      </div>
    );
  }

  const subShadowClass = selected || isCurrent
    ? 'shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] translate-x-[3px] translate-y-[3px]'
    : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-[1px] group-hover:-translate-x-[1px]';

  // An alternative is a "pill" (fully rounded) rather than a rounded-rect, so
  // choose-one options read differently from ordinary sub-skills.
  // Market demand is a ratio 0..1 on the wire; shown as a whole percent, and only
  // when the backend actually sent one.
  const nodeMarketDemand = data.skill?.marketDemand ?? data.marketDemand;
  const demandPct = typeof nodeMarketDemand?.frequency === 'number'
    ? Math.round(nodeMarketDemand.frequency * 100)
    : null;
  // The skill name only earns a line when it differs from the node's own label —
  // "React / React" is noise.
  const explicitSkillName = data.skill?.skillName ?? data.skillName;
  const skillSubtitle = explicitSkillName && explicitSkillName.trim().toLowerCase() !== data.label.trim().toLowerCase()
    ? explicitSkillName
    : null;
  const linkCount = data.links?.length ?? 0;
  const childTotal = data.childTotal ?? 0;
  const childCompleted = data.childCompleted ?? 0;
  const hiddenChildren = data.hiddenChildren ?? 0;

  // A topic reports its progress; a leaf reports what the market thinks of it and
  // whether it has anything to read. Never both — they answer different questions
  // and a card that tries to say everything says nothing.
  const metaChips: ReactNode[] = [];
  if (isMain && childTotal > 0) {
    metaChips.push(
      <span key="progress" className="text-[10px] font-semibold tabular-nums text-slate-500">
        {childCompleted}/{childTotal} done
      </span>,
    );
  } else {
    // Priority leads: it is the answer to "what should I do next", which is the
    // question the student brought to the page. Only the two bands that mean
    // "sooner than the rest" get a chip — badging NORMAL on most of the roadmap
    // would make the word meaningless and the canvas unreadable.
    if (data.priorityLabel === 'CRITICAL' || data.priorityLabel === 'HIGH') {
      const critical = data.priorityLabel === 'CRITICAL';
      metaChips.push(
        <span
          key="priority"
          title={data.priorityReason || undefined}
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[10px] font-semibold ${
            critical ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          <Flame size={9} strokeWidth={2.5} />
          {critical ? 'Critical' : 'High'}
        </span>,
      );
    }
    if (demandPct !== null) {
      metaChips.push(
        <span
          key="demand"
          title={nodeMarketDemand?.reason || undefined}
          className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-1.5 py-[1px] text-[10px] font-semibold text-orange-700"
        >
          <TrendingUp size={9} strokeWidth={2.5} />
          {demandPct}%
        </span>,
      );
    }
    // "Opens a roadmap" has to be visible before the click, not discovered by it:
    // the whole canvas is about to be replaced.
    if (data.entersRoadmap) {
      metaChips.push(
        <span
          key="enters"
          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-1.5 py-[1px] text-[10px] font-semibold text-indigo-700"
        >
          <CornerDownRight size={9} strokeWidth={2.5} />
          {data.subtreeSize} nodes
        </span>,
      );
    }
    if (linkCount > 0) {
      metaChips.push(
        <span key="links" className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
          <BookOpen size={9} strokeWidth={2.5} />
          {linkCount}
        </span>,
      );
    }
    // Where the student stands. Shown before links and skill name because it is
    // the only chip that is about them rather than about the node.
    // Only once the student has something to show. "— / Practiced" on every card
    // is a column of dashes: it reports the absence of a claim, which is not news.
    if (data.currentProficiency != null) {
      const current = data.currentProficiency ?? 0;
      const required = data.skill?.requiredProficiency ?? data.requiredProficiency ?? 0;
      const met = required > 0 && current >= required;
      metaChips.push(
        <span
          key="proficiency"
          title={
            data.proficiencyVerifiedBy
              ? `Verified by ${data.proficiencyVerifiedBy.toLowerCase()}`
              : "Self-declared"
          }
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[10px] font-semibold ${
            met ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          <Gauge size={9} strokeWidth={2.5} />
          {PROFICIENCY_SHORT[current] || "—"}
          {required > 0 && ` / ${PROFICIENCY_SHORT[required]}`}
        </span>,
      );
    }
    if (!metaChips.length && skillSubtitle) {
      metaChips.push(
        <span key="skill" className="max-w-[150px] truncate text-[10px] font-medium text-slate-400">
          {skillSubtitle}
        </span>,
      );
    }
  }

  const isPill = isAlternative;
  // Dashed border for: unchosen alternatives (greyed), optional nodes, isolated.
  const isDashed = isAlternativeStatus || isOptional || isIsolated;

  return (
    <div className="relative group cursor-pointer w-[240px]">
      {MarkHalo}
      {showGlow && (
        <div
          className={`pointer-events-none absolute -inset-[3px] ${isPill ? 'rounded-full' : 'rounded-xl'} bg-gradient-to-r ${glow} opacity-55 blur-[9px] animate-pulse`}
        />
      )}
      {/* Weight comes from typography and whitespace, not from a 3px black frame
          and a hard drop shadow: at 170 nodes on one canvas that treatment turned
          the page into noise. A hairline ring plus a soft shadow keeps each card
          legible and lets the stage colour do the grouping. */}
      <div
        style={isJustMarked ? markStyle : undefined}
        className={`
        relative z-10 flex items-center justify-between min-h-[52px] pl-5 pr-4 py-3
        ${isLocked || isAlternativeStatus ? 'bg-slate-100' : 'bg-white'} overflow-hidden rounded-2xl
        ring-1 ring-slate-900/10
        transition-all duration-200 ease-out
        ${isJustMarked ? 'node-mark-settle ring-2 ring-emerald-400' : ''}
        ${isCurrent || isAvailable ? 'shadow-[0_6px_16px_-6px_rgba(15,23,42,0.22)]' : 'shadow-[0_2px_6px_-3px_rgba(15,23,42,0.18)]'}
        ${isDashed ? 'border border-dashed border-slate-300' : ''}
        ${isCurrent ? 'ring-2 ring-slate-900/70' : ''}
        ${isChosen ? 'ring-2 ring-emerald-500' : ''}
        ${isAlternativeStatus ? 'opacity-55 saturate-0' : isLocked ? 'saturate-0' : ''}
      `}>
        {/* Stage accent: a thin bar, enough to group by colour without tinting
            the card and hurting the text. */}
        <span
          style={{ backgroundColor: isLocked || isAlternativeStatus ? '#94a3b8' : stageColor }}
          className="absolute left-0 top-0 h-full w-[3px]"
        />
        <div className="flex-1 min-w-0">
          <p className={`text-[14px] font-bold tracking-wide leading-tight text-black ${isLocked || isAlternativeStatus ? 'opacity-60' : ''}`}>
            {data.label}
          </p>
          {/* One quiet meta line, at most two facts. The first version put the
              skill name, demand, progress and a link count on every card at once,
              which at ~100 cards read as noise rather than information. */}
          {metaChips.length > 0 && (
            <div className="mt-0.5 flex items-center gap-2">
              {metaChips}
            </div>
          )}
        </div>
        <div className="shrink-0 ml-3">
          {isChosen && !isCompleted && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check size={12} strokeWidth={3.5} className="text-white" />
            </div>
          )}
          {isCompleted && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check size={12} strokeWidth={3.5} className="text-white" />
            </div>
          )}
          {isLocked && !isChosen && (
            <LockKeyhole size={13} strokeWidth={2.5} className="text-slate-300" />
          )}
        </div>
      </div>

      {/* CHOOSE_ONE group that renders as a branch (e.g. "Pick a Database").

          Yields the corner to the status bar on hover. Both want the same
          rectangle, and of the two the badge is the one already read — it states
          a fact about the node that does not change, while the bar is the thing
          the student reached for by hovering. */}
      {isChooseGroup && (
        <div className={`absolute -top-2 -right-1 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 shadow-sm transition-opacity duration-150 ${canSetStatus ? 'group-hover:opacity-0' : ''}`}>
          <GitFork size={10} strokeWidth={3} className="text-black" />
          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-900">Pick one</span>
        </div>
      )}

      {/* Alternative badge: "option" when the group is still open for this node,
          nothing extra once chosen (the emerald ring says it). */}
      {isAlternative && !isChosen && !isAlternativeStatus && (
        <div className={`absolute -top-2 -right-1 z-10 flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 ring-1 ring-slate-900/10 shadow-sm transition-opacity duration-150 ${canSetStatus ? 'group-hover:opacity-0' : ''}`}>
          <GitFork size={9} strokeWidth={3} className="text-slate-700" />
          <span className="text-[8px] font-black uppercase tracking-wider text-slate-700">Option</span>
        </div>
      )}

      {/* Above the student's level. Shown, not removed — and labelled with the
          tier rather than a bare padlock, because "locked" without a reason
          reads as a bug, while "Advanced" reads as somewhere still to get to.
          Top-left, so it never fights the option/choice badges on the right. */}
      {data.tierLocked && (
        <div className="absolute -top-2 -left-1 z-10 flex items-center gap-1 rounded-full bg-slate-800 px-1.5 py-0.5 shadow-sm">
          <LockKeyhole size={9} strokeWidth={3} className="text-white/80" />
          <span className="text-[8px] font-black uppercase tracking-wider text-white">
            {data.tier === 3 ? 'Advanced' : data.tier === 2 ? 'Intermediate' : 'Later'}
          </span>
        </div>
      )}

      {/* Depth that exists but was not sent. Without this the card would claim to
          be a leaf, and the whole point of the deep-dive data would be invisible. */}
      {hiddenChildren > 0 && !isAlternativeStatus && (
        <div className="absolute -bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-slate-900 px-2 py-[2px] shadow-sm">
          <ChevronsDown size={9} strokeWidth={3} className="text-white" />
          <span className="text-[8px] font-bold uppercase tracking-wider text-white">
            +{hiddenChildren}
          </span>
        </div>
      )}

      {FptBadge}
      {DoneCaption}
      {MarkStamp}
      {StatusBar}

      {/* Handles */}
      <Handle type="target" position={Position.Top} id="t-top" className="w-1 h-1 opacity-0" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="w-1 h-1 opacity-0" />
      <Handle type="target" position={Position.Left} id="t-left" className="w-1 h-1 opacity-0" />
      <Handle type="source" position={Position.Right} id="s-right" className="w-1 h-1 opacity-0" />
      <Handle type="source" position={Position.Left} id="s-left" className="w-1 h-1 opacity-0" />
      <Handle type="target" position={Position.Right} id="t-right" className="w-1 h-1 opacity-0" />

      {isInProgress && (
        <div className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-[0_4px_10px_rgba(59,130,246,0.3)] ring-2 ring-white animate-pulse z-10 transition-transform group-hover:scale-110 duration-500">
          <div className="h-2 w-2 rounded-full bg-white"></div>
        </div>
      )}

      {/* "Available / up next": reachable but not started — a quiet static marker,
          no pulse, so it doesn't read as work already in progress. */}
      {isAvailable && !isChosen && !isCompleted && (
        <div className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-indigo-400 z-10">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-400"></div>
        </div>
      )}
    </div>
  );
};

export default memo(CustomRoadmapNode);
