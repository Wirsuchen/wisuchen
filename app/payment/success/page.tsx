import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageLayout } from '@/components/layout/page-layout'
import { CheckCircle, Receipt, ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'
import { PaymentSuccessContentClient } from './payment-success-client'

interface PaymentSuccessProps {
  searchParams: {
    order_id?: string
    payment_id?: string
    invoice_id?: string
    token?: string
  }
}

async function PaymentSuccessContent({ searchParams }: PaymentSuccessProps) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  let paymentData = null
  let error = null

  // Fetch payment details if we have an order_id or invoice_id
  if (searchParams.order_id || searchParams.invoice_id || searchParams.token) {
    try {
      const orderId = searchParams.order_id || searchParams.token
      const queryParam = orderId
        ? `order_id=${orderId}`
        : `invoice_id=${searchParams.invoice_id}`

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment/paypal?${queryParam}`, {
        headers: {
          'Cookie': `sb-access-token=${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        paymentData = data.payment
      }
    } catch (err) {
      console.error('Error fetching payment data:', err)
      error = 'Unable to load payment details'
    }
  }

  return (
    <PaymentSuccessContentClient
      paymentData={paymentData}
      error={error}
    />
  )
}

export default function PaymentSuccessPage({ searchParams }: PaymentSuccessProps) {
  return (
    <PageLayout showBackButton={true} containerClassName="max-w-4xl">
      <Suspense fallback={
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading payment details...</p>
            </CardContent>
          </Card>
        </div>
      }>
        <PaymentSuccessContent searchParams={searchParams} />
      </Suspense>
    </PageLayout>
  )
}
