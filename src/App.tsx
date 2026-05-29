import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import { Loader2, AlertTriangle } from 'lucide-react'

// Components
import ProtectedRoute from './components/common/ProtectedRoute'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/employee/DashboardPage'
import AbsenPage from './pages/employee/AbsenPage'
import HistoryPage from './pages/employee/HistoryPage'
import LeaderboardPage from './pages/employee/LeaderboardPage'
import ProfilePage from './pages/employee/ProfilePage'

// Placeholder pages for admin/boss (will be built later)
function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-neutral-50 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Admin Dashboard</h1>
        <p className="text-neutral-500">Halaman admin sedang dikembangkan.</p>
      </div>
    </div>
  )
}

function BossDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-neutral-50 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Boss Dashboard</h1>
        <p className="text-neutral-500">Halaman boss sedang dikembangkan.</p>
      </div>
    </div>
  )
}

/**
 * Root redirect helper — sends authenticated users
 * to their role-specific dashboard.
 * Shows a proper loading spinner instead of a white screen.
 */
function RootRedirect() {
  const { user, profile, loading, authError, signOut } = useAuth()

  // Show loading spinner (never a blank white screen)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-blue-50 to-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <p className="text-neutral-500 font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  // User is logged in but profile failed to load (e.g. trigger failed to create users row)
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-blue-50 to-neutral-50 px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-warning-light flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-xl font-bold text-neutral-800 mb-2">Profil Tidak Ditemukan</h2>
          <p className="text-sm text-neutral-500 mb-2">
            Akun Anda sudah terdaftar, tetapi profil belum terbuat di database.
          </p>
          {authError && (
            <p className="text-xs text-danger bg-danger-light rounded-lg p-2 mb-4 font-mono">
              {authError}
            </p>
          )}
          <p className="text-sm text-neutral-500 mb-6">
            Silakan hapus akun di Supabase Dashboard → Authentication, lalu buat ulang akun baru.
          </p>
          <button
            onClick={() => signOut()}
            className="btn-primary w-full"
          >
            Logout & Kembali ke Login
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const dashboardMap = {
    employee: '/dashboard',
    admin: '/admin/dashboard',
    boss: '/boss/dashboard',
  }

  return <Navigate to={dashboardMap[profile!.role]} replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
              borderRadius: '12px',
              color: '#1F2937',
              fontSize: '14px',
              fontWeight: '500',
            },
          }}
        />

        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Employee Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/absen"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <AbsenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Boss Routes */}
          <Route
            path="/boss/dashboard"
            element={
              <ProtectedRoute allowedRoles={['boss']}>
                <BossDashboard />
              </ProtectedRoute>
            }
          />

          {/* Root — redirect based on role */}
          <Route path="/" element={<RootRedirect />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App