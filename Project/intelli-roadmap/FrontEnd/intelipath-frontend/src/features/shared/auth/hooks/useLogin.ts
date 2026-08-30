import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import { buildOAuthAuthorizationUrl, OAUTH_PROVIDERS } from "@/app/config/appConfig"
import authApi from "@/features/shared/auth/api/authApi"
import { useAuth } from "@/context"
import { getErrorMessage } from "@/lib/utils"
import { ROLES, ROUTES } from "@/shared"

/** Same role landing pages the OAuth callback uses, so both sign-in paths agree. */
function dashboardForRole(role?: string): string {
  switch (role?.toUpperCase()) {
    case ROLES.ADMIN:
      return ROUTES.DASHBOARD_ADMIN
    case ROLES.COUNSELOR:
      return ROUTES.DASHBOARD_COUNSELOR
    case ROLES.MENTOR:
      return ROUTES.DASHBOARD_MENTOR
    default:
      return ROUTES.DASHBOARD_STUDENT
  }
}

export function useLogin() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const oauthError = searchParams.get("error")

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [formError, setFormError] = useState<string | undefined>()

  const handleGoogleLogin = () => {
    window.location.href = buildOAuthAuthorizationUrl(OAUTH_PROVIDERS.GOOGLE)
  }

  const handleGithubLogin = () => {
    window.location.href = buildOAuthAuthorizationUrl(OAUTH_PROVIDERS.GITHUB)
  }

  const handleCredentialsLogin = async () => {
    if (!username.trim() || !password) {
      setFormError("Enter your username and password.")
      return
    }

    setFormError(undefined)
    setIsSigningIn(true)
    try {
      const response = await authApi.login(username.trim(), password)
      const { accessToken, refreshToken, expiresIn } = response.data
      await login({ accessToken, refreshToken: refreshToken ?? null, expiresIn })

      let role: string | undefined
      try {
        role = jwtDecode<{ role?: string }>(accessToken).role
      } catch {
        // Fall through to the student dashboard.
      }
      navigate(dashboardForRole(role))
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSigningIn(false)
    }
  }

  return {
    oauthError,
    username,
    setUsername,
    password,
    setPassword,
    isSigningIn,
    formError,
    handleCredentialsLogin,
    handleGoogleLogin,
    handleGithubLogin
  }
}
