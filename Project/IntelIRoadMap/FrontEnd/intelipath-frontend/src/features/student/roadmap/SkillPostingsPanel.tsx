import { useEffect, useState } from 'react'
import { ArrowSquareOut, Briefcase, X } from '@phosphor-icons/react'
import { Spinner } from '@/components/ui'
import { fetchSkillPostings, type SkillPostings } from './skillPostings'

type Props = {
  skillId: string | null
  /** What the student clicked, so the panel can name itself before the fetch lands. */
  skillName: string | null
  onClose: () => void
}

/** Short "15 Jul 2026" for a posting date; the raw string if it will not parse. */
function formatDate(raw: string | null): string | null {
  if (!raw) return null
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * The ads behind a market number.
 *
 * <p><b>Why this exists.</b> The roadmap told a student "Java — 158 postings"
 * and gave them no way to find out whether that was true, or what those 158 jobs
 * were. They are being asked to choose a language on the strength of that
 * figure, so it cannot be a number they have to trust: each row here is a real
 * ad with a link out to the source, and the claim is checkable against the site
 * it came from rather than against us.
 *
 * <p><b>The total is not the list length.</b> The fetch is capped, so a sample
 * of twenty under a headline of 158 has to say which one it is — otherwise the
 * panel quietly contradicts the number that opened it.
 */
export default function SkillPostingsPanel({ skillId, skillName, onClose }: Props) {
  const [data, setData] = useState<SkillPostings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!skillId) return
    let active = true
    setIsLoading(true)
    setFailed(false)
    setData(null)
    fetchSkillPostings(skillId)
      .then(result => { if (active) setData(result) })
      .catch(() => { if (active) setFailed(true) })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [skillId])

  if (!skillId) return null

  const title = data?.skillName || skillName || 'this skill'

  return (
    // Fixed, and started below the header rather than at the top of whatever
    // positioned ancestor happens to be nearest. This is rendered outside <main>,
    // so `absolute right-4 top-4` resolved against the page root and landed
    // exactly under the header's avatar cluster — which is `fixed` at z-50 and
    // therefore won every overlap. The header pill sits at 24px with ~56px of
    // height, so 96px clears it and its shadow; the max-height is measured from
    // the same offset so the list scrolls instead of running off screen.
    <div className="fixed right-4 top-[96px] z-40 flex max-h-[calc(100vh-120px)] w-[340px] flex-col overflow-hidden rounded-2xl bg-white/95 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/10 backdrop-blur">
      <div className="flex items-start justify-between gap-2 border-b border-slate-900/[0.06] px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Briefcase size={12} weight="bold" />
            Job ads mentioning
          </p>
          <p className="truncate text-[14px] font-bold text-slate-900">{title}</p>
          {data && (
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              {/* Says what the list is a sample of. Without this the cap reads as
                  the count and undercuts the figure the student clicked on. */}
              {data.postings.length < data.totalCount
                ? `Showing ${data.postings.length} of ${data.totalCount}`
                : `${data.totalCount} ${data.totalCount === 1 ? 'posting' : 'postings'}`}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
            <Spinner size={18} />
            <span className="text-[12px] font-medium">Fetching the ads…</span>
          </div>
        )}

        {failed && !isLoading && (
          <p className="px-1 py-6 text-center text-[12px] text-slate-500">
            Could not load the postings just now. The figure still stands on the data
            behind it — this panel is only the view onto it.
          </p>
        )}

        {!isLoading && !failed && data?.postings.length === 0 && (
          // "None on file" and "we did not look" are different answers, and this
          // is the first one. Said plainly rather than shown as an empty box.
          <p className="px-1 py-6 text-center text-[12px] text-slate-500">
            No postings on file for {title} in the scraped set.
          </p>
        )}

        <ul className="flex flex-col gap-1.5">
          {data?.postings.map(posting => {
            const posted = formatDate(posting.postedDate)
            const meta = [posting.location, posting.experience, posted].filter(Boolean)
            return (
              <li key={posting.id}>
                <a
                  href={posting.link ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded-xl px-3 py-2.5 transition-colors ${
                    posting.link ? 'hover:bg-slate-50' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-semibold leading-snug text-slate-800">
                      {posting.title ?? 'Untitled posting'}
                    </p>
                    {posting.link && (
                      <ArrowSquareOut size={13} weight="bold" className="mt-0.5 shrink-0 text-slate-300" />
                    )}
                  </div>
                  {meta.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-slate-500">{meta.join(' · ')}</p>
                  )}
                  {/* Salary is what the ad says, verbatim — including "Very
                      Attractive!!!". Normalising it here would be inventing a
                      number the employer declined to give. */}
                  {posting.salary && (
                    <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">{posting.salary}</p>
                  )}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
