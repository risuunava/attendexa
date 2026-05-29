import { useState, useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface PageContainerProps {
  children: ReactNode
  showNavbar?: boolean
  className?: string
}

/**
 * Page wrapper providing consistent layout:
 * - Left Sidebar (fixed on desktop, drawer on mobile)
 * - Top Navbar (for XP and Profile)
 * - Brutalist aesthetics
 */
export default function PageContainer({
  children,
  showNavbar = true,
  className = '',
}: PageContainerProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA]">
      {/* Decorative Blurs (Subtle) */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brutalistPink/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-brutalistCyan/5 blur-[100px] rounded-full pointer-events-none" />

      {showNavbar && (
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Brutalist Noise Texture */}
        <div className="absolute inset-0 bg-noise pointer-events-none opacity-50"></div>
        
        {showNavbar && <Navbar setMobileOpen={setMobileOpen} />}
        
        <main className={`flex-1 overflow-y-auto page-container relative z-10 ${className}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
