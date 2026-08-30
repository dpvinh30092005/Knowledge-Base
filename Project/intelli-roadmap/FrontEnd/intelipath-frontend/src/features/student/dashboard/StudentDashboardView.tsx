import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Spinner } from "@/components/ui"
import { useAuth } from "@/context"
import { ROUTES } from "@/shared"
import { useStudentSetup, RoadmapProgressProvider } from "../hooks"
import { StudentLevelBadge, VerifyEvidenceNudge, useStudentLevel } from "../level"
import { SkillMapView, useCoreSkills } from "../skill-map"
import {
  StudentWelcomeHeader,
  CurrentProgressBanner,
  ActionableListWidget,
  QuickStatsWidget,
  MarketDemandChartWidget,
  SkillMatchWidget
} from "./StudentDashboardWidgets"
import { SharedAppBackground } from "@/components"
import StudentProfileSetupModal from "@/features/student/onboarding/StudentProfileSetupModal"
import StudentSkillSelectionModal from "@/features/student/onboarding/StudentSkillSelectionModal"
import StudentSkillAssessmentModal from "@/features/student/onboarding/StudentSkillAssessmentModal"
import StudentHeader from "@/features/student/common/StudentHeader"

gsap.registerPlugin(useGSAP)

export default function StudentDashboardView() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const dashboardRef = useRef<HTMLDivElement>(null)
  const { activeSetupStep, isInitializing, openSkillSelection, openAssessment, goBackToProfile, goBackToSkills, completeSetup } = useStudentSetup(user?.id)
  const { level, reload: reloadLevel } = useStudentLevel()
  const { coreSkills } = useCoreSkills()

  useGSAP(() => {
    if (!isInitializing && activeSetupStep === null) {
      // Minimalist staggered fade up
      gsap.from(".anim-block", {
        opacity: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "power1.out",
      });
    }
  }, { scope: dashboardRef, dependencies: [isInitializing, activeSetupStep] })

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }


  const handleAssessmentComplete = async () => {
    completeSetup()
    await reloadLevel()
    navigate(ROUTES.DASHBOARD_STUDENT_ROADMAP)
  }

  return (
    <div ref={dashboardRef} className="relative min-h-[100dvh] overflow-x-hidden bg-transparent pb-32 pt-[120px] font-sans text-slate-900 selection:bg-black/10">
      <SharedAppBackground />
      
      {/* We keep the Header but maybe make it solid white to blend in */}
      <StudentHeader
        user={user}
        onLogout={handleLogout}
        onOpenAiMentor={() => navigate(ROUTES.AI_MENTOR)}
      />

      <main className="mx-auto w-full max-w-[1300px] px-5 py-8 md:px-10 lg:py-12">
        {isInitializing ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Spinner size={32} className="mb-4 text-[#00838f]" label="Preparing your learning space" />
            <p className="text-sm font-bold">Preparing your learning space...</p>
          </div>
        ) : activeSetupStep === null ? (
          <RoadmapProgressProvider>
          <div className="flex flex-col lg:flex-row gap-12 xl:gap-20">
            {/* Left Column (Main Content) */}
            <div className="flex-1 w-full min-w-0">
              <div className="anim-block">
                <StudentWelcomeHeader />
              </div>

              {/* The assessment computed a level and, until now, nothing on this
                  page showed it — getLevel() was called only by a filter chip on
                  Market Pulse. This is also the only route back into retaking. */}
              <div className="anim-block mb-4">
                <StudentLevelBadge level={level} onTakeAssessment={openAssessment} />
              </div>

              {/* Shows only while the verified share sits under the floor that
                  caps the level at Junior, and disappears once it does not. */}
              <div className="anim-block mb-4">
                <VerifyEvidenceNudge level={level} onSynced={reloadLevel} />
              </div>

              {/* Where the student stands against the market, on the same core
                  skill set the level badge above counts. Wide column on purpose:
                  a scatter needs room, and the 264px roadmap side panel does not
                  have it. */}
              {coreSkills && coreSkills.length > 0 && (
                <div className="anim-block mb-6">
                  <h2 className="mb-3 text-[20px] font-black tracking-tight text-black">Skill Map</h2>
                  <div className="rounded-3xl bg-[#f9f9f9] p-5">
                    <SkillMapView coreSkills={coreSkills} />
                  </div>
                </div>
              )}

              <div className="anim-block">
                <CurrentProgressBanner />
              </div>
              
              <div className="anim-block">
                <ActionableListWidget />
              </div>
            </div>

            {/* Right Column (Sidebar Statistics) */}
            <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col">
              <div className="anim-block">
                <QuickStatsWidget />
              </div>

              <div className="anim-block mt-4">
                <MarketDemandChartWidget />
              </div>

              <div className="anim-block">
                <SkillMatchWidget />
              </div>
            </div>
          </div>
          </RoadmapProgressProvider>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Welcome to InteliPath</h2>
            <p className="text-slate-500 max-w-md mx-auto">Please complete your profile and select your skills to unlock your personalized learning dashboard.</p>
          </div>
        )}
      </main>

      {/* Modals */}
      <StudentProfileSetupModal isOpen={activeSetupStep === "profile"} onComplete={openSkillSelection} />
      {activeSetupStep === "assessment" && (
        <StudentSkillAssessmentModal isOpen onComplete={handleAssessmentComplete} onBack={goBackToSkills} />
      )}
      {activeSetupStep === "skills" && (
        <StudentSkillSelectionModal isOpen onComplete={openAssessment} onBack={goBackToProfile} />
      )}
    </div>
  )
}
