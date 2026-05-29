import { Navigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

/**
 * Route guard that:
 * 1. Shows loading spinner while auth is resolving
 * 2. Redirects to /login if not authenticated
 * 3. Redirects to root (which shows error) if profile missing
 * 4. Redirects to appropriate dashboard if role not in allowedRoles
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #F0F9FF 50%, #F9FAFB 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(26, 86, 219, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 style={{ width: 32, height: 32, color: '#1A56DB' }} className="animate-spin" />
          </div>
          <p style={{ color: '#6B7280', fontWeight: 500 }}>Memuat...</p>
        </div>
      </div>
    )
  }

  // Not logged in at all
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // User exists but profile is missing — redirect to root which handles this state
  if (!profile) {
    return <Navigate to="/" replace />
  }

  // Check role if roles are specified
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    const dashboardMap: Record<UserRole, string> = {
      employee: '/dashboard',
      admin: '/admin/dashboard',
      boss: '/boss/dashboard',
    }
    return <Navigate to={dashboardMap[profile.role]} replace />
  }

  return <>{children}</>
}
