import type { ReactNode } from 'react'
import Navbar from './Navbar'

interface PageContainerProps {
  children: ReactNode
  showNavbar?: boolean
  className?: string
}

/**
 * Page wrapper providing consistent layout:
 * - Glassmorphism navbar
 * - Gradient background
 * - Centered content with max-width
 * - Responsive padding
 */
export default function PageContainer({
  children,
  showNavbar = true,
  className = '',
}: PageContainerProps) {
  return (
    <div className={`min-h-screen relative bg-[#FAFAFA] flex flex-col ${className}`}>
      {/* Brutalist Noise Texture */}
      <div className="bg-noise"></div>
      
      {/* Decorative Blur (Optional, subtle in Light Mode) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brutalistPink/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brutalistCyan/5 blur-[100px] rounded-full pointer-events-none" />

      {showNavbar && <Navbar />}
      <main className="flex-1 relative z-10 w-full page-container">
        {children}
      </main>
    </div>
  )
}
