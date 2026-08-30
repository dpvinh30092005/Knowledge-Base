import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { RouteProgressBar } from "@/components"
import { useAuth } from "@/context"
import { jwtDecode } from "jwt-decode"
import { ROLES, ROUTES } from "@/shared"

type OAuthTokenPayload = {
  role?: string
  exp?: number
}

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()

  const urlError = searchParams.get("error")

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null
    return null
  }

  const deleteCookie = (name: string) => {
    document.cookie = name + "=; Max-Age=-99999999; path=/"
  }

  // The backend only ever sets "token" as a plain, JS-readable cookie for this
  // one-time handoff. The refresh token is HttpOnly (same cookie name reused by
  // AuthenticationCookieService), so document.cookie can never see its value here
  // by design — there is nothing for this page to read or forward.
  const [token] = useState(() => getCookie("token"))

  useEffect(() => {
    if (token) deleteCookie("token")
  }, [token])

  const callbackError = urlError
    ? `URL Error: ${urlError}`
    : !token
      ? "No token found in cookies"
      : null

  const tokenResult = useMemo(() => {
    if (!token) return { decoded: null, error: null }

    try {
      return { decoded: jwtDecode<OAuthTokenPayload>(token), error: null }
    } catch (err: unknown) {
      return {
        decoded: null,
        error:
          "Decode failed: " + (err instanceof Error ? err.message : String(err))
      }
    }
  }, [token])

  const [loginError, setLoginError] = useState<string | null>(null)
  const errorDetails = callbackError || tokenResult.error || loginError

  useEffect(() => {
    if (callbackError || !token || !tokenResult.decoded) return

    const role = tokenResult.decoded.role
    const expiresIn = tokenResult.decoded.exp
      ? new Date(tokenResult.decoded.exp * 1000).toISOString()
      : undefined

    // No refresh token to pass here: it never leaves the backend's HttpOnly cookie.
    login({ accessToken: token, refreshToken: null, expiresIn })
      .then(() => {
        const userRole = role?.toUpperCase() || ROLES.STUDENT
        if (userRole === ROLES.ADMIN) navigate(ROUTES.DASHBOARD_ADMIN)
        else if (userRole === ROLES.COUNSELOR)
          navigate(ROUTES.DASHBOARD_COUNSELOR)
        else if (userRole === ROLES.MENTOR) navigate(ROUTES.DASHBOARD_MENTOR)
        else navigate(ROUTES.DASHBOARD_STUDENT)
      })
      .catch((err) => {
        console.error("Login Error:", err)
        setLoginError("Login failed: " + (err.message || JSON.stringify(err)))
      })
  }, [callbackError, login, navigate, token, tokenResult.decoded])

  if (errorDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-800">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">OAuth login failed</h1>
          <p className="mt-2 text-sm text-slate-600">{errorDetails}</p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.LOGIN)}
            className="mt-5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RouteProgressBar />
    </div>
  )
}
