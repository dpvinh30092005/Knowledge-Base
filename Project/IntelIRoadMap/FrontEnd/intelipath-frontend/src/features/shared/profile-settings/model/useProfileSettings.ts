import { useEffect, useState } from "react"
import profileApi from "@/api/profileApi"
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/lib/toast"

export interface ProfileData {
  full_name: string
  yob: string
  bio: string
  email: string
  role: string
  // Student (free text, display only)
  university: string
  /** Read-only, set by the backend: FPT accounts get the FPT curriculum and its material. */
  accountType?: "FPT" | "OTHER"
  // Student
  major: string
  /** ISO date, as an <input type="date"> holds it. */
  admission_date: string
  // Mentor
  company: string
  industry_focus: string
  // Counselor
  department: string
  // Common
  github_profile?: string
  avatar_url?: string
  // Student: transcript uploaded for AI Mentor personalization
  transcript_url?: string
}

const EMPTY_PROFILE: ProfileData = {
  full_name: "",
  yob: "",
  bio: "",
  email: "",
  role: "Student",
  university: "",
  accountType: "OTHER",
  major: "",
  admission_date: "",
  company: "",
  industry_focus: "",
  department: "",
  github_profile: "",
  avatar_url: "",
  transcript_url: ""
}

export function useProfileSettings() {
  const { user, updateUser } = useAuth()
  const [profileData, setProfileData] = useState<ProfileData>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = async () => {
    setLoading(true)
    setError(null)

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), 5000)
    )

    try {
      let data: any = {}
      if (user?.role?.toUpperCase() === "STUDENT") {
        const res = await Promise.race([
          profileApi.getStudentProfile(),
          timeout
        ])
        data = (res as any).data
      } else if (user?.role?.toUpperCase() === "MENTOR") {
        const res = await Promise.race([profileApi.getMentorProfile(), timeout])
        data = (res as any).data
      } else if (user?.role?.toUpperCase() === "COUNSELOR") {
        const res = await Promise.race([
          profileApi.getCounselorProfile(),
          timeout
        ])
        data = (res as any).data
      }

      setProfileData({
        ...EMPTY_PROFILE,
        ...user,
        ...data,
        full_name:
          data?.fullName ||
          data?.user?.fullName ||
          data?.userInfo?.fullName ||
          user?.fullName ||
          data?.full_name ||
          "",
        email:
          data?.email ||
          data?.user?.email ||
          data?.userInfo?.email ||
          user?.email ||
          "",
        role: data?.role || data?.user?.role || user?.role || "Student",
        major: data?.major || data?.student?.major || EMPTY_PROFILE.major,
        // The API sends an ISO date; <input type="date"> wants yyyy-MM-dd with no time.
        admission_date: String(
          data?.admissionDate ??
            data?.academicCounselor?.admissionDate ??
            data?.student?.admissionDate ??
            ""
        ).split("T")[0],
        university:
          data?.university ||
          data?.userInfo?.university ||
          data?.academicCounselor?.universityName ||
          data?.student?.universityName ||
          data?.student?.university ||
          "",
        accountType: data?.accountType || data?.student?.accountType || "OTHER",
        department:
          data?.department || data?.academicCounselor?.department || "",
        industry_focus:
          data?.industryFocus ||
          data?.industry_focus ||
          data?.industryMentor?.industryFocus ||
          "",
        bio:
          data?.bio ||
          data?.user?.bio ||
          data?.userInfo?.bio ||
          (user as any)?.bio ||
          "",
        avatar_url:
          data?.avatarUrl ||
          data?.user?.avatarUrl ||
          data?.userInfo?.avatarUrl ||
          user?.avatarUrl ||
          "",
        transcript_url:
          data?.transcriptUrl || data?.student?.transcriptUrl || "",
        yob:
          (
            data?.yob ||
            data?.user?.yob ||
            data?.userInfo?.yob ||
            (user as any)?.yob ||
            ""
          )
            ?.toString()
            .split("T")[0] || ""
      })
    } catch (err) {
      console.warn(
        "[ProfileSettingsPage] Cannot load profile (API may be offline):",
        err
      )
      // Fallback to user data from auth context so form still shows something
      setProfileData({
        ...EMPTY_PROFILE,
        full_name: user?.fullName || "",
        email: user?.email || "",
        role: user?.role || "Student"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProfile()
  }, [])

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    if (profileData.yob) {
      const birthDate = new Date(profileData.yob)
      const today = new Date()
      if (birthDate >= today) {
        setError("Date of birth cannot be in the future.")
        setSaving(false)
        return
      } else if (today.getFullYear() - birthDate.getFullYear() < 10) {
        setError("You must be at least 10 years old.")
        setSaving(false)
        return
      }
    }

    if (
      user?.role?.toUpperCase() === "STUDENT" &&
      profileData.admission_date &&
      profileData.yob
    ) {
      const birthDate = new Date(profileData.yob)
      const admissionDate = new Date(profileData.admission_date)
      if (admissionDate > new Date()) {
        setError("Admission date cannot be in the future.")
        setSaving(false)
        return
      } else if (admissionDate <= birthDate) {
        setError("Admission date must be after your date of birth.")
        setSaving(false)
        return
      } else if (admissionDate.getFullYear() - birthDate.getFullYear() < 10) {
        setError("Admission date seems too early based on your age.")
        setSaving(false)
        return
      }
    }

    try {
      const tasks: Promise<any>[] = [
        profileApi.updateUserProfile({
          fullName: profileData.full_name,
          yob: profileData.yob,
          bio: profileData.bio
        } as any)
      ]

      if (user?.role?.toUpperCase() === "STUDENT") {
        tasks.push(
          profileApi.updateStudentProfile({
            universityName: profileData.university,
            admissionDate: profileData.admission_date || null,
            major: profileData.major
            // Original: careerId: ""
            // Removed to prevent wiping out data
          })
        )
      } else if (user?.role?.toUpperCase() === "MENTOR") {
        tasks.push(
          profileApi.updateMentorProfile({
            company: profileData.company,
            industryFocus: profileData.industry_focus
          })
        )
      } else if (user?.role?.toUpperCase() === "COUNSELOR") {
        tasks.push(
          profileApi.updateCounselorProfile({
            department: profileData.department,
            admissionDate: profileData.admission_date || null
          })
        )
      }

      await Promise.all(tasks)

      toast.success("Profile saved.")
    } catch (err) {
      console.error("[ProfileSettingsPage] Error saving profile:", err)
      setError("Save failed. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    setSaving(true)
    setError(null)
    try {
      const res = await profileApi.updateAvatar(file)
      // the backend returns the updated UserResponse, which has avatarUrl
      const updatedUser = res.data?.data || res.data
      const newUrl = updatedUser?.avatarUrl || ""

      setProfileData((prev) => ({ ...prev, avatar_url: newUrl }))
      updateUser({ avatarUrl: newUrl })
      toast.success("Avatar updated.")
    } catch (err) {
      console.error("[ProfileSettingsPage] Error uploading avatar:", err)
      setError("Failed to upload avatar. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleTranscriptUpload = async (file: File) => {
    setSaving(true)
    setError(null)
    try {
      const res = await profileApi.uploadTranscript(file)
      const updated = (res as any).data?.data || (res as any).data
      const newUrl = updated?.transcriptUrl || ""

      setProfileData((prev) => ({ ...prev, transcript_url: newUrl }))
      toast.success("Transcript uploaded. The AI Mentor can now use it.")
    } catch (err) {
      console.error("[ProfileSettingsPage] Error uploading transcript:", err)
      setError("Failed to upload transcript. Please try again.")
      toast.error("Failed to upload transcript. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const displayInitial = profileData.full_name?.[0]?.toUpperCase() ?? "U"
  const role = profileData.role || user?.role || "Student"
  const githubName =
    profileData.github_profile?.split("/").filter(Boolean).pop() ||
    profileData.full_name.split(" ").join("").toLowerCase() ||
    "user"

  return {
    profileData,
    loading,
    saving,
    error,
    handleChange,
    handleSave,
    handleAvatarUpload,
    handleTranscriptUpload,
    loadProfile,
    displayInitial,
    role,
    githubName
  }
}
