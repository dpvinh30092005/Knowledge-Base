import React, { useState, useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { NavLink, useNavigate } from "react-router-dom"
import { LayoutDashboard, MessageSquare, UserPlus, Users, TrendingDown } from "lucide-react"
import { UserHeaderActions, Logo, SharedAppBackground } from "@/components"
import { ROUTES } from "@/shared"
import { useAuth } from "@/context"

// Import our consolidated widgets
import {
  CounselorHero,
  CareerDistributionChart,
  MissingSkillsChart,
  FeedbackListWidget
} from "./CounselorDashboardWidgets"

gsap.registerPlugin(useGSAP)

export default function CounselorDashboardView() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [selectedCareer, setSelectedCareer] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const sparkleRef = useRef<SVGSVGElement>(null)

  // Totals for hero stats populated by widget callbacks
  const [totalStudents, setTotalStudents] = useState<number | null>(null)
  const [totalSkillGaps, setTotalSkillGaps] = useState<number | null>(null)
  const [totalFeedbacks, setTotalFeedbacks] = useState<number | null>(null)

  useGSAP(
    () => {
      // Entrance animations
      gsap.from(".page-header", { y: -50, opacity: 0, duration: 1.0, ease: "power4.out", delay: 0.05 })
      gsap.from(".hero-icon", { scale: 0, rotation: -45, opacity: 0, duration: 0.9, ease: "back.out(2)", delay: 0.3 })
      gsap.from(".stat-pill", { x: 40, opacity: 0, duration: 0.65, stagger: 0.1, ease: "power3.out", delay: 0.55 })
      gsap.from(".section-row", { y: 60, opacity: 0, duration: 0.85, stagger: 0.2, ease: "power3.out", delay: 0.4 })
      gsap.from(".widget-container", { y: 35, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out", delay: 0.6 })
      gsap.from(".widget-title", { x: -20, opacity: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.85 })
      gsap.from(".stats-badge", { scale: 0, opacity: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.7)", delay: 1.0 })

      // Sparkle twinkle (infinite loop)
      if (sparkleRef.current) {
        const tl = gsap.timeline({ repeat: -1, delay: 1.2 })
        tl.to(sparkleRef.current, { scale: 1.3, opacity: 0.4, rotate: 20, duration: 0.35, ease: "power2.in" })
          .to(sparkleRef.current, { scale: 1.15, opacity: 1, rotate: -15, duration: 0.25, ease: "power2.out" })
          .to(sparkleRef.current, { scale: 1, opacity: 0.9, rotate: 0, duration: 0.4, ease: "power1.inOut" })
          .to({}, { duration: 3 })
      }
    },
    { scope: containerRef }
  )

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  // Define stats for Hero
  const stats = [
    { icon: Users, label: "Students", value: totalStudents },
    { icon: TrendingDown, label: "Missing Skills", value: totalSkillGaps },
    { icon: MessageSquare, label: "Feedbacks", value: totalFeedbacks }
  ]

  return (
    <div className="relative min-h-screen bg-transparent font-sans pb-4" ref={containerRef}>
      <SharedAppBackground />
      {/* HEADER (Glass Pill Style) */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-6 md:px-8 pt-6 pointer-events-none">
        <nav className="pointer-events-auto flex w-full max-w-[1400px] items-center justify-between transition-all">
          <div className="flex items-center">
            <Logo iconOnly className="scale-[0.85] origin-left" />
          </div>

          <div className="hidden lg:flex items-center gap-1 bg-white/50 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-1.5 py-1.5 text-[13px] font-bold">
            <NavLink
              to={ROUTES.DASHBOARD_COUNSELOR}
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
                }`
              }
            >
              <LayoutDashboard size={16} />
              Dashboard
            </NavLink>
            <NavLink
              to={ROUTES.COUNSELOR_FEEDBACK}
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
                }`
              }
            >
              <MessageSquare size={16} />
              View Student
            </NavLink>
            <NavLink
              to={ROUTES.COUNSELOR_ADD_STUDENT}
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-700 hover:text-slate-900 hover:bg-white/40"
                }`
              }
            >
              <UserPlus size={16} />
              Add Student
            </NavLink>
          </div>

          <div className="flex items-center justify-end">
            <div className="bg-white/80 backdrop-blur-md shadow-sm border border-white/60 rounded-full pr-1 pl-3 py-1 flex items-center gap-2">
              <UserHeaderActions user={user} onLogout={handleLogout} />
            </div>
          </div>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 pt-28 space-y-7">
        <CounselorHero ref={sparkleRef} stats={stats} />

        <div className="section-row">
          <CareerDistributionChart onSelectCareer={setSelectedCareer} onTotalLoaded={setTotalStudents} />
        </div>

        <div className="section-row flex flex-col gap-6">
          <MissingSkillsChart careerFilter={selectedCareer} onTotalLoaded={setTotalSkillGaps} />
          <FeedbackListWidget onTotalLoaded={setTotalFeedbacks} />
        </div>
      </main>
    </div>
  )
}
