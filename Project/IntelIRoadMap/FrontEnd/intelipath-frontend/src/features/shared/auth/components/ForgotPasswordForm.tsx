import React, { useState } from "react"
import { LoaderCircle, MailCheck } from "lucide-react"
import authApi from "@/features/shared/auth/api/authApi"
import { Button, Field, FieldDescription, FieldGroup, FieldLabel, Input } from "@/components"
import { isValidEmail, getErrorMessage } from "@/lib"

type ForgotPasswordFormProps = {
  /** Return to the sign-in view of the popup. */
  onBack: () => void
}

/**
 * "Forgot password" step of the sign-in popup. Chromeless (no card / header of
 * its own) — LoginDialog supplies the dialog frame and title around it.
 */
export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }

    setIsSubmitting(true)
    try {
      // POST /api/v1/auth/forgot-password { email }
      // The backend always answers 200 whether or not the address exists, so we
      // never branch on the result — we just confirm the link is on its way.
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Sent state ──────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="flex flex-col items-center gap-5 py-1 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <MailCheck className="h-6 w-6" />
        </div>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-600">
          If an account exists for{" "}
          <span className="font-medium text-slate-800">{email}</span>, we've sent a link
          to reset your password. It expires in 30 minutes.
        </p>
        <Button type="button" variant="outline" onClick={onBack} className="w-full">
          Back to Sign In
        </Button>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <Field>
          <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError("")
            }}
            disabled={isSubmitting}
            className={error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15" : ""}
          />
        </Field>

        <Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
          <FieldDescription className="text-center">
            Remember your password?{" "}
            <button
              type="button"
              onClick={onBack}
              className="font-semibold text-slate-900 hover:underline"
            >
              Back to Sign In
            </button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
