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
  MapPin,
  Users,
  BarChart3,
  CalendarCheck,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const employeeNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Riwayat', path: '/history', icon: <History size={18} /> },
  { label: 'Leaderboard', path: '/leaderboard', icon: <Trophy size={18} /> },
  { label: 'Izin/Cuti', path: '/izin', icon: <FileText size={18} /> },
  { label: 'Profil', path: '/profile', icon: <User size={18} /> },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Karyawan', path: '/admin/karyawan', icon: <Users size={18} /> },
  { label: 'Absensi', path: '/admin/absensi', icon: <CalendarCheck size={18} /> },
  { label: 'Lokasi', path: '/admin/lokasi', icon: <MapPin size={18} /> },
  { label: 'Izin', path: '/admin/izin', icon: <FileText size={18} /> },
]

const bossNav: NavItem[] = [
  { label: 'Dashboard', path: '/boss/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Analytics', path: '/boss/analytics', icon: <BarChart3 size={18} /> },
  { label: 'Leaderboard', path: '/boss/leaderboard', icon: <Trophy size={18} /> },
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
      {/* Top Navbar */}
      <nav className="glass-nav sticky top-0 z-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-none border-2 border-neutral-800 bg-primary flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937] transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 group-active:translate-y-0 group-active:translate-x-0 group-active:shadow-none">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold font-serif text-neutral-800 hidden sm:block">
              Attend<span className="text-primary italic">exa</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold uppercase tracking-wider
                    transition-all duration-150 border-2
                    ${
                      isActive
                        ? 'text-primary bg-primary-50 border-primary shadow-[2px_2px_0px_0px_#1A56DB]'
                        : 'text-neutral-500 border-transparent hover:text-neutral-800 hover:border-neutral-800 hover:bg-neutral-50'
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right Side: XP + Avatar Dropdown */}
          <div className="flex items-center gap-3 relative">
            
            {/* Desktop Dropdown Container */}
            <div className="hidden md:flex items-center gap-3 group relative cursor-pointer py-2">
              {/* XP Badge */}
              <div className="flex items-center gap-1 px-3 py-1 rounded-none border-2 border-neutral-800 bg-brutalistYellow shadow-[2px_2px_0px_0px_#1F2937] text-sm font-bold text-neutral-900 group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 transition-transform">
                <Zap size={14} />
                <span className="font-tabular font-mono tracking-tighter">{profile.total_xp}</span>
                <span className="text-neutral-800 text-xs ml-0.5">XP</span>
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-none border-2 border-neutral-800 bg-brutalistCyan flex items-center justify-center text-neutral-900 text-sm font-bold shadow-[2px_2px_0px_0px_#1F2937] group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 transition-transform">
                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              {/* Dropdown Menu */}
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border-2 border-neutral-800 shadow-[4px_4px_0px_0px_#1F2937] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col">
                <div className="px-4 py-3 border-b-2 border-neutral-800 bg-neutral-50">
                  <p className="text-sm font-bold text-neutral-800 truncate">{profile.full_name}</p>
                  <p className="text-xs font-mono text-neutral-500">{level.name}</p>
                </div>
                
                <Link to="/profile" className="px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-brutalistCyan hover:text-neutral-900 transition-colors flex items-center gap-2">
                  <User size={16} /> Profil
                </Link>
                <Link to="/settings" className="px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-brutalistYellow hover:text-neutral-900 transition-colors flex items-center gap-2">
                  <Menu size={16} /> Pengaturan
                </Link>
                
                <div className="border-t-2 border-neutral-800"></div>
                
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-danger hover:bg-danger hover:text-white transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} /> Keluar
                </button>
              </div>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 border-2 border-neutral-800 bg-white shadow-[2px_2px_0px_0px_#1F2937] active:shadow-none active:translate-y-0.5 active:translate-x-0.5"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-14 z-40 md:hidden">
          <div className="glass-card mx-4 mt-2 p-2 space-y-0.5">
            {/* User info */}
            <div className="flex items-center gap-2 px-3 py-2.5 mb-1 rounded-lg bg-neutral-50">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold">
                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  {profile.full_name}
                </p>
                <p className="text-xs text-neutral-500">
                  {level.name} · {profile.total_xp} XP
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
                    flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors duration-150
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

            <hr className="border-neutral-100 my-1.5" />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-danger-light transition-colors duration-150"
            >
              <LogOut size={18} />
              Keluar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
