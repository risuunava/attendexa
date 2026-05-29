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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-neutral-50">
      {showNavbar && <Navbar />}
      <main className={`page-container ${className}`}>{children}</main>
    </div>
  )
}
