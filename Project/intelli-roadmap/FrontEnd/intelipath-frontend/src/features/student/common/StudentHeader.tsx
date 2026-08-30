import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { MapTrifold, Robot, SquaresFour, TrendUp, IdentificationCard, ChatTeardropText, ArrowsClockwise, Gauge, Target } from "@phosphor-icons/react"
import { UserHeaderActions, Logo, MobileNavMenu } from "@/components"
import { ROUTES } from "@/shared"
import type { User } from "@/features/shared/auth/types"
import { StudentLevelRing, levelColors } from "@/features/student/level"
import type { StudentLevel } from "@/features/student/types"

type StudentHeaderProps = {
  user: User | null
  onLogout: () => void | Promise<void>
  onOpenAiMentor: () => void
  /** Omitted on pages that do not load it; the level cluster then does not render. */
  level?: StudentLevel | null
  /** Opens the assessment modal. Without it, Reassess is not offered. */
  onTakeAssessment?: () => void
  /**
   * The career every other number on the page is measured against.
   *
   * <p>Shown whether or not the student has been assessed, and deliberately
   * beside the level rather than buried in a panel: readiness, priority, market
   * demand and the whole roadmap are answers to "for which job", and a page that
   * shows the answers without the question leaves the student guessing which
   * role they are being measured for — or whether their choice registered at all.
   */
  careerName?: string | null
}


/**
 * What the ring is measuring, spelled out for the hover.
 *
 * <p>The counts are what the arc is drawn from, so they have to be readable
 * somewhere — a ring that is 43% closed with no way to find out 6-of-14 is
 * decoration. Returns the band alone when there are no counts rather than
 * inventing a denominator.
 */
function levelTitle(level: StudentLevel): string {
  const { heldCount, requiredCount } = level
  return typeof heldCount === 'number' && typeof requiredCount === 'number' && requiredCount > 0
    ? `${level.level} — ${heldCount} of ${requiredCount} required skills`
    : String(level.level)
}

