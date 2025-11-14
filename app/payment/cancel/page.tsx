import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageLayout } from '@/components/layout/page-layout'
import { XCircle, ArrowLeft, CreditCard, Home } from 'lucide-react'
import Link from 'next/link'

export default async function PaymentCancelPage() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  return (
    <PageLayout showBackButton={true} containerClassName="max-w-4xl">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-red-600 mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground">
            Your payment was cancelled. No charges were made to your account.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What happened?</CardTitle>
            <CardDescription>
              You cancelled the payment process before it was completed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Don't worry - no payment was processed and no charges were made to your account.
                You can try again anytime or contact support if you experienced any issues.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium">Common reasons for payment cancellation:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Clicked the "Cancel" button in PayPal</li>
                <li>• Closed the PayPal window before completing payment</li>
                <li>• Network connection issues during payment</li>
                <li>• Changed your mind about the purchase</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">What would you like to do?</h3>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/payment">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Try Payment Again
                  </Link>
                </Button>
                
                <Button variant="outline" asChild>
                  <Link href="/jobs">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Browse Jobs
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

        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p>If you're experiencing issues with payments, here are some things you can try:</p>
              <ul className="space-y-1 ml-4 text-muted-foreground">
                <li>• Make sure you have sufficient funds in your PayPal account</li>
                <li>• Check that your payment method is valid and not expired</li>
                <li>• Try using a different browser or device</li>
                <li>• Disable browser extensions that might interfere with payments</li>
                <li>• Contact our support team if the problem persists</li>
              </ul>
              
              <div className="pt-3 border-t">
                <p className="font-medium">Still having trouble?</p>
                <p className="text-muted-foreground">
                  Contact our support team at{' '}
                  <a href="mailto:support@wirsuchen.com" className="text-primary hover:underline">
                    support@wirsuchen.com
                  </a>
                  {' '}or call us at +49 (0) 30 12345678
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
