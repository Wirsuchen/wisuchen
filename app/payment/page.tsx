'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PayPalCheckout } from '@/components/payment/paypal-checkout'
import { PageLayout } from '@/components/layout/page-layout'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTranslation } from '@/contexts/i18n-context'

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
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [isAuth, setIsAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[keyof typeof PLANS] | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [redirectPath, setRedirectPath] = useState('/payment')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRedirectPath(window.location.pathname + window.location.search)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/profile', { cache: 'no-store' })
        if (cancelled) return
        if (response.ok) {
          setIsAuth(true)
        } else {
          setNeedsLogin(true)
        }
      } catch {
        if (!cancelled) {
          setNeedsLogin(true)
        }
      } finally {
        if (!cancelled) {
        setIsLoading(false)
        }
      }
    }
    
    checkAuth()
    return () => {
      cancelled = true
    }
  }, [])

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

  if (needsLogin) {
    return (
      <PageLayout showBackButton={true} containerClassName="max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <CardTitle>{t('dashboard.loginRequiredTitle')}</CardTitle>
              <CardDescription>
                {t('payment.loginRequiredDescription', 'Sign in to purchase or manage subscriptions.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/login?redirect=${encodeURIComponent(redirectPath)}`}>
                  {t('dashboard.goToLogin')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout showBackButton={true} containerClassName="max-w-4xl">
      <PayPalCheckout selectedPlan={selectedPlan} />
    </PageLayout>
  )
}
