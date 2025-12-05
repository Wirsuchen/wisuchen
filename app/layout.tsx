import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { I18nProvider } from "@/contexts/i18n-context"
import { DynamicTranslationProvider } from "@/contexts/dynamic-translation-context"
import { CacheInitializer } from "@/components/cache-initializer"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "WIRsuchen - Jobs & Deals Portal",
  description: "Find jobs, compare deals, and manage your career with WIRsuchen",
  generator: "WIRsuchen",
  openGraph: {
    title: 'WIRsuchen - Jobs & Deals Portal',
    description: 'Find jobs, compare deals, and manage your career with WIRsuchen',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'WIRsuchen',
    images: [
      { url: '/logo.png', width: 1200, height: 630, alt: 'WIRsuchen' },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WIRsuchen - Jobs & Deals Portal',
    description: 'Find jobs, compare deals, and manage your career with WIRsuchen',
    images: ['/logo.png'],
  },
  icons: {
    icon: "/favicon.ico", // public folder ka path
  },
  other: {
    google: "notranslate",
  },
}

import { cookies } from 'next/headers'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'

  return (
    <html lang={locale} className={`${geist.variable} antialiased notranslate`} translate="no" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <CacheInitializer />
        <I18nProvider>
          <DynamicTranslationProvider>
            <AuthProvider>
              <Suspense fallback={null}>
                {children}
              </Suspense>
            </AuthProvider>
          </DynamicTranslationProvider>
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  )
}
