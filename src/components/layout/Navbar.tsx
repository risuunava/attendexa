import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getXPLevel } from '../../lib/xpCalculator'
import {
  LayoutDashboard,
  History,
  Trophy,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const employeeNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Riwayat', path: '/history', icon: <History size={20} /> },
  { label: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={20} /> },
  { label: 'Izin/Cuti', path: '/izin', icon: <FileText size={20} /> },
  { label: 'Profil', path: '/profile', icon: <User size={20} /> },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Karyawan', path: '/admin/karyawan', icon: <User size={20} /> },
  { label: 'Absensi', path: '/admin/absensi', icon: <History size={20} /> },
  { label: 'Lokasi', path: '/admin/lokasi', icon: <FileText size={20} /> },
  { label: 'Izin', path: '/admin/izin', icon: <FileText size={20} /> },
]

const bossNav: NavItem[] = [
  { label: 'Dashboard', path: '/boss/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Analytics', path: '/boss/analytics', icon: <Trophy size={20} /> },
  { label: 'Leaderboard', path: '/boss/leaderboard', icon: <Trophy size={20} /> },
]

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!profile) return null

  const level = getXPLevel(profile.total_xp)

  const navItems =
    profile.role === 'admin'
      ? adminNav
      : profile.role === 'boss'
      ? bossNav
      : employeeNav

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Desktop / Top Navbar */}
      <nav className="glass-nav sticky top-0 z-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-primary transition-transform group-hover:scale-110">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-800 hidden sm:block">
              Attend<span className="text-primary">exa</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${
                      isActive
                        ? 'text-primary bg-primary-50'
                        : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50'
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-primary-50 rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right Side: XP + Avatar + Logout */}
          <div className="flex items-center gap-3">
            {/* XP Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 text-primary text-sm font-semibold">
              <span>{level.emoji}</span>
              <span className="font-tabular">{profile.total_xp} XP</span>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Desktop Logout */}
            <button
              onClick={handleSignOut}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-neutral-400 hover:text-danger hover:bg-danger-light text-sm transition-all duration-200"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 md:hidden"
          >
            <div className="glass-card mx-4 mt-2 p-3 space-y-1">
              {/* XP info on mobile */}
              <div className="flex items-center gap-2 px-4 py-3 mb-2 rounded-xl bg-primary-50/50">
                <span className="text-lg">{level.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-neutral-800">
                    {profile.full_name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {level.name} • {profile.total_xp} XP
                  </p>
                </div>
              </div>

              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? 'text-primary bg-primary-50'
                          : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
                      }
                    `}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}

              <hr className="border-neutral-100 my-2" />

              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-danger hover:bg-danger-light transition-all duration-200"
              >
                <LogOut size={20} />
                Keluar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
