'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Receipt, ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/contexts/i18n-context'

interface PaymentSuccessContentClientProps {
  paymentData: any
  error: string | null
}

export function PaymentSuccessContentClient({ paymentData, error }: PaymentSuccessContentClientProps) {
  const { t } = useTranslation()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-green-600 mb-2">{t('payment.success.title')}</h1>
        <p className="text-muted-foreground">
          {t('payment.success.successMessage')}
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
              {t('payment.success.details.title')}
            </CardTitle>
            <CardDescription>
              {t('payment.success.description.completedOn', { date: new Date().toLocaleDateString() })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">{t('payment.success.details.paymentId')}</div>
                <div className="font-mono text-sm">{paymentData.id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('payment.success.details.status')}</div>
                <Badge variant="default">
                  {paymentData.status === 'completed' ? t('payment.success.status.paid') : paymentData.status}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('payment.success.details.amount')}</div>
                <div className="font-semibold">
                  €{(paymentData.amount / 100).toFixed(2)} {paymentData.currency}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('payment.success.details.invoice')}</div>
                <div className="font-mono text-sm">{paymentData.invoice?.invoice_number}</div>
              </div>
            </div>

            {paymentData.invoice && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">{t('payment.success.invoice.title')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('payment.success.invoice.billingName')}:</span>
                    <span>{paymentData.invoice.billing_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('payment.success.invoice.billingEmail')}:</span>
                    <span>{paymentData.invoice.billing_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('payment.success.invoice.invoiceStatus')}:</span>
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
            <h3 className="text-lg font-semibold">{t('payment.success.whatsNext.title')}</h3>
            <p className="text-muted-foreground">
              {t('payment.success.whatsNext.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/jobs">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {t('payment.success.actions.viewJobs')}
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  {t('payment.success.actions.manageJobs')}
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  {t('payment.success.actions.backHome')}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Receipt className="w-4 h-4" />
        <AlertDescription>
          {t('payment.success.receipt.message')}
        </AlertDescription>
      </Alert>
    </div>
  )
}
