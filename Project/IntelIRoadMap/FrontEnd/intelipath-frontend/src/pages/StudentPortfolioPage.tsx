import React, { useEffect, useState } from "react"
import { Spinner } from "@/components/ui"
import {
  portfolioApi,
  PortfolioData
} from "@/features/shared/portfolio/api/portfolioApi"
// We will create this component next
import { EPortfolioEditor } from "@/features/shared/portfolio/components/EPortfolioEditor"

import { useAuth } from "@/context"
import { studentDashboardService } from "@/features/student/services/studentDashboardService"
import { toPortfolioLearningJourney } from "@/features/student/mappers/portfolioLearningJourneyMapper"

export const StudentPortfolioPage = () => {
  const { user } = useAuth()
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const [portfolioRes, roadmapRes, levelRes] = await Promise.all([
          portfolioApi.getPortfolio(),
          studentDashboardService.getStudentRoadmap(),
          studentDashboardService.getStudentLevel()
        ])

        // Owner view can use the already-authorized roadmap endpoint immediately.
        // The portfolio response remains the source for public and mentor views.
        portfolioRes.learningJourney ??= toPortfolioLearningJourney(roadmapRes)
        portfolioRes.studentLevel ??= levelRes

        // Name, greeting, role and the enrolment entry used to be patched in here from
        // an authenticated profile call. That made this page show a different person
        // than /p/{slug}, which has no session to make that call with — and the patch
        // was never saved, so the public page had nothing to read either. The backend
        // now fills those defaults for every viewer; see PortfolioMapper.

        setData(portfolioRes)
      } catch (err) {
        console.error("Failed to load portfolio data", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioData()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50">
        <Spinner
          size={36}
          className="text-[#00838f]"
          label="Loading your portfolio"
        />
        <p className="text-sm font-medium text-slate-500">
          Loading your portfolio…
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500">
        Couldn't load your portfolio. Please try again.
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen">
      {/* We pass the initial data to the editor. The editor manages its own state and auto-saving */}
      <EPortfolioEditor initialData={data} />
    </div>
  )
}
