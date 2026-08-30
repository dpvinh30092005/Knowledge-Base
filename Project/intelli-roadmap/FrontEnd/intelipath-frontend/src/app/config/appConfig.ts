const API_VERSION_PREFIX = "/api/v1"

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `http://localhost:8080${API_VERSION_PREFIX}`

export const API_HOST =
  import.meta.env.VITE_API_HOST || API_BASE_URL.replace(API_VERSION_PREFIX, "")

export const OAUTH_PROVIDERS = {
  GOOGLE: "google",
  GITHUB: "github"
} as const

export const buildOAuthAuthorizationUrl = (provider: string) =>
  `${API_HOST}/oauth2/authorization/${provider}`
