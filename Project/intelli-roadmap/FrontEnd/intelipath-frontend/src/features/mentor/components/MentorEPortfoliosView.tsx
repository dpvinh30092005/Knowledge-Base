/* Hallmark · macrostructure: Workbench · tone: utilitarian · anchor hue: teal #00838f
 * pre-emit critique: P5 H5 E4 S5 R5 V4
 * Depth system, not widgets. Rows live in ONE recessed well over the slate-50 blueprint
 * grid — the well's slate body shows through gap-px as hairline dividers, so the list
 * reads as flush rows carved into one surface, not a stack of floating cards. A row goes
 * opaque-white on hover (grid hidden = it lifts); the Review pill is the one element that
 * rises off the plane by default.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowsClockwise, Briefcase, FolderOpen, Warning } from '@phosphor-icons/react'
import { ROUTES } from '@/shared'
import mentorApi from '@/features/mentor/api/mentorApi'

/** Chìm — a recessed well; its slate body shows through gap-px as hairline dividers. */
const WELL =
  'overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-200/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]'
/** A cell resting inside a well: translucent so the blueprint grid reads through it. */
const CELL = 'bg-white/45'

/** Exactly the fields /mentor/feedback/students sends. Nothing here is aspirational. */
type MentorStudent = {
  id: string
  portfolioSlug: string
  fullName: string
  email: string
  career: string
  university: string
}

type Load = 'loading' | 'ready' | 'failed'

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase() || '?'

export function MentorEPortfoliosView() {
  const [students, setStudents] = useState<MentorStudent[]>([])
  const [load, setLoad] = useState<Load>('loading')
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    setLoad('loading')
    mentorApi
      .getStudentsList()
      .then((rows) => {
        if (!alive) return
        setStudents(rows as MentorStudent[])
        setLoad('ready')
      })
      .catch(() => alive && setLoad('failed'))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="pb-10">
      <header className="mb-6">
        <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">
          Students who asked you for a review
        </h2>
        <p className="mt-1 text-[14px] font-medium text-slate-500">
          A student appears here once they send you a portfolio review request.
        </p>
      </header>

      {load === 'loading' && (
        // Three rows in the list's own shape, so the real names land in place
        // instead of shoving a centred spinner out of the way.
        <div className={`${WELL} flex flex-col gap-px`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${CELL} flex items-center gap-4 p-5`}>
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200/70" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-40 animate-pulse rounded bg-slate-200/70" />
                <div className="h-3 w-56 animate-pulse rounded bg-slate-200/70" />
              </div>
              <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-200/70" />
            </div>
          ))}
        </div>
      )}

      {load === 'failed' && (
        // A failed request used to return [] and render as loading forever, so a 500
        // was indistinguishable from a slow network. It gets to say so now.
        <div className={`${WELL} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-500/20">
            <Warning size={20} weight="bold" />
          </span>
          <p className="text-[15px] font-semibold text-slate-800">That list didn&apos;t load</p>
          <p className="max-w-sm text-[13px] font-medium text-slate-500">
            The request to the server failed. Your students are still there.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-1 inline-flex items-center gap-2 rounded-xl bg-[#00838f] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-px hover:bg-[#006064] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00838f]/40 active:translate-y-0"
          >
            <ArrowsClockwise size={15} weight="bold" /> Try again
          </button>
        </div>
      )}

      {load === 'ready' && students.length === 0 && (
        // The empty case used to fall into the skeleton branch and spin forever.
        // Nothing is wrong here — there is simply no request yet.
        <div className={`${WELL} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400">
            <FolderOpen size={20} weight="regular" />
          </span>
          <p className="text-[15px] font-semibold text-slate-800">No review requests yet</p>
          <p className="max-w-sm text-[13px] font-medium text-slate-500">
            Students find you in the mentor directory and send a request from their portfolio.
          </p>
        </div>
      )}

      {load === 'ready' && students.length > 0 && (
        <div className={`${WELL} flex flex-col gap-px`}>
          {students.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => navigate(ROUTES.PORTFOLIO_INTERNAL.replace(':slug', student.portfolioSlug))}
              className={`${CELL} group flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00838f]/40`}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ccfbf1] text-[13px] font-semibold text-[#0f766e]">
                {initialsOf(student.fullName)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-slate-900">{student.fullName}</span>
                <span className="mt-0.5 block truncate text-[12.5px] font-medium text-slate-500">{student.email}</span>
              </span>

              <span className="hidden shrink-0 items-center gap-2 sm:flex">
                <Briefcase size={13} className="text-slate-400" />
                <span className="text-[12px] font-semibold text-slate-600">{student.career}</span>
              </span>

              {/* Nổi — the one element that lifts off the plane. */}
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#00838f] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.18)] transition-all group-hover:-translate-y-px group-hover:bg-[#006064] group-hover:shadow-[0_4px_12px_rgba(0,131,143,0.28)]">
                Review
                <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default MentorEPortfoliosView
