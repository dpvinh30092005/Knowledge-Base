import React from 'react'
import { Navigate } from 'react-router-dom'
import { RouteProgressBar } from '@/components'
import { useAuth } from '@/context'
import { ROUTES } from '@/shared'

interface GuestRouteProps {
  children: React.ReactNode
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, loading } = useAuth()

  // COMMENTED OUT ORIGINAL FOR TEAM CONTRIBUTION PRESERVATION (Removing loading state for instant load):
  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-slate-50">
  //       <RouteProgressBar />
  //     </div>
  //   )
  // }

  // If the user is already logged in, send them to the smart dashboard routing
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <>{children}</>
}
