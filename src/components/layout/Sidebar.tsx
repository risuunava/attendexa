import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  History,
  Trophy,
  FileText,
  User,
  Zap,
  MapPin,
  Users,
  BarChart3,
  CalendarCheck,
  X
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

interface SidebarProps {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const { profile } = useAuth()
  const location = useLocation()

  if (!profile) return null

  const navItems =
    profile.role === 'admin'
      ? adminNav
      : profile.role === 'boss'
      ? bossNav
      : employeeNav

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#FAFAFA] border-r-4 border-neutral-900 
          flex flex-col transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brutalist Noise Texture inside sidebar */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b-4 border-neutral-900 bg-white relative z-10">
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 rounded-none border-2 border-neutral-900 bg-primary flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937] transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold font-serif text-neutral-900">
              Attend<span className="text-primary italic">exa</span>
            </span>
          </Link>
          
          {/* Close button for mobile */}
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 border-2 border-neutral-900 bg-white hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 relative z-10">
          <p className="text-xs font-bold text-neutral-500 mb-4 px-2 uppercase tracking-widest">
            Menu Utama
          </p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-wide
                  transition-all duration-150 border-2
                  ${
                    isActive
                      ? 'text-neutral-900 bg-brutalistYellow border-neutral-900 shadow-[4px_4px_0px_0px_#1F2937]'
                      : 'text-neutral-600 border-transparent hover:text-neutral-900 hover:border-neutral-900 hover:bg-white hover:shadow-[4px_4px_0px_0px_#1F2937] hover:-translate-y-0.5 hover:-translate-x-0.5'
                  }
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Footer Area in Sidebar */}
        <div className="p-4 border-t-4 border-neutral-900 bg-white relative z-10">
          <div className="p-3 border-2 border-neutral-900 bg-brutalistPink text-neutral-900 shadow-[2px_2px_0px_0px_#1F2937]">
            <p className="text-xs font-bold">Butuh Bantuan?</p>
            <p className="text-xs mt-1 font-medium">Hubungi HR Department</p>
          </div>
        </div>
      </aside>
    </>
  )
}
