'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PayPalCheckout } from '@/components/payment/paypal-checkout'
import { PageLayout } from '@/components/layout/page-layout'
import { Loader2 } from 'lucide-react'

const PLANS = {
  professional: {
    id: 'professional',
    name: 'Professional Plan',
    description: '30-day subscription with advanced features',
    price: '19.99',
    features: ['Advanced job filters', 'Priority alerts', 'Unlimited saves', 'Resume builder']
  },
  business: {
    id: 'business',
    name: 'Business Plan',
    description: '30-day subscription for companies',
    price: '49.99',
    features: ['Post unlimited jobs', 'Advanced analytics', 'Priority support', 'API access']
  }
}

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuth, setIsAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[keyof typeof PLANS] | null>(null)

  useEffect(() => {
    // Check authentication via Supabase
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          setIsAuth(true)
        } else {
          const currentPath = window.location.pathname + window.location.search
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
        }
      } catch (error) {
        const currentPath = window.location.pathname + window.location.search
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  useEffect(() => {
    const planId = searchParams.get('plan') as keyof typeof PLANS
    if (planId && PLANS[planId]) {
      setSelectedPlan(PLANS[planId])
    }
  }, [searchParams])

  if (isLoading) {
    return (
      <PageLayout showBackButton={true} containerClassName="max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </PageLayout>
    )
  }

  if (!isAuth) {
    return null
  }

  return (
    <PageLayout showBackButton={true} containerClassName="max-w-4xl">
      <PayPalCheckout selectedPlan={selectedPlan} />
    </PageLayout>
  )
}
