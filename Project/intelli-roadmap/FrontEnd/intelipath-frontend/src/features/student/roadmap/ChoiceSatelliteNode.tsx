import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Check, Sparkle } from '@phosphor-icons/react';

export interface ChoiceSatelliteOption {
  id: string;
  name: string;
  /** The student already holds a skill inside this branch. */
  held: boolean;
  /** This node is marked completed. */
  completed: boolean;
  /** The stored selection for the group. */
  chosen: boolean;
  /** Best fit, and the scorer was confident enough to say so. */
  recommended: boolean;
}

export interface ChoiceSatelliteData {
  groupNodeId: string;
  label?: string;
  options: ChoiceSatelliteOption[];
  onSelect?: (groupNodeId: string, optionNodeId: string) => void;
}

/**
 * The options of a CHOOSE_ONE group, drawn as one cluster beside the spine.
 *
 * <p><b>Why one node and not N.</b> Laid out as ordinary child cards, nine
 * languages became nine cards in a column, then — inside the group's own
 * sub-roadmap — nine parallel spines numbered 4, 5, 6 with the later ones
 * locked behind the earlier. Every one of those signals is false: they are
 * alternatives, there is no order among them, and none is a prerequisite of
 * another. The layout was saying "learn Golang, then Rust, then Java".
 *
 * <p>So the whole set is one object. A student reads a bordered cluster of
 * small chips as "pick from these" without being told, and there is no step
 * number to attach to a chip, no lock to inherit, and no way for the eye to
 * mistake the set for a sequence.
 *
 * <p>Chips carry two ticks, and they mean different things: the left one says
 * the student already has a skill inside that branch, the right one says the
 * node itself is done. Only the left one is a reason to pick.
 */
export const ChoiceSatelliteNode = memo(({ data }: { data: ChoiceSatelliteData }) => {
  const decided = data.options.some((option) => option.chosen);

  return (
    <div className="relative h-full w-full rounded-[20px] border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      {/* Target on the right: the connector comes in from the spine. */}
      <Handle type="target" position={Position.Right} id="t-right" className="!opacity-0" />

      <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
        <span className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
          {data.label || 'Pick one'}
        </span>
        <span className="shrink-0 text-[9px] font-bold tabular-nums text-slate-400">
          {data.options.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {data.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => data.onSelect?.(data.groupNodeId, option.id)}
            title={option.recommended ? 'Best match for the skills you have' : option.name}
            className={`
              flex items-center gap-1 rounded-lg border-2 px-1.5 py-1.5 text-left transition-colors
              ${
                option.chosen
                  ? 'border-black bg-amber-200'
                  : option.recommended
                    ? 'border-black bg-white hover:bg-amber-50'
                    : 'border-slate-300 bg-white hover:border-slate-500'
              }
              ${decided && !option.chosen ? 'opacity-55' : ''}
            `}
          >
            <span
              className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border ${
                option.held ? 'border-violet-500 bg-violet-500' : 'border-slate-300'
              }`}
            >
              {option.held && <Check size={8} weight="bold" className="text-white" />}
            </span>
            <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-slate-800">
              {option.name}
            </span>
            {option.recommended && !option.chosen && (
              <Sparkle size={9} weight="fill" className="shrink-0 text-amber-500" />
            )}
            {option.completed && (
              <Check size={10} weight="bold" className="shrink-0 text-emerald-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

ChoiceSatelliteNode.displayName = 'ChoiceSatelliteNode';

export default ChoiceSatelliteNode;
