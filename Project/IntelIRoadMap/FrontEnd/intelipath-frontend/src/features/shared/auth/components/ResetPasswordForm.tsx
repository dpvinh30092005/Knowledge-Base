import React, { useState } from "react"
import { ArrowLeft, Eye, EyeOff, LoaderCircle, ShieldAlert, ShieldCheck } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import authApi from "@/features/shared/auth/api/authApi"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input
} from "@/components"
import { getErrorMessage } from "@/lib"
import { ROUTES } from "@/shared"

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // The one-time token comes from the emailed magic link: /reset-password?token=xxx
  const token = searchParams.get("token") || ""

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [errors, setErrors] = useState<{
    newPassword?: string
    confirmPassword?: string
    general?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // ── Validate & submit ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const currentErrors: typeof errors = {}

    if (!newPassword) {
      currentErrors.newPassword = "Please enter a new password."
    } else if (newPassword.length < 8) {
      currentErrors.newPassword = "Password must be at least 8 characters."
    }

    if (!confirmPassword) {
      currentErrors.confirmPassword = "Please confirm your new password."
    } else if (newPassword !== confirmPassword) {
      currentErrors.confirmPassword = "Passwords do not match."
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors)
      return
    }

    setIsSubmitting(true)
    try {
      // POST /api/v1/auth/reset-password — JSON: { token, newPassword }
      await authApi.resetPassword({ token, newPassword })
      setSuccess(true)
    } catch (err: unknown) {
      setErrors({ general: getErrorMessage(err) })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Missing / malformed link ─────────────────────────────────────────────
  if (!token) {
    return (
      <Card className="shadow-xl shadow-slate-900/5">
        <CardContent className="flex flex-col items-center gap-5 pt-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-slate-900">
              Invalid reset link
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
              This link is missing its token or is incomplete. Request a new reset link
              and try again.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
            className="h-11 w-full max-w-xs"
          >
            Request a new link
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <Card className="shadow-xl shadow-slate-900/5">
        <CardContent className="flex flex-col items-center gap-5 pt-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-slate-900">
              Password reset
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
              Your password has been successfully updated. You can now sign in with
              your new password.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => navigate(ROUTES.LOGIN)}
            className="h-11 w-full max-w-xs"
          >
            Sign In Now
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────
  return (
    <Card className="shadow-xl shadow-slate-900/5">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Reset Password</CardTitle>
        <CardDescription>
          Choose a new password for your account. Make it at least 8 characters.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {errors.general && (
          <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reset-newpass">New Password</FieldLabel>
              <div className="relative">
                <Input
                  id="reset-newpass"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value)
                    if (errors.newPassword) setErrors({ ...errors, newPassword: undefined })
                  }}
                  className={`pr-10 ${errors.newPassword ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && (
                <FieldDescription className="text-rose-600">{errors.newPassword}</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="reset-confirm">Confirm Password</FieldLabel>
              <div className="relative">
                <Input
                  id="reset-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined })
                  }}
                  className={`pr-10 ${errors.confirmPassword ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <FieldDescription className="text-rose-600">{errors.confirmPassword}</FieldDescription>
              )}
            </Field>

            <Field>
              <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
              <FieldDescription className="text-center">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-900"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </button>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
