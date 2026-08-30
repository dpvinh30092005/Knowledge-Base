import { useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Code2, PenLine, X } from 'lucide-react'
import type {
  GradedAnswerDraft,
  GradedAssessmentItem,
  GradedAssessmentPaper,
  GradedAssessmentResult,
} from '../assessment'

type Props = {
  paper: GradedAssessmentPaper
  drafts: Record<string, GradedAnswerDraft>
  onChange: (itemId: string, draft: GradedAnswerDraft) => void
  result: GradedAssessmentResult | null
}

/** What each tier is called where the student can see it. */
const TIER_LABEL: Record<number, string> = { 1: 'Core', 2: 'Intermediate', 3: 'Advanced' }

/**
 * The graded paper, one question at a time.
 *
 * <p><b>Why one at a time and not a scrolling list.</b> Fourteen questions with
 * code editors in them is several screens of form, and a student who can see how
 * much is left before they have read the first question answers the first question
 * badly. One card with a position indicator is the same information without the
 * dread.
 *
 * <p><b>Nothing is validated as "required".</b> An unanswered question scores zero
 * and the server records it as such — that is a real answer about what the student
 * knows. Blocking submission until every box is filled would only teach people to
 * guess, which is exactly the signal the scoring tries to remove.
 */
export default function GradedAssessmentForm({ paper, drafts, onChange, result }: Props) {
  const [index, setIndex] = useState(0)

  if (result) return <ResultView paper={paper} result={result} />

  const item = paper.items[index]
  const answeredCount = useMemo(
    () => paper.items.filter(i => isAnswered(drafts[i.id])).length,
    [paper.items, drafts]
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Where you are. Deliberately above the question: a student should know a
          paper is fourteen long before they start writing an essay in question 2. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Question {index + 1} of {paper.items.length}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {TIER_LABEL[item.tier] ?? 'Core'}
          </span>
          {item.kind === 'CODE' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <Code2 size={10} /> Code
            </span>
          )}
          {item.kind === 'SHORT_ANSWER' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <PenLine size={10} /> Written
            </span>
          )}
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-slate-400">
          {answeredCount} answered
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full origin-left rounded-full bg-slate-900 transition-transform duration-300"
          style={{ transform: `scaleX(${(index + 1) / paper.items.length})` }}
        />
      </div>

      <ItemCard
        item={item}
        draft={drafts[item.id] ?? emptyDraft()}
        onChange={draft => onChange(item.id, draft)}
      />

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={14} /> Previous
        </button>

        {/* Jump dots. A student who wants to come back to question 3 should not
            have to click Previous eleven times. */}
        <div className="flex flex-wrap items-center justify-center gap-1">
          {paper.items.map((entry, position) => (
            <button
              key={entry.id}
              type="button"
              aria-label={`Go to question ${position + 1}`}
              onClick={() => setIndex(position)}
              className={`h-2 w-2 rounded-full transition-colors ${
                position === index
                  ? 'bg-slate-900'
                  : isAnswered(drafts[entry.id])
                    ? 'bg-slate-400'
                    : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={index === paper.items.length - 1}
          onClick={() => setIndex(i => Math.min(paper.items.length - 1, i + 1))}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function ItemCard({
  item,
  draft,
  onChange,
}: {
  item: GradedAssessmentItem
  draft: GradedAnswerDraft
  onChange: (draft: GradedAnswerDraft) => void
}) {
  const multi = item.kind === 'MULTI_CHOICE'

  const toggle = (key: string) => {
    if (multi) {
      const next = draft.choiceKeys.includes(key)
        ? draft.choiceKeys.filter(k => k !== key)
        : [...draft.choiceKeys, key]
      onChange({ ...draft, choiceKeys: next })
    } else {
      // Re-clicking the chosen option clears it. Without this a misclick on the
      // first option cannot be undone, only replaced — and "I do not know" is a
      // real answer worth being able to give.
      onChange({ ...draft, choiceKeys: draft.choiceKeys.includes(key) ? [] : [key] })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{item.topic}</p>
        <Prompt text={item.prompt} />
      </div>

      {item.choices.length > 0 && (
        <>
          {multi && (
            <p className="text-[11.5px] font-medium text-slate-500">
              Select every option that applies — partial answers score nothing.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {item.choices.map(choice => {
              const selected = draft.choiceKeys.includes(choice.key)
              return (
                <button
                  key={choice.key}
                  type="button"
                  onClick={() => toggle(choice.key)}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                    selected
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`mt-px grid h-4 w-4 shrink-0 place-items-center text-[10px] font-black ${
                      multi ? 'rounded' : 'rounded-full'
                    } ${selected ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {selected ? <Check size={10} strokeWidth={3} /> : choice.key.toUpperCase()}
                  </span>
                  <span className="text-[12.5px] leading-relaxed">{choice.text}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {item.kind === 'SHORT_ANSWER' && (
        <textarea
          value={draft.text}
          onChange={event => onChange({ ...draft, text: event.target.value })}
          rows={7}
          placeholder="A few sentences. What you would look at, in what order, and what you would expect to find."
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-[12.5px] leading-relaxed text-slate-800 outline-none transition-colors focus:border-slate-900"
        />
      )}

      {item.kind === 'CODE' && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {item.language ?? 'code'}
            </span>
            {item.starterCode && draft.text !== item.starterCode && (
              <button
                type="button"
                onClick={() => onChange({ ...draft, text: item.starterCode ?? '' })}
                className="text-[10.5px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
              >
                Reset to the starting code
              </button>
            )}
          </div>
          {/* A textarea, not an embedded IDE. The rubric grades behaviour, not
              formatting, so syntax highlighting would cost a dependency and buy
              the grading nothing. Tab is left to the browser so keyboard users
              can still leave the field. */}
          <textarea
            value={draft.text || item.starterCode || ''}
            onChange={event => onChange({ ...draft, text: event.target.value })}
            rows={14}
            spellCheck={false}
            className="w-full resize-y bg-slate-950 p-3 font-mono text-[12px] leading-relaxed text-slate-100 outline-none"
          />
        </div>
      )}
    </div>
  )
}

/**
 * The question text, with fenced code blocks rendered as code.
 *
 * <p>Several prompts are "what does this log" questions, and a code snippet run
 * together with the prose as one paragraph is a different, harder question than
 * the one being asked.
 */
function Prompt({ text }: { text: string }) {
  const blocks = text.split(/```/)
  return (
    <div className="mt-1.5 flex flex-col gap-2">
      {blocks.map((block, i) =>
        i % 2 === 1 ? (
          <pre
            key={i}
            className="overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-[11.5px] leading-relaxed text-slate-100"
          >
            {block.replace(/^\w+\n/, '').trimEnd()}
          </pre>
        ) : (
          block.trim() && (
            <p key={i} className="whitespace-pre-line text-[13px] leading-relaxed text-slate-800">
              {block.trim()}
            </p>
          )
        )
      )}
    </div>
  )
}

/**
 * What happened, question by question.
 *
 * <p>The explanations are the point. A paper that returns a level and no
 * reasoning is a grade; the sentence saying why the other option was wrong is the
 * only part of this a student learns from, so it is shown for right answers too.
 */
function ResultView({
  paper,
  result,
}: {
  paper: GradedAssessmentPaper
  result: GradedAssessmentResult
}) {
  const topicById = useMemo(
    () => Object.fromEntries(paper.items.map(item => [item.id, item])),
    [paper.items]
  )

  return (
    <div className="flex flex-col gap-3">
      {result.rationale && (
        <p className="rounded-xl bg-slate-50 p-3 text-[12.5px] leading-relaxed text-slate-600">
          {result.rationale}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {result.items.map(outcome => {
          const item = topicById[outcome.id]
          return (
            <div key={outcome.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {outcome.topic || item?.topic}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="text-[11px] font-bold tabular-nums text-slate-500">
                    {outcome.awarded}/{outcome.possible}
                  </span>
                  {outcome.correct === true && (
                    <Check size={13} strokeWidth={3} className="text-emerald-600" />
                  )}
                  {outcome.correct === false && <X size={13} strokeWidth={3} className="text-rose-500" />}
                </span>
              </div>
              {outcome.feedback && (
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-700">{outcome.feedback}</p>
              )}
              {outcome.explanation && (
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">{outcome.explanation}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function emptyDraft(): GradedAnswerDraft {
  return { choiceKeys: [], text: '' }
}

export function isAnswered(draft: GradedAnswerDraft | undefined): boolean {
  if (!draft) return false
  return draft.choiceKeys.length > 0 || draft.text.trim().length > 0
}
