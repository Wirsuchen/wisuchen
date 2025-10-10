import { RegisterForm } from "@/components/auth/register-form"
import { PageLayout } from "@/components/layout/page-layout"

export default function RegisterPage() {
  return (
    <PageLayout showBackButton={false} containerClassName="">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <RegisterForm />
      </div>
    </PageLayout>
  )
}
