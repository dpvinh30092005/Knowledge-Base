import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isAxiosError } from "axios"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{4,10}$/
  return passwordRegex.test(password)
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function toIsoDateOnly(value: string): string {
  const trimmed = value.trim()
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  return ""
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 400) return message || "Invalid input"
    // The server's own wording wins, as it does on every other status. Sign-in is by
    // username, and this helper also serves onboarding and profile forms, where a 401
    // means the session lapsed — "invalid email" was wrong on both counts.
    if (status === 401) return message || "Invalid username or password"
    if (status === 403) return message || "Account is suspended"
    if (status === 404) return message || "Not found"
    if (status === 409) return message || "That already exists"

    return message || "Something went wrong"
  }
  return "Cannot connect to server"
}

export function formatPrerequisite(prerequisite: any): string {
  if (!prerequisite) return ""
  if (Array.isArray(prerequisite)) {
    return prerequisite
      .map((p) => (p && typeof p === "object" ? p.careerName || p.name : String(p)))
      .filter(Boolean)
      .join(", ")
  }
  if (typeof prerequisite === "object") {
    return prerequisite.careerName || prerequisite.name || ""
  }
  return String(prerequisite)
}
