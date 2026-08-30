import { useState } from "react"
import { isAxiosError } from "axios"
import profileApi from "@/api/profileApi"
import { toast } from "@/lib/toast"

/** Change-password form state and submit handler, shared by every role's settings page. */
export function useChangePassword() {
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError(null)
  }

  const openDialog = () => {
    reset()
    setOpen(true)
  }

  const closeDialog = () => {
    if (submitting) return
    setOpen(false)
    reset()
  }

  const submit = async () => {
    setError(null)

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.")
      return
    }

    setSubmitting(true)
    try {
      await profileApi.changePassword({ currentPassword, newPassword })
      toast.success("Password changed. Other devices have been signed out.")
      setOpen(false)
      reset()
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined
      setError(message || "Failed to change password. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return {
    open,
    openDialog,
    closeDialog,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    submitting,
    error,
    submit
  }
}
