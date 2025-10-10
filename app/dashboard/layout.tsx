import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="flex gap-6">
              <DashboardSidebar />
              <div className="flex-1 min-w-0">
                {children}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
