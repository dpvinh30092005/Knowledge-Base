import { useState } from "react"
import { isAxiosError } from "axios"
import profileApi from "../api/profileApi"
import { getErrorMessage } from "../lib/utils"
import { useAuth } from "../context/AuthContext"

export interface OnboardingErrors {
  fullName?: string
  yob?: string
  bio?: string
  university?: string
  admissionDate?: string
  general?: string
}

export function useStudentOnboarding(isOpen: boolean, onClose?: () => void) {
  const { user } = useAuth()

  const [fullName, setFullName] = useState(user?.fullName || "")
  const [yob, setyob] = useState("")
  const [bio, setBio] = useState("")
  const [university, setUniversity] = useState("")
  const [admissionDate, setAdmissionDate] = useState("")
  const [major, setMajor] = useState("Software Engineering")
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<OnboardingErrors>({})
  const [step, setStep] = useState(1)

  const handleNext = () => {
    const nextErrors: OnboardingErrors = {}

    if (!fullName.trim()) {
      nextErrors.fullName = "Full Name is required"
    }

    if (!yob) {
      nextErrors.yob = 'Select your date of birth.'
    } else {
      const birthDate = new Date(yob)
      const today = new Date()
      if (birthDate >= today) {
        nextErrors.yob = 'Date of birth cannot be in the future.'
      } else if (today.getFullYear() - birthDate.getFullYear() < 10) {
        nextErrors.yob = 'You must be at least 10 years old.'
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setStep(2)
  }

  const handleClose = () => {
    setFullName("")
    setyob("")
    setBio("")
    setUniversity("")
    setAdmissionDate("")
    setMajor("Software Engineering")
    setErrors({})
    setStep(1)
    setIsSaving(false)
    onClose?.()
  }

  const handleSave = async () => {
    setErrors({})
    setIsSaving(true)

    const currentErrors: typeof errors = {}

    if (!admissionDate) {
      currentErrors.admissionDate = 'Select your admission date.'
    } else if (yob) {
      const birthDate = new Date(yob)
      const parsed = new Date(admissionDate)
      if (parsed > new Date()) {
        currentErrors.admissionDate = 'Admission date cannot be in the future.'
      } else if (parsed <= birthDate) {
        currentErrors.admissionDate = 'Admission date must be after your date of birth.'
      } else if (parsed.getFullYear() - birthDate.getFullYear() < 10) {
        currentErrors.admissionDate = 'Admission date seems too early based on your age.'
      }
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors)
      setIsSaving(false)
      return
    }

    try {
      await profileApi.updateUserProfile({
        fullName,
        yob,
        bio
      })

      if (user?.role === "STUDENT") {
        await profileApi.updateStudentProfile({
          universityName: university || null,
          admissionDate: admissionDate || null,
          major,
          careerId: undefined
        })
      }

      setStep(1)
      handleClose()
    } catch (err) {
      if (!isAxiosError(err) || !err.response) {
        setErrors({
          general: "Network error."
        })
      } else if (err.response.status === 400) {
        setErrors({
          general: err.response.data?.message || "Invalid input."
        })
      } else {
        setErrors({
          general: getErrorMessage(err)
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  return {
    user,
    fullName,
    setFullName,
    yob,
    setyob,
    bio,
    setBio,
    university,
    setUniversity,
    admissionDate,
    setAdmissionDate,
    major,
    setMajor,
    isSaving,
    errors,
    step,
    setStep,
    handleNext,
    handleSave,
    handleClose
  }
}
