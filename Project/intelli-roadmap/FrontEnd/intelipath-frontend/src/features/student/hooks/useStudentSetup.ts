import { useEffect, useState } from "react"
import { isAxiosError } from "axios"
import { isUuid } from "@/lib/utils"
import { assessmentService } from "../assessment"
import { studentDashboardService } from "../services/studentDashboardService"
import type { StudentSetupStep } from "../types"

/**
 * Remembers that a student passed on the optional assessment.
 *
 * Local rather than server-side: declining is a UI preference about whether to
 * show an offer, not a fact about the student worth a column and a migration.
 * Losing it (new browser, cleared storage) simply offers the assessment once
 * more, which is a harmless failure mode.
 */
const declinedKey = (userId?: string) => `assessment.declined.${userId ?? "anon"}`

const hasDeclinedAssessment = (userId?: string) => {
  try {
    return localStorage.getItem(declinedKey(userId)) === "true"
  } catch {
    return false
  }
}

const declineAssessment = (userId?: string) => {
  try {
    localStorage.setItem(declinedKey(userId), "true")
  } catch {
    /* private mode: the offer will simply appear again next time */
  }
}

// Add missing interface
interface SetupProfile {
  university?: string;
  admissionDate?: string;
  major?: string;
  careerPath?: { id?: string };
  career?: {
    careerId?: string
    career_id?: string
    id?: string
  }
  careerId?: string
  career_id?: string
}

const getProfileCareerId = (profile: SetupProfile | null | undefined) =>
  profile?.careerId ||
  profile?.career_id ||
  profile?.career?.careerId ||
  profile?.career?.career_id ||
  profile?.career?.id ||
  ""

export function useStudentSetup(userId?: string) {
  const [activeSetupStep, setActiveSetupStep] = useState<StudentSetupStep>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    if (!userId) return

    let active = true

    const loadSetupStatus = async () => {
      try {
        // 1. Fetch profile first
        let profile: SetupProfile | null = null
        let profileError = false
        try {
          profile = await studentDashboardService.getStudentProfile() as SetupProfile
        } catch (err) {
          console.warn("[Student Setup] Profile fetch failed; leaving onboarding closed:", err)
          profileError = true
        }

        if (!active) return

        // A request that FAILED is not a student who has not answered. This used
        // to force the wizard open, and the commonest failure by far is an
        // expired token — so a student with a complete profile, 18 selected
        // skills and three saved assessments got the whole four-step onboarding
        // thrown over whatever they were doing, including on top of an open
        // dialog. The same reasoning the assessment branch below already applies
        // to itself: only the server actually saying the data is absent may
        // reopen onboarding.
        if (profileError) return

        const profileCareerId = getProfileCareerId(profile)
        const isProfileMissing =
          !profile ||
          !profile.university ||
          !profile.admissionDate ||
          !profile.major ||
          !isUuid(profileCareerId)

        // If profile is missing, force profile onboarding immediately and DO NOT call getSelectedSkills()
        if (isProfileMissing) {
          setActiveSetupStep("profile")
          return
        }

        // 2. Only fetch Selected Skills if profile is already complete
        let skills: any = []
        let skillsError = false
        try {
          skills = await studentDashboardService.getSelectedSkills()
        } catch (err) {
          console.warn("[Student Setup] Skills fetch failed; leaving onboarding closed:", err)
          skillsError = true
        }

        if (!active) return
        if (skillsError) return

        const isSkillsMissing =
          !Array.isArray(skills) ||
          skills.length === 0

        if (isSkillsMissing) {
          setActiveSetupStep("skills")
          return
        }

        // 3. The assessment is an OFFER, not a gate. Two consequences, and both
        //    are deliberate departures from how the steps above behave:
        //    - a student who declined it must never be asked again, and the
        //      server has no "declined" state, so the dismissal is remembered
        //      locally;
        //    - a failed request must let them through, unlike the skills branch
        //      above which treats a failure as "missing". Trapping someone in an
        //      optional step because the network blinked is the worst outcome
        //      available here.
        if (hasDeclinedAssessment(userId)) {
          setActiveSetupStep(null)
          return
        }

        let hasAssessment = true
        try {
          hasAssessment = Boolean(await assessmentService.getLatest())
        } catch (err) {
          console.warn("[Student Setup] Assessment check failed; skipping the offer:", err)
        }

        if (!active) return
        setActiveSetupStep(hasAssessment ? null : "assessment")
      } catch (error) {
        console.error("[Student Setup] Failed to check profile and skills:", error)
      } finally {
        if (active) setIsInitializing(false)
      }
    }

    void loadSetupStatus()

    return () => {
      active = false
    }
  }, [userId])

  return {
    activeSetupStep,
    isInitializing,
    openSkillSelection: () => setActiveSetupStep("skills"),
    openAssessment: () => setActiveSetupStep("assessment"),
    goBackToProfile: () => setActiveSetupStep("profile"),
    goBackToSkills: () => setActiveSetupStep("skills"),
    /**
     * Ends onboarding. When the student is on the assessment step this also
     * records that they passed on it, so the offer does not reappear on every
     * page load — an optional step that keeps asking stops reading as optional.
     */
    completeSetup: () => {
      if (activeSetupStep === "assessment") declineAssessment(userId)
      setActiveSetupStep(null)
    }
  }
}
