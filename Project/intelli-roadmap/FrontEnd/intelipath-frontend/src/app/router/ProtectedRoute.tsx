import React from 'react'
import { Navigate } from 'react-router-dom'
import { RouteProgressBar } from '@/components'
import { useAuth } from '@/context'
import { ROLES, ROUTES } from '@/shared'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <RouteProgressBar />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (allowedRoles?.length) {
    const rawRole = user?.role?.toUpperCase()
    const userRole = (rawRole === ROLES.ADMIN || rawRole === ROLES.MENTOR || rawRole === ROLES.COUNSELOR)
      ? rawRole
      : ROLES.STUDENT

    if (!allowedRoles.includes(userRole)) {
      return <Navigate to={ROUTES.DASHBOARD} replace />
    }
  }

  return <>{children}</>
}
