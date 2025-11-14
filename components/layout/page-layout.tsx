"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BackButton } from "@/components/ui/back-button"

interface PageLayoutProps {
  children: React.ReactNode
  showBackButton?: boolean
  mainClassName?: string
  containerClassName?: string
}

export function PageLayout({
  children,
  showBackButton = true,
  mainClassName = "",
  containerClassName = ""
}: PageLayoutProps) {
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  return (
    <div className="min-h-screen">
      <Header />

      <main className={`pt-28 md:pt-32 lg:pt-36 ${mainClassName}`}>
        {/* Back Button - conditionally shown */}
        {showBackButton && !isHomePage && (
          <div className="mb-6">
            <BackButton />
          </div>
        )}

        {/* Page Content */}
        <div className={`container mx-auto px-4 sm:px-6 py-8 ${containerClassName}`}>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  )
}
