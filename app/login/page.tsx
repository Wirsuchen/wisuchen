import { LoginForm } from "@/components/auth/login-form"
import { PageLayout } from "@/components/layout/page-layout"

export default function LoginPage() {
  return (
    <PageLayout showBackButton={false} containerClassName="">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </PageLayout>
  )
}
