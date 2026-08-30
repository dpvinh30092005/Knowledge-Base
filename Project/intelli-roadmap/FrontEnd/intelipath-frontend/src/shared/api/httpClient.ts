import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig
} from "axios"

//The central system manages all API requests
/**
 * Call Api
 * Attach Token
 * Handle Errors
 * Refresh Token
 * Beautiful Logging
 * Redirect to login on unauthorized
 * logging request/response
 */

import { ENDPOINTS } from "./endpoints"
import { API_BASE_URL } from "@/app/config/appConfig"
import { ROUTES } from "@/shared"
import { toast } from "@/lib/toast"

// Every request use client also go through interceptor
// client request -> request interceptor (attach token) -> send request to backend -> response interceptor (handle errors, refresh token) -> response to caller
//Types
export interface ApiClientConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  withCredentials?: boolean
  getToken?: () => string | null
  getRefreshToken?: () => string | null
  onUnauthorized?: (error?: AxiosError) => void
  onForbidden?: (error?: AxiosError) => void
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean //prevent infinite retry loops
  // Set true on a request's config when the caller renders its own inline error UI,
  // so the global interceptor doesn't also toast the same message.
  skipErrorToast?: boolean
}

// Public request-config extension so callers can pass `skipErrorToast` with proper
// typing instead of casting to `any`.
export interface RequestConfig {
  skipErrorToast?: boolean
}

let isRefreshing = false

interface FailedQueueItem {
  resolve: (token: string | null) => void
  reject: (error: AxiosError | null) => void
}

let failedQueue: FailedQueueItem[] = []

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Global API Loading State
export let globalActiveRequests = 0;
export const onLoadingChange = new Set<(isLoading: boolean) => void>();

// Counted rather than a boolean: concurrent requests are the normal case here, and the
// bar must not finish when the first of them returns.
export const incrementLoading = () => {
  globalActiveRequests++;
  onLoadingChange.forEach(cb => cb(globalActiveRequests > 0));
}

export const decrementLoading = () => {
  // Clamped at zero: an interceptor that decrements a request it never counted would
  // otherwise drive this negative and leave the bar stuck on forever.
  globalActiveRequests = Math.max(0, globalActiveRequests - 1);
  onLoadingChange.forEach(cb => cb(globalActiveRequests > 0));
}

export const getStoredToken = () => localStorage.getItem("accessToken")
// Refresh no longer reads a stored token: the refresh token lives only in the
// backend's HttpOnly cookie (unreadable by JS), so an XSS payload can't steal it
// the way it could from localStorage. The refresh request below always sends `{}`
// and relies on the cookie being sent automatically via `withCredentials`.
const defaultGetRefreshToken = () => null

export const handleUnauthorized = (error?: AxiosError) => {
  if (error) {
    console.error("[AUTH ERROR] Session Expired / Unauthorized", {
      url: error.config?.url,
      status: error.response?.status
    })
  }

  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("tokenExpiresIn")
  localStorage.removeItem("user")

  // check window to avoid redirect loops
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.includes(ROUTES.LOGIN)
  ) {
    window.location.href = ROUTES.LOGIN
  }
}

