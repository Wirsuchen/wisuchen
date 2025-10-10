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

interface PaymentSuccessProps {
  searchParams: {
    order_id?: string
    payment_id?: string
    invoice_id?: string
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
  if (searchParams.order_id || searchParams.invoice_id) {
    try {
      const queryParam = searchParams.order_id 
        ? `order_id=${searchParams.order_id}` 
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground">
          Your payment has been processed successfully.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {paymentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Transaction completed on {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Payment ID</div>
                <div className="font-mono text-sm">{paymentData.id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant="default">
                  {paymentData.status === 'completed' ? 'Paid' : paymentData.status}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="font-semibold">
                  €{(paymentData.amount / 100).toFixed(2)} {paymentData.currency}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Invoice</div>
                <div className="font-mono text-sm">{paymentData.invoice?.invoice_number}</div>
              </div>
            </div>

            {paymentData.invoice && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Invoice Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing Name:</span>
                    <span>{paymentData.invoice.billing_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing Email:</span>
                    <span>{paymentData.invoice.billing_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Status:</span>
                    <Badge variant={paymentData.invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {paymentData.invoice.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">What's Next?</h3>
            <p className="text-muted-foreground">
              Your job posting is now active and will be visible to job seekers.
              You'll receive email notifications about applications.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/jobs">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  View Job Listings
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  Manage My Jobs
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Receipt className="w-4 h-4" />
        <AlertDescription>
          A receipt has been sent to your email address. You can also view your payment history in your dashboard.
        </AlertDescription>
      </Alert>
    </div>
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
