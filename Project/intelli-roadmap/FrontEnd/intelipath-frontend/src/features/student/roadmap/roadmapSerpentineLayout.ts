/**
 * Serpentine roadmap layout.
 *
 * The previous layout put every topic on x = 0 and hung sub-skills off either
 * side. That reads well when topics have children to hang — but the server's
 * depth filter holds most children back, so what actually reached the screen was
 * a single column thousands of pixels tall. A roadmap you scroll straight down
 * for a minute stops looking like a path and starts looking like a list.
 *
 * Here the path runs left-to-right and wraps, the way text wraps: every row
 * starts at the left again. It folded back right-to-left at first — prettier as a
 * line, and wrong, because nobody scans a screen by following a line. They read
 * it, so a reversed row showed step 8 before step 5 and the order looked
 * scrambled. Reading order wins over the tidier curve.
 *
 * What survives from the fold is the part that mattered: the same node count
 * occupies a screen-shaped area instead of a ribbon, and one continuous
 * connector still threads the steps in order, so it reads as a path rather than
 * the grid that was tried and rightly rejected.
 *
 * Sub-skills hang straight down from their topic, always downward regardless of
 * which way the row is travelling: alternating them with the row direction made
 * the same topic look different depending on where it happened to land.
 */

export const TOPIC_W = 268;
// Two lines now: the name, and the meta row under it (progress, size, market
// share). A height the layout does not know about is a pill overlapping the
// stack beneath it.
export const TOPIC_H = 78;
export const CHILD_W = 214;
export const CHILD_H = 54;

const COL_GAP = 74; // horizontal gap between topics in a row
const CHILD_GAP_Y = 16; // between stacked sub-skills
const CHILD_TOP_GAP = 26; // topic bottom → first sub-skill
const ROW_GAP = 112; // bottom of the tallest cell → next row's topics
const STACK_PAD = 14; // surface inset around a topic's sub-skill stack
const INDENT = 18; // per-depth indent for nested sub-skills

// Options cluster under a CHOOSE_ONE group. Two columns because a single one
// makes nine languages a tall list the eye reads top-to-bottom, which is the
// sequence reading the cluster exists to kill.
const SAT_COLS = 2;
const SAT_ROW_H = 32;
const SAT_HEAD_H = 26;
const SAT_PAD_Y = 20;

const SPINE_STROKE = '#0f172a';
const BRANCH_STROKE = '#94a3b8';

/** The behavioural ladder the whole product measures against, 1..4. */
const PROFICIENCY_NAME: Record<number, string> = {
  1: 'AWARE',
  2: 'PRACTICED',
  3: 'APPLIED',
  4: 'PROFESSIONAL',
};

type MatchedSkill = { skillName?: string; proficiency?: number; verified?: boolean };

/** What the layout needs to draw a CHOOSE_ONE group's options as one cluster. */
export interface ChoiceClusterInput {
  /** Ranked options per group node id, from the choice-options endpoint. */
  optionsByGroup?: Record<string, { nodeId: string; matchedSkills?: unknown[]; recommended?: boolean }[]>;
  /** Options the student has already committed to. */
  chosenNodeIds?: Set<string>;
  /** Commit a pick straight from a chip. */
  onSelect?: (groupNodeId: string, optionNodeId: string) => void;
}

/**
 * Topics per row.
 *
 * Square-ish rather than fixed: 6 topics would leave a 3-topic roadmap stranded
 * on one line (the very shape being fixed), and a 40-topic one still needs to
 * fit a screen. Clamped at both ends because below 3 the wrap is not readable as
 * a turn, and above 5 the row is wider than most laptops.
 */
export const topicsPerRow = (count: number) =>
  Math.max(3, Math.min(5, Math.ceil(Math.sqrt(Math.max(count, 1)))));

type Placed = { id: string; depth: number; offsetY: number; parent: string };

/**
 * @param orderedTopics spine node ids, already in the order this student should
 *        meet them — the layout never re-sorts, it only positions
 * @param childrenOf   direct children of a node, in display order
 */
