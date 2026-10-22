import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

// roles = ['hr'] etc. Leave empty to allow any logged-in user.
export default function ProtectedRoute({ roles = [], children }) {
  const { user, loading } = useSelector((s) => s.auth)
  const location = useLocation()
  if (loading) return <div className="center-msg">Loading…</div>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}