export default function StudentHeader({ user, onLogout, onOpenAiMentor, level = null, onTakeAssessment, careerName = null }: StudentHeaderProps) {
  const location = useLocation()
  const isAiMentorActive = location.pathname === ROUTES.AI_MENTOR
  // FPT coursework only. Hiding it for everyone else is the honest default: the endpoints
  // behind it answer 403, so an always-on link would just be a dead end.
  const isFptAccount = user?.accountType === "FPT"

  const navigate = useNavigate()

  const mobileNavItems = [
    { id: "dashboard", label: "Dashboard", active: location.pathname === ROUTES.DASHBOARD_STUDENT, onSelect: () => navigate(ROUTES.DASHBOARD_STUDENT) },
    { id: "roadmap", label: "Roadmap", active: location.pathname.startsWith(ROUTES.DASHBOARD_STUDENT_ROADMAP), onSelect: () => navigate(ROUTES.DASHBOARD_STUDENT_ROADMAP) },
    { id: "market", label: "Market Pulse", active: location.pathname.startsWith(ROUTES.DASHBOARD_STUDENT_MARKET_PULSE), onSelect: () => navigate(ROUTES.DASHBOARD_STUDENT_MARKET_PULSE) },
    { id: "portfolio", label: "Portfolio", active: location.pathname.startsWith(ROUTES.DASHBOARD_STUDENT_PORTFOLIO), onSelect: () => navigate(ROUTES.DASHBOARD_STUDENT_PORTFOLIO) },
    ...(isFptAccount
      ? [{ id: "courses", label: "Courses", active: location.pathname.startsWith(ROUTES.DASHBOARD_STUDENT_COURSES), onSelect: () => navigate(ROUTES.DASHBOARD_STUDENT_COURSES) }]
      : []),
    { id: "aichat", label: "AI Mentor", active: isAiMentorActive, onSelect: onOpenAiMentor },
  ]

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-6 md:px-8 pt-6 pointer-events-none">
      {/* A three-column grid, not justify-between.
          With justify-between the middle group is centred only when the two
          outer groups happen to weigh the same, so the nav pill drifted from
          page to page — the roadmap carries a career chip, a level chip and a
          Reassess button, and that extra width shoved the nav left of every
          other page's. `1fr auto 1fr` centres the middle against the page
          instead of against whatever else is on the row. */}
      <nav className="pointer-events-auto grid w-full max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center transition-all">
        {/* Left: Logo */}
        <div className="flex items-center justify-self-start">
          <Logo iconOnly className="scale-[0.85] origin-left" />
        </div>

        {/* Center: Navigation Links in a Glass Pill */}
        <div className="hidden lg:flex items-center gap-1 bg-white/50 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-1.5 py-1.5 text-[13px] font-bold">
          <NavLink
            to={ROUTES.DASHBOARD_STUDENT}
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
                isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to={ROUTES.DASHBOARD_STUDENT_ROADMAP}
            className={({ isActive }) =>
              `flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
                isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
              }`
            }
          >
            Roadmap
          </NavLink>
          <NavLink
            to={ROUTES.DASHBOARD_STUDENT_MARKET_PULSE}
            className={({ isActive }) =>
              `flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
                isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
              }`
            }
          >
            Market Pulse
          </NavLink>
          <NavLink
            to={ROUTES.DASHBOARD_STUDENT_PORTFOLIO}
            className={({ isActive }) =>
              `flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
                isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
              }`
            }
          >
            Portfolio
          </NavLink>
          {isFptAccount && (
            <NavLink
              to={ROUTES.DASHBOARD_STUDENT_COURSES}
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
                  isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
                }`
              }
            >
              Courses
            </NavLink>
          )}
          <button
            type="button"
            onClick={onOpenAiMentor}
            className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
              isAiMentorActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            AI Mentor
          </button>
        </div>

        {/* Right: level cluster + user actions + mobile menu.
            The level used to be a separate bar floating over the roadmap canvas,
            in a corner that already held a breadcrumb and a tool rail. It says
            something about the student, not about the roadmap, so it now travels
            with the avatar — as a ring around it, with the band name and the
            retake beside it. Same information, no canvas spent on it. */}
        <div className="flex items-center justify-end gap-2">
          <MobileNavMenu items={mobileNavItems} />
          <div className="bg-white/80 backdrop-blur-md shadow-sm border border-white/60 rounded-full pr-1 pl-1.5 py-1 flex items-center gap-1">
            {/* The target, first — everything to its right is measured against it.
                Independent of the level on purpose: the role is a decision the
                student made, the level is a verdict about them, and the decision
                must be visible before, during and after being assessed. */}
            {careerName && (
              <>
                <span
                  title={`Your roadmap, readiness and market figures are all for ${careerName}`}
                  className="hidden md:inline-flex max-w-[180px] items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-widest text-white"
                >
                  <Target size={12} weight="bold" className="shrink-0 opacity-70" />
                  <span className="truncate">{careerName}</span>
                </span>
                <span className="mx-0.5 hidden h-5 w-px bg-slate-900/[0.08] md:block" aria-hidden="true" />
              </>
            )}
            {level && (
              <>
                {/* The word, because a colour alone cannot say "FRESHER" — and a
                    ring alone would leave the level legible only to whoever
                    memorised the palette. */}
                <span
                  title={levelTitle(level)}
                  className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-widest ring-1 ${levelColors(level.level).chip}`}
                >
                  {level.level}
                </span>
                {onTakeAssessment && (
                  <button
                    type="button"
                    onClick={onTakeAssessment}
                    title="Reassess my level"
                    aria-label="Reassess my level"
                    className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <ArrowsClockwise size={15} weight="bold" />
                  </button>
                )}
                <span className="mx-0.5 h-5 w-px bg-slate-900/[0.08]" aria-hidden="true" />
              </>
            )}
            {/* No level yet is a real state, not a zero — offer the assessment
                rather than an empty ring. */}
            {!level && onTakeAssessment && (
              <>
                <button
                  type="button"
                  onClick={onTakeAssessment}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <Gauge size={13} weight="bold" />
                  Assess my level
                </button>
                <span className="mx-0.5 h-5 w-px bg-slate-900/[0.08]" aria-hidden="true" />
              </>
            )}
            <UserHeaderActions
              user={user}
              onLogout={onLogout}
              onSettings={() => navigate(ROUTES.DASHBOARD_STUDENT_SETTINGS)}
              avatarAccent={<StudentLevelRing level={level} />}
            />
          </div>
        </div>
      </nav>
    </div>
  )
}