export const serpentineLayout = (
  orderedTopics: string[],
  childrenOf: (id: string) => string[],
  byId: Map<string, any>,
  reasonFor: Map<string, string>,
  choice: ChoiceClusterInput = {}
) => {
  const perRow = topicsPerRow(orderedTopics.length);
  const nodes: any[] = [];
  const edges: any[] = [];
  const placedIds = new Set<string>();

  /**
   * A group whose children are alternatives rather than sub-skills.
   *
   * <p>Stacked as ordinary children they became a numbered column under the
   * pill — and inside the group's own sub-roadmap, nine parallel spines
   * numbered 4, 5, 6 with the later ones locked behind the earlier. Every one
   * of those signals is false: there is no order among alternatives and none is
   * a prerequisite of another. So the whole set collapses to one cluster of
   * chips, which has no step number to inherit and no lock to carry.
   */
  const isChoiceGroup = (id: string) =>
    String(byId.get(id)?.data?.selection || '').toUpperCase() === 'CHOOSE_ONE'
    && childrenOf(id).length > 1;

  const clusterHeight = (optionCount: number) =>
    SAT_HEAD_H + Math.ceil(optionCount / SAT_COLS) * SAT_ROW_H + SAT_PAD_Y;

  /**
   * What a decided group pill should call itself, and where clicking it goes.
   *
   * <p>The level line comes from the student's strongest matched skill inside
   * the branch — a real measurement, not a restatement of the pick. It is
   * omitted rather than guessed when nothing matched: "JAVA" alone is honest,
   * "JAVA · AWARE" when nothing was measured is not.
   */
  const choiceIdentity = (groupId: string) => {
    if (!isChoiceGroup(groupId)) return {};
    const chosenId = childrenOf(groupId).find((id) => choice.chosenNodeIds?.has(id));
    if (!chosenId) return {};
    const scored = choice.optionsByGroup?.[groupId]?.find((o) => o.nodeId === chosenId);
    const best = (scored?.matchedSkills as MatchedSkill[] | undefined)
      ?.reduce<MatchedSkill | null>(
        (top, s) => (!top || (s?.proficiency ?? 0) > (top.proficiency ?? 0) ? s : top),
        null
      );
    return {
      choiceChosenId: chosenId,
      choiceChosenName: byId.get(chosenId)?.data?.label ?? byId.get(chosenId)?.data?.title ?? '',
      choiceGroupLabel: byId.get(groupId)?.data?.label ?? byId.get(groupId)?.data?.title ?? '',
      choiceChosenLevel: best?.proficiency
        ? PROFICIENCY_NAME[best.proficiency] + (best.verified ? ' · verified' : '')
        : null,
    };
  };

  // Flatten a topic's subtree into a vertical stack. Depth becomes indent, so a
  // nested sub-skill still reads as belonging to the one above it.
  const stackUnder = (topicId: string): { placed: Placed[]; height: number } => {
    // The cluster occupies the slot the stack would have, so the row still
    // reserves height for it — a cluster the row does not know about is a
    // cluster overlapping the next row.
    if (isChoiceGroup(topicId)) {
      return { placed: [], height: clusterHeight(childrenOf(topicId).length) };
    }
    const placed: Placed[] = [];
    let cursor = 0;
    const walk = (id: string, depth: number, parent: string) => {
      placed.push({ id, depth, offsetY: cursor, parent });
      cursor += CHILD_H + CHILD_GAP_Y;
      childrenOf(id).forEach((child) => walk(child, depth + 1, id));
    };
    childrenOf(topicId).forEach((child) => walk(child, 0, topicId));
    return { placed, height: cursor === 0 ? 0 : cursor - CHILD_GAP_Y };
  };

  const cells = orderedTopics.map((id) => ({ id, ...stackUnder(id) }));

  let rowTop = 0;
  const hierarchy: { parentId: string; childId: string }[] = [];
  // Where a row's return connector may travel: below every child stack in that
  // row, inside the gutter. Filled as each row's height becomes known.
  const gutterY: number[] = [];
  const xById = new Map<string, number>();
  const nodeX = (id: string) => xById.get(id) ?? 0;

  for (let start = 0; start < cells.length; start += perRow) {
    const row = cells.slice(start, start + perRow);
    row.forEach((cell, indexInRow) => {
      const x = indexInRow * (TOPIC_W + COL_GAP);
      xById.set(cell.id, x);

      const topic = byId.get(cell.id);
      if (topic) {
        // The step number, carried on the node itself. Position and a connector
        // imply an order; a numeral states it, and a student who lands
        // mid-roadmap should not have to trace a line to find out where they are.
        nodes.push({
          ...topic,
          data: {
            ...topic.data,
            step: start + indexInRow + 1,
            // Once decided, the group pill stops saying "Pick a Language" and
            // says JAVA. Two students on different stacks then differ at step 2
            // of the spine rather than only inside a cluster one of them has to
            // open — which is the whole reason the choice exists.
            ...choiceIdentity(cell.id),
          },
          position: { x, y: rowTop },
        });
        placedIds.add(cell.id);
      }

      const childX = x + (TOPIC_W - CHILD_W) / 2;

      // The options cluster takes the place of the child stack, directly under
      // the group pill so the attachment needs no connector to be read.
      if (isChoiceGroup(cell.id)) {
        const options = childrenOf(cell.id);
        const ranked = choice.optionsByGroup?.[cell.id];
        nodes.push({
          id: `choice-${cell.id}`,
          type: 'choiceSatellite',
          position: { x, y: rowTop + TOPIC_H + CHILD_TOP_GAP },
          data: {
            groupNodeId: cell.id,
            label: byId.get(cell.id)?.data?.label ?? byId.get(cell.id)?.data?.title ?? '',
            onSelect: choice.onSelect,
            options: options.map((optionId) => {
              const node = byId.get(optionId);
              const scored = ranked?.find((o) => o.nodeId === optionId);
              return {
                id: optionId,
                name: node?.data?.label ?? node?.data?.title ?? '',
                held: (scored?.matchedSkills?.length ?? 0) > 0,
                completed: node?.data?.status === 'completed',
                chosen: Boolean(choice.chosenNodeIds?.has(optionId)),
                // Only when the scorer was willing to name a winner. A tie or an
                // empty profile must not light a chip: a student cannot tell a
                // recommendation with nothing behind it from a real one, which
                // makes an unfounded one worse than none.
                recommended: Boolean(scored?.recommended),
              };
            }),
          },
          style: { width: TOPIC_W, height: clusterHeight(options.length) },
          selectable: false,
          draggable: false,
          connectable: false,
          focusable: false,
        });
        // The chips ARE these nodes' rendering, so mark them placed. Without
        // this the leftovers pass — which exists so no node is ever silently
        // dropped — treated all nine languages as unreached and stacked them
        // again as full cards below the roadmap, badges and all.
        options.forEach((optionId) => placedIds.add(optionId));
        return;
      }

      // An opaque surface behind the stack. Two jobs: it groups the sub-skills
      // as one thing belonging to the topic above, and it gives any connector
      // routed nearby something solid to pass behind — a 3px spine crossing the
      // text of a card reads as a mistake however correct the routing is.
      if (cell.placed.length) {
        const stackWidth = CHILD_W + Math.max(...cell.placed.map((c) => c.depth)) * INDENT;
        nodes.push({
          id: `stack-${cell.id}`,
          type: 'skillStack',
          position: { x: childX - STACK_PAD, y: rowTop + TOPIC_H + CHILD_TOP_GAP - STACK_PAD },
          data: {
            stage: byId.get(cell.id)?.data?.stage ?? null,
            total: byId.get(cell.id)?.data?.childTotal ?? cell.placed.length,
            completed: byId.get(cell.id)?.data?.childCompleted ?? 0,
            hidden: byId.get(cell.id)?.data?.hiddenChildren ?? 0,
          },
          style: {
            width: stackWidth + 2 * STACK_PAD,
            height: cell.height + 2 * STACK_PAD,
            pointerEvents: 'none',
          },
          zIndex: -4,
          selectable: false,
          draggable: false,
          connectable: false,
          focusable: false,
        });
      }

      cell.placed.forEach((child) => {
        const node = byId.get(child.id);
        if (!node) return;
        nodes.push({
          ...node,
          position: {
            x: childX + child.depth * INDENT,
            y: rowTop + TOPIC_H + CHILD_TOP_GAP + child.offsetY,
          },
        });
        placedIds.add(child.id);
        hierarchy.push({ parentId: child.parent, childId: child.id });
      });
    });

    const tallest = Math.max(
      0,
      ...row.map((cell) => (cell.height ? TOPIC_H + CHILD_TOP_GAP + cell.height : TOPIC_H))
    );
    gutterY[Math.floor(start / perRow)] = rowTop + tallest + ROW_GAP / 2;
    rowTop += tallest + ROW_GAP;
  }

  // ── Spine edges ────────────────────────────────────────────────────
  for (let i = 0; i < orderedTopics.length - 1; i++) {
    const from = orderedTopics[i];
    const to = orderedTopics[i + 1];
    if (!placedIds.has(from) || !placedIds.has(to)) continue;

    const wraps = Math.floor(i / perRow) !== Math.floor((i + 1) / perRow);
    const reason = reasonFor.get(`${from}->${to}`);

    // A wrap used to run bottom-to-top as one smoothstep, which put its
    // horizontal leg at the midpoint between the two rows — precisely where the
    // child stacks hang. The line crossed through the sub-skill cards of every
    // topic it passed. Sending it through a waypoint in the row gutter moves
    // that leg below the tallest stack, so it returns underneath the row rather
    // than across it. The waypoint is a zero-size node with no visuals: two
    // segments in the same stroke read as one line.
    if (wraps) {
      const gutter = gutterY[Math.floor(i / perRow)];
      if (gutter != null) {
        const waypointId = `wrap-${from}-${to}`;
        nodes.push({
          id: waypointId,
          type: 'spineWaypoint',
          position: { x: nodeX(from) + TOPIC_W / 2, y: gutter },
          data: {},
          style: { width: 1, height: 1, pointerEvents: 'none' },
          zIndex: -1,
          selectable: false,
          draggable: false,
          connectable: false,
          focusable: false,
        });
        placedIds.add(waypointId);
        edges.push({
          id: `spine-${from}-${to}-a`,
          source: from, target: waypointId,
          type: 'smoothstep', sourceHandle: 's-bottom', targetHandle: 't-top',
          style: { stroke: SPINE_STROKE, strokeWidth: 3 },
        });
        edges.push({
          id: `spine-${from}-${to}-b`,
          source: waypointId, target: to,
          type: reason ? 'explained' : 'smoothstep',
          sourceHandle: 's-bottom', targetHandle: 't-top',
          data: reason ? { reason } : undefined,
          style: { stroke: SPINE_STROKE, strokeWidth: 3 },
        });
        continue;
      }
    }

    edges.push({
      id: `spine-${from}-${to}`,
      source: from,
      target: to,
      type: reason ? 'explained' : 'smoothstep',
      sourceHandle: wraps ? 's-bottom' : 's-right',
      targetHandle: wraps ? 't-top' : 't-left',
      animated: false,
      data: reason ? { reason } : undefined,
      style: { stroke: SPINE_STROKE, strokeWidth: 3 },
    });
  }

  // ── Sub-skill edges ────────────────────────────────────────────────
  hierarchy.forEach(({ parentId, childId }) => {
    if (!placedIds.has(parentId) || !placedIds.has(childId)) return;
    edges.push({
      id: `h-${parentId}-${childId}`,
      source: parentId,
      target: childId,
      type: 'smoothstep',
      sourceHandle: 's-bottom',
      targetHandle: 't-top',
      style: { stroke: BRANCH_STROKE, strokeWidth: 1.25, strokeDasharray: '4 3' },
    });
  });

  return { nodes, edges, placedIds, perRow };
};
