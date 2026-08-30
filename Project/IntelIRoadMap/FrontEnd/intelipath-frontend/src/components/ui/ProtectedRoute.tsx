import RouteProtectedRoute from "@/app/router/ProtectedRoute"

export default function ProtectedRoute({
  children
}: {
  children: React.ReactNode
}) {
  return <RouteProtectedRoute>{children}</RouteProtectedRoute>
}
