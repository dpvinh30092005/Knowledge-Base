import { useAuth } from '@/context'
import { Navigate } from 'react-router-dom'
import { ROLES, ROUTES } from '@/shared'

export default function DashboardPage() {
  const { user } = useAuth()

  // No real user (a stale/expired session that slipped through) → back to Welcome. Never
  // coerce a missing user/role into a STUDENT dashboard: that is the "empty dashboard" bug.
  if (!user || !user.role) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  // A present-but-unrecognised role still defaults to STUDENT.
  const rawRole = user.role.toUpperCase()
  const role = (rawRole === ROLES.ADMIN || rawRole === ROLES.MENTOR || rawRole === ROLES.COUNSELOR)
    ? rawRole
    : ROLES.STUDENT

  if (role === ROLES.ADMIN) {
    return <Navigate to={ROUTES.DASHBOARD_ADMIN} replace />
  } else if (role === ROLES.MENTOR) {
    return <Navigate to={ROUTES.DASHBOARD_MENTOR} replace />
  } else if (role === ROLES.COUNSELOR) {
    return <Navigate to={ROUTES.DASHBOARD_COUNSELOR} replace />
  } else {
    return <Navigate to={ROUTES.DASHBOARD_STUDENT} replace />
  }
}
