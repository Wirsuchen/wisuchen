'use client'

import { LoginForm } from "@/components/auth/login-form"
import { PageLayout } from "@/components/layout/page-layout"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <PageLayout showBackButton={false} containerClassName="">
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  // If user exists, don't show login form (redirect is happening)
  if (user) {
    return null
  }

  return (
    <PageLayout showBackButton={false} containerClassName="">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </PageLayout>
  )
}
