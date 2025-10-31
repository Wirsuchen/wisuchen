import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardMobileMenu } from "@/components/dashboard/mobile-menu"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>
        
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8">
            {/* Mobile Menu Button */}
            <div className="lg:hidden mb-6">
              <DashboardMobileMenu />
            </div>
            
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
