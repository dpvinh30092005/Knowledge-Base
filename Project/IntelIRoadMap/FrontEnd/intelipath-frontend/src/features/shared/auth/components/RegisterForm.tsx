import React, { useState } from "react"
import { Eye, EyeOff, LoaderCircle } from "lucide-react"
import { isAxiosError } from "axios"
import { useNavigate } from "react-router-dom"
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
import { getErrorMessage, isValidEmail, isValidPassword } from "@/lib"
import { ROUTES } from "@/shared"

export default function RegisterForm() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
    agreeTerms?: string
    general?: string
  }>({})
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage("")

    const currentErrors: typeof errors = {}

    if (!fullName.trim()) currentErrors.fullName = "Full Name is required"
    if (!email) currentErrors.email = "Email address is required"
    else if (!isValidEmail(email)) currentErrors.email = "Please provide a valid email format"
    if (!password) currentErrors.password = "Password is required"
    else if (!isValidPassword(password)) {
      currentErrors.password = "Password must be 4-10 chars with uppercase, number & special character"
    }
    if (!confirmPassword) currentErrors.confirmPassword = "Please confirm your password"
    else if (password !== confirmPassword) currentErrors.confirmPassword = "Passwords do not match"
    if (!agreeTerms) currentErrors.agreeTerms = "You must agree to the terms"

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.register({ email, password, fullName })
      setSuccessMessage("Register successfully! You can now sign in.")
      navigate(ROUTES.LOGIN)
      setFullName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setAgreeTerms(false)
    } catch (err: unknown) {
      if (!isAxiosError(err)) {
        setErrors({ general: getErrorMessage(err) })
      } else if (err.response?.status === 400) {
        setErrors({
          general: err.response.data?.message || "Email already exists or invalid input."
        })
      } else {
        setErrors({ general: getErrorMessage(err) })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pb-5 pt-0">
        <CardTitle className="font-display text-3xl font-bold tracking-tight">
          Create Your Account
        </CardTitle>
        <CardDescription>
          Join thousands of students building their future with InteliPath.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 pb-0 pt-0">
        {errors.general && (
          <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errors.general}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reg-name">Full Name</FieldLabel>
              <Input
                id="reg-name"
                type="text"
                placeholder="Nguyen Van A"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value)
                  clearError("fullName")
                }}
                className={errors.fullName ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15" : ""}
              />
              {errors.fullName && <FieldDescription className="text-rose-600">{errors.fullName}</FieldDescription>}
            </Field>

            <Field>
              <FieldLabel htmlFor="reg-email">Email</FieldLabel>
              <Input
                id="reg-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  clearError("email")
                }}
                className={errors.email ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15" : ""}
              />
              <FieldDescription>
                We use this email for sign-in and account notifications.
              </FieldDescription>
              {errors.email && <FieldDescription className="text-rose-600">{errors.email}</FieldDescription>}
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="reg-pass">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="reg-pass"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      clearError("password")
                    }}
                    className={`pr-10 ${errors.password ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15" : ""}`}
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
                <FieldDescription>Must be 4-10 chars with uppercase, number and special character.</FieldDescription>
                {errors.password && <FieldDescription className="text-rose-600">{errors.password}</FieldDescription>}
              </Field>

              <Field>
                <FieldLabel htmlFor="reg-confirm">Confirm Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="reg-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      clearError("confirmPassword")
                    }}
                    className={`pr-10 ${errors.confirmPassword ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FieldDescription>Please confirm your password.</FieldDescription>
                {errors.confirmPassword && (
                  <FieldDescription className="text-rose-600">{errors.confirmPassword}</FieldDescription>
                )}
              </Field>
            </div>

            <Field>
              <label className="flex items-start gap-2.5 text-xs leading-5 text-slate-600">
                <input
                  id="terms-checkbox"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(event) => {
                    setAgreeTerms(event.target.checked)
                    if (event.target.checked) clearError("agreeTerms")
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600/20"
                />
                <span>
                  I agree to the <span className="font-semibold text-cyan-700">Terms of Service</span> and{" "}
                  <span className="font-semibold text-cyan-700">Privacy Policy</span>.
                </span>
              </label>
              {errors.agreeTerms && <FieldDescription className="text-rose-600">{errors.agreeTerms}</FieldDescription>}
            </Field>

            <Field>
              <Button type="submit" variant="brand" disabled={isSubmitting} className="h-11 w-full">
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              <FieldDescription className="text-center">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="font-semibold text-cyan-700 hover:underline"
                >
                  Sign in
                </button>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
