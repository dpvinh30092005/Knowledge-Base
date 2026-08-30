import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { STAGE_ORDER, getStageColor, getStageLabel } from '../lib/stageColors';

/**
 * Background container nodes for the roadmap graph. Both are purely decorative:
 * they render behind the interactive skill nodes (negative zIndex) and let all
 * pointer events fall through so clicks always land on the real nodes on top.
 */

interface ClusterBoxData {
  label?: string;
  stage?: string | null;
  side?: 'left' | 'right';
}

/**
 * Soft, stage-tinted rounded box that visually groups one topic's sub-skills
 * (the "topic cluster"). A small header pill carries the topic name so a
 * student reads the cluster as a labelled section.
 */
export const ClusterBoxNode = memo(({ data }: { data: ClusterBoxData }) => {
  const color = getStageColor(data.stage);
  return (
    <div
      className="relative h-full w-full rounded-[22px] border-2 border-dashed"
      style={{
        borderColor: `${color}`,
        backgroundColor: `${color}14`, // ~8% tint
        boxShadow: `inset 0 0 0 1px ${color}22`,
      }}
    >
      {data.label && (
        <div
          className="absolute -top-3 left-4 flex items-center gap-1.5 rounded-full border-2 border-black bg-white px-2.5 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <span
            className="h-2 w-2 rounded-[3px] border border-black/50"
            style={{ backgroundColor: color }}
          />
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-800">
            {data.label}
          </span>
        </div>
      )}
    </div>
  );
});

ClusterBoxNode.displayName = 'ClusterBoxNode';

interface StageBandData {
  stage?: string | null;
}

/**
 * Full-width stage separator. Rather than a box framing the stage, it reads as a
 * horizontal divider line at the stage's top edge plus a faint colour wash over
 * the stage's rows — so stages separate by a clear line + colour, not a frame.
 */
export const StageBandNode = memo(({ data }: { data: StageBandData }) => {
  const color = getStageColor(data.stage);
  const label = getStageLabel(data.stage);
  // Horizontal divider line + its stage label. Once this divider scrolls above
  // the top of the canvas, the sticky header takes over showing the same label.
  // A numbered band, not a hairline divider: with the stage-grid layout each
  // stage owns a whole region of the page, so it needs a surface of its own and
  // a heading a student can navigate by ("STEP 02 · CORE").
  // Derived from the stage itself, so the number is right whichever layout
  // produced the band.
  const stageIndex = STAGE_ORDER.indexOf(String(data.stage || '').toUpperCase() as any);
  const step = stageIndex >= 0 ? stageIndex + 1 : undefined;
  return (
    <div
      className="relative h-full w-full rounded-[28px]"
      style={{ backgroundColor: `${color}0f`, boxShadow: `inset 0 0 0 1px ${color}40` }}
    >
      <div className="absolute left-8 top-6 flex items-baseline gap-3">
        {step !== undefined && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Step {String(step).padStart(2, '0')}
          </span>
        )}
        <span className="text-[19px] font-semibold tracking-tight text-slate-800">{label}</span>
      </div>
    </div>
  );
});

StageBandNode.displayName = 'StageBandNode';

interface SkillStackData {
  stage?: string | null;
  total?: number | null;
  completed?: number | null;
  hidden?: number | null;
}

/**
 * The surface behind one topic's stack of sub-skills.
 *
 * <p>Two problems, one object. The stack used to hang in open space, so the
 * serpentine's return connector — 3px of solid slate — ran straight across the
 * cards it passed on its way back to the next row. Routing fixed where the line
 * goes; this fixes what it goes behind, because a stack with nothing under it
 * offers a crossing line no surface to disappear into.
 *
 * <p>And it says how far through the topic the student is. That number was
 * already on the parent pill and nowhere near the cards it describes, which is
 * the wrong place to read "3 of 8" from while looking at the eight.
 */
export const SkillStackNode = memo(({ data }: { data: SkillStackData }) => {
  const color = getStageColor(data.stage);
  const total = data.total ?? 0;
  const completed = data.completed ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className="relative h-full w-full rounded-[20px] bg-white/90 ring-1 ring-slate-900/[0.05]"
      style={{ boxShadow: `inset 0 0 0 1px ${color}1f` }}
    >
      {/* A hairline of stage colour down the left edge: enough to tie the stack
          to its topic without tinting the whole surface, which would put a wash
          behind every card and cost the cards their own contrast. */}
      <span
        className="absolute inset-y-3 left-0 w-[3px] rounded-full"
        style={{ backgroundColor: color }}
      />
      {total > 0 && (
        <div className="absolute -top-2.5 right-3 flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-900/[0.07]">
          <span className="h-1.5 w-8 overflow-hidden rounded-full bg-slate-200">
            <span
              className="block h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </span>
          <span className="text-[9px] font-bold tabular-nums text-slate-500">
            {completed}/{total}
          </span>
        </div>
      )}
    </div>
  );
});

SkillStackNode.displayName = 'SkillStackNode';

/**
 * A zero-size anchor the serpentine's return connector bends around.
 *
 * <p>Renders nothing at all. Its only job is to exist at a coordinate so the
 * wrap edge can be drawn as two segments through the row gutter instead of one
 * segment straight through the sub-skill cards.
 */
export const SpineWaypointNode = memo(() => (
  <div className="h-px w-px">
    <Handle type="target" position={Position.Top} id="t-top" className="!opacity-0" />
    <Handle type="source" position={Position.Bottom} id="s-bottom" className="!opacity-0" />
  </div>
));

SpineWaypointNode.displayName = 'SpineWaypointNode';

/**
 * Backdrop for the tree layout: one soft, dotted surface behind the whole tree.
 *
 * The tree conveys grouping through its own branches, so it needs no per-stage
 * bands — what it does need is a visible surface, otherwise the cards float on
 * the page background with nothing tying them together.
 */
export const TreeCanvasNode = memo(() => (
  <div className="h-full w-full rounded-[32px] bg-white/40 ring-1 ring-slate-900/[0.04]" />
));

TreeCanvasNode.displayName = 'TreeCanvasNode';
