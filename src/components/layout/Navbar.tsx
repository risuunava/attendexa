import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getXPLevel } from '../../lib/xpCalculator'
import {
  User,
  LogOut,
  Menu,
  Zap,
  Settings
} from 'lucide-react'

interface TopbarProps {
  setMobileOpen: (open: boolean) => void
}

export default function Navbar({ setMobileOpen }: TopbarProps) {
  const { profile, signOut } = useAuth()

  if (!profile) return null

  const level = getXPLevel(profile.total_xp)

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="glass-nav sticky top-0 z-40 px-4 sm:px-6 lg:px-8 border-b-4 border-neutral-900 bg-white">
      <div className="mx-auto flex items-center justify-between h-16">
        
        {/* Left Side: Mobile Menu Toggle & Logo (Mobile Only) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 border-2 border-neutral-900 bg-white shadow-[2px_2px_0px_0px_#1F2937] active:shadow-none active:translate-y-0.5 active:translate-x-0.5"
          >
            <Menu size={20} className="text-neutral-900" />
          </button>
          
          <Link to="/" className="flex items-center gap-2 md:hidden group">
            <div className="w-8 h-8 rounded-none border-2 border-neutral-900 bg-primary flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937]">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold font-serif text-neutral-900">
              Attend<span className="text-primary italic">exa</span>
            </span>
          </Link>
        </div>

        {/* Right Side: XP + Avatar Dropdown */}
        <div className="flex items-center gap-3 relative ml-auto">
          
          {/* XP Badge */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-none border-2 border-neutral-900 bg-brutalistYellow shadow-[2px_2px_0px_0px_#1F2937] text-sm font-bold text-neutral-900 hover:-translate-y-0.5 hover:-translate-x-0.5 transition-transform cursor-default">
            <Zap size={14} />
            <span className="font-tabular font-mono tracking-tighter">{profile.total_xp}</span>
            <span className="text-neutral-900 text-xs ml-0.5">XP</span>
          </div>

          {/* Desktop Dropdown Container */}
          <div className="flex items-center gap-3 group relative cursor-pointer py-2">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-none border-2 border-neutral-900 bg-brutalistCyan flex items-center justify-center text-neutral-900 text-sm font-bold shadow-[2px_2px_0px_0px_#1F2937] group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 transition-transform">
              {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            {/* Dropdown Menu */}
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border-4 border-neutral-900 shadow-[8px_8px_0px_0px_#1F2937] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col">
              <div className="px-4 py-3 border-b-4 border-neutral-900 bg-neutral-50">
                <p className="text-sm font-bold text-neutral-900 truncate">{profile.full_name}</p>
                <p className="text-xs font-mono text-neutral-600 mt-1">{level.name}</p>
              </div>
              
              <Link to="/profile" className="px-4 py-3 text-sm font-bold text-neutral-700 hover:bg-brutalistCyan hover:text-neutral-900 transition-colors flex items-center gap-3">
                <User size={16} /> Profil Saya
              </Link>
              <Link to="/settings" className="px-4 py-3 text-sm font-bold text-neutral-700 hover:bg-brutalistYellow hover:text-neutral-900 transition-colors flex items-center gap-3">
                <Settings size={16} /> Pengaturan
              </Link>
              
              <div className="border-t-4 border-neutral-900"></div>
              
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-3 text-sm font-bold text-danger hover:bg-brutalistPink hover:text-neutral-900 transition-colors flex items-center gap-3"
              >
                <LogOut size={16} /> Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