//Factory Function
//Create Axios Client Facctoty
export function createApiClient({
  baseURL = API_BASE_URL,
  // COMMENTED OUT ORIGINAL FOR TEAM CONTRIBUTION PRESERVATION (Removing timeout):
  // timeout = 300000,
  timeout = 0, // 0 means no timeout
  headers = {},
  withCredentials = true,
  getToken = getStoredToken, //Get access token from localStorage
  getRefreshToken = defaultGetRefreshToken,
  onUnauthorized = handleUnauthorized, //Token expired → logout user
  onForbidden
}: ApiClientConfig = {}): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout,
    withCredentials,
    headers: { "Content-Type": "application/json", ...headers }
  })

  // 1. Request Interceptor: Attach Token & Beautiful Logging
  // Api request interceptor to log requests and attach auth token
  // Request start -> run request interceptor ->  attach token if available -> send request
  client.interceptors.request.use(
    (config) => {
      incrementLoading();
      if (import.meta.env.DEV) {
        console.group(
          `[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
        )
        console.log("Headers :", config.headers)
        if (config.data) {
          const safeData = { ...config.data }
          if (safeData.password) safeData.password = "••••••••"
          if (safeData.confirmPassword) safeData.confirmPassword = "••••••••"
          console.log("Body    :", safeData)
        }
        console.groupEnd()
      }

      //ATTACH TOKEN
      const token = getToken()
      
      if (config.headers) {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    },
    (error) => {
      decrementLoading();
      if (import.meta.env.DEV) {
        console.error(" [API REQUEST ERROR]", error)
      }
      return Promise.reject(error)
    }
  )

  // 2. Response Interceptor: Handle Errors & Refresh Token & Beautiful Logging
  client.interceptors.response.use(
    (response) => {
      decrementLoading();
      if (import.meta.env.DEV) {
        console.group(
          `%c [API RESPONSE] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
          "color: #10b981; font-weight: bold"
        )
        console.log("Status  :", response.status, response.statusText)
        console.log("Data    :", response.data)
        console.groupEnd()
      }
      return response
    },
    async (error: AxiosError) => {
      decrementLoading();
      const originalRequest = error.config as CustomAxiosRequestConfig
      const res = error.response
      const status = res?.status

      if (import.meta.env.DEV) {
        if (res) {
          console.group(
            `%c [API ERROR] ${res.status} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`,
            "color: #ef4444; font-weight: bold"
          )
          console.log("Status  :", res.status, res.statusText)
          console.log("Message :", (res.data as any)?.message || res.data)
          console.log("Full    :", res.data)
          console.groupEnd()
        } else {
          console.group(
            "%c [API ERROR] Network / No Response",
            "color: #ef4444; font-weight: bold"
          )
          console.log("Error   :", error.message)
          console.log("Hint    :", "Check if backend is running at:", baseURL)
          console.groupEnd()
        }
      }

      // 403 Forbidden
      if (status === 403) {
        onForbidden?.(error)
        return Promise.reject(error)
      }
      //Refresh token when access token expired (401 Unauthorized)
      //401 Unauthorized (Token Expiry & Refresh Logic)
      // Flow : Api call → 401 Unauthorized → Using refresh Token -> Backend returns new access token → Retry original request with new token
      // A 401 from signing in is the answer, not an expired session: there is nothing to
      // refresh, and running the refresh anyway makes its own failure ("Refresh token is
      // missing") the error the form reports instead of "Invalid username or password".
      const isAuthRequest = (originalRequest?.url || "").startsWith("/auth/")

      if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject }) // Queue requests while refreshing token
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              return client(originalRequest)
            })
            .catch((err) => Promise.reject(err))
        }

        originalRequest._retry = true // Mark request as retry to prevent infinite loops
        isRefreshing = true // Set refreshing flag to prevent multiple refresh attempts

        try {
          // COMMENTED OUT ORIGINAL FOR TEAM CONTRIBUTION PRESERVATION:
          // const refreshToken = getRefreshToken()
          // if (!refreshToken) {
          //   throw new Error("Refresh token is missing.")
          // }
          //
          // if (import.meta.env.DEV) {
          //   console.group("[AUTH REFRESH] Retrying request after 401")
          //   console.log("endpoint:", `${baseURL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`)
          //   console.log("refreshToken:", refreshToken)
          //   console.log("originalRequest:", originalRequest.url)
          //   console.groupEnd()
          // }
          //
          // // Use a fresh axios instance to avoid infinite interceptor loops
          // const refreshResponse = await axios.post(
          //   //Why cannot use client here?
          //   // Because client has interceptor that attach token,
          //   // if refresh token also expired  → infinite loop 401 → refresh again
          //   // Using axios directly to call refresh endpoint without interceptors to avoid infinite loops
          //   `${baseURL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
          //   {
          //     refreshToken
          //   }
          // )

          // NEW LOGIC (HttpOnly Cookie compat / Backward Compat):
          const refreshToken = getRefreshToken()
          if (import.meta.env.DEV) {
            console.group("[AUTH REFRESH] Retrying request after 401")
            console.log("endpoint:", `${baseURL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`)
            console.log("refreshToken:", refreshToken || "Using HttpOnly Cookie")
            console.log("originalRequest:", originalRequest.url)
            console.groupEnd()
          }

          const refreshResponse = await axios.post(
            `${baseURL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
            refreshToken ? { refreshToken } : {},
            {
              withCredentials: true
            }
          )

          const { accessToken, expiresIn } = refreshResponse.data

          // Assuming refreshResponse being successful means cookies are set
          if (refreshResponse.status === 200 || refreshResponse.status === 201) {
            localStorage.setItem("accessToken", accessToken)
            // rotatedRefreshToken is NOT persisted: the backend already rotated the
            // HttpOnly cookie on this same response, which is the only copy we keep.
            if (expiresIn) {
              localStorage.setItem("tokenExpiresIn", expiresIn)
            }
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
            }
            processQueue(null, accessToken) // Retry queued requests with new token
            return client(originalRequest)
          } else {
            const receivedHtml =
              typeof refreshResponse.data === "string" &&
              refreshResponse.data.trimStart().toLowerCase().startsWith("<!doctype html")

            console.error("[AUTH REFRESH] Invalid backend response", {
              endpoint: `${baseURL}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
              receivedHtml,
              hint: receivedHtml
                ? "Backend redirected /auth/refresh to /login. Permit the refresh endpoint in SecurityConfig."
                : "Backend response must contain accessToken."
            })

            throw new Error("No access token returned from refresh endpoint.")
          }
        } catch (refreshError) {
          processQueue(refreshError as AxiosError, null)
          onUnauthorized(refreshError as AxiosError)
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
      // -------------------------------------------------------------
      // GLOBAL ERROR HANDLING (Frontend API Error Handling Guide)
      // -------------------------------------------------------------
      if (status && status !== 401 && !originalRequest?.skipErrorToast) {
        const data = res?.data as any;
        const beError = data?.error;
        const beMessage = data?.message;

        // 403: Forbidden
        if (status === 403) {
          toast.error("403 - You do not have permission to access this resource.");
        }
        // 400 & 404: Bad Request or Not Found
        else if (status === 404 || status === 400) {
          // If it's a validation error, let the component handle it natively
          if (beError !== "VALIDATION_ERROR" && beMessage) {
            toast.error(`Error: ${beMessage}`);
          }
        }
        // 500: Internal Server Error
        else if (status >= 500) {
          toast.error("An internal server error occurred. Please try again later.");
        }
      }

      return Promise.reject(error)
    }
  )

  return client
}
