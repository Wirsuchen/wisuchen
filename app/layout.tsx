import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

export const metadata: Metadata = {
  title: "WIRsuchen - Jobs & Deals Portal",
  description: "Find jobs, compare deals, and manage your career with WIRsuchen",
  generator: "WIRsuchen",
  icons: {
    icon: "/favicon.ico", // public folder ka path
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
