'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  Euro,
  Receipt,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface PaymentItem {
  name: string
  description?: string
  quantity: number
  unit_amount: string
  sku?: string
}

interface PaymentOrder {
  id: string
  status: string
  invoice_id: string
  invoice_number: string
  approval_url?: string
  order: any
}

interface PaymentStatus {
  payment: {
    id: string
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
    amount: number
    currency: string
    invoice: {
      id: string
      invoice_number: string
      status: string
      total_amount: number
      billing_name?: string
      billing_email?: string
    }
    paypal_order?: any
  }
}

interface SelectedPlan {
  id: string
  name: string
  description: string
  price: string
  features: string[]
}

interface PayPalCheckoutProps {
  selectedPlan?: SelectedPlan | null
}

export function PayPalCheckout({ selectedPlan }: PayPalCheckoutProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'approval' | 'completed' | 'failed'>('form')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const { toast } = useToast()

  // Initialize payment form based on selected plan
  const getInitialFormState = () => {
    if (selectedPlan) {
      return {
        amount: selectedPlan.price,
        currency: 'EUR',
        description: selectedPlan.name,
        items: [
          {
            name: selectedPlan.name,
            description: selectedPlan.description,
            quantity: 1,
            unit_amount: selectedPlan.price,
            sku: `PLAN_${selectedPlan.id.toUpperCase()}`
          }
        ] as PaymentItem[]
      }
    }
    return {
      amount: '29.99',
      currency: 'EUR',
      description: 'Premium Job Posting',
      items: [
        {
          name: 'Premium Job Posting',
          description: '30-day featured job listing',
          quantity: 1,
          unit_amount: '29.99',
          sku: 'JOB_PREMIUM_30D'
        }
      ] as PaymentItem[]
    }
  }

  // Payment form state
  const [paymentForm, setPaymentForm] = useState(getInitialFormState())

  // Update form when selectedPlan changes
  useEffect(() => {
    if (selectedPlan) {
      setPaymentForm({
        amount: selectedPlan.price,
        currency: 'EUR',
        description: selectedPlan.name,
        items: [
          {
            name: selectedPlan.name,
            description: selectedPlan.description,
            quantity: 1,
            unit_amount: selectedPlan.price,
            sku: `PLAN_${selectedPlan.id.toUpperCase()}`
          }
        ]
      })
    }
  }, [selectedPlan])

  const predefinedPackages = [
    {
      id: 'basic',
      name: 'Basic Job Posting',
      description: 'Standard job listing for 30 days',
      price: '19.99',
      features: ['30-day listing', 'Basic visibility', 'Email support']
    },
    {
      id: 'premium',
      name: 'Premium Job Posting',
      description: 'Featured job listing with priority placement',
      price: '29.99',
      features: ['30-day listing', 'Featured placement', 'Priority support', 'Company branding']
    },
    {
      id: 'urgent',
      name: 'Urgent Job Posting',
      description: 'Top placement with urgent badge',
      price: '49.99',
      features: ['30-day listing', 'Top placement', 'Urgent badge', 'Priority support', 'Analytics']
    },
    {
      id: 'company',
      name: 'Company Package',
      description: '5 job postings with company profile',
      price: '99.99',
      features: ['5 job postings', 'Company profile page', 'Advanced analytics', 'Dedicated support']
    }
  ]

  const handlePackageSelect = (packageId: string) => {
    const selectedPackage = predefinedPackages.find(p => p.id === packageId)
    if (selectedPackage) {
      setPaymentForm({
        amount: selectedPackage.price,
        currency: 'EUR',
        description: selectedPackage.name,
        items: [{
          name: selectedPackage.name,
          description: selectedPackage.description,
          quantity: 1,
          unit_amount: selectedPackage.price,
          sku: `JOB_${packageId.toUpperCase()}`
        }]
      })
    }
  }

  const createPayPalOrder = async () => {
    setIsLoading(true)
    setStep('processing')

    try {
      const response = await fetch('/api/payment/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: paymentForm.amount,
          currency: paymentForm.currency,
          description: paymentForm.description,
          items: paymentForm.items,
          return_url: `${window.location.origin}/payment/success`,
          cancel_url: `${window.location.origin}/payment/cancel`
        })
      })

      const data = await response.json()

      if (response.ok) {
        setPaymentOrder(data)
        
        if (data.approval_url) {
          setStep('approval')
          toast({
            title: 'Payment Order Created',
            description: 'Redirecting to PayPal for payment approval...'
          })
          
          // Redirect to PayPal
          window.open(data.approval_url, '_blank')
          
          // Start polling for payment status
          pollPaymentStatus(data.order_id)
        } else {
          throw new Error('No approval URL received')
        }
      } else {
        throw new Error(data.error || 'Failed to create payment order')
      }
    } catch (error) {
      console.error('Payment creation error:', error)
      setStep('failed')
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const pollPaymentStatus = async (orderId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payment/paypal?order_id=${orderId}`)
        const data = await response.json()

        if (response.ok) {
          setPaymentStatus(data)

          if (data.payment.status === 'completed') {
            clearInterval(pollInterval)
            setStep('completed')
            toast({
              title: 'Payment Completed',
              description: `Payment of €${(data.payment.amount / 100).toFixed(2)} was successful!`
            })
          } else if (data.payment.status === 'failed' || data.payment.status === 'cancelled') {
            clearInterval(pollInterval)
            setStep('failed')
            toast({
              title: 'Payment Failed',
              description: 'The payment was not completed successfully.',
              variant: 'destructive'
            })
          }
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 3000)

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000)
  }

  const capturePayment = async () => {
    if (!paymentOrder) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/payment/paypal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: paymentOrder.id
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStep('completed')
        setPaymentStatus({ payment: data })
        toast({
          title: 'Payment Captured',
          description: 'Your payment has been successfully processed!'
        })
      } else {
        throw new Error(data.error || 'Failed to capture payment')
      }
    } catch (error) {
      console.error('Payment capture error:', error)
      toast({
        title: 'Capture Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStep('form')
    setPaymentOrder(null)
    setPaymentStatus(null)
    setIsLoading(false)
  }

  const getStepIcon = (currentStep: string) => {
    switch (currentStep) {
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      case 'approval':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <CreditCard className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">PayPal Checkout</h2>
        <p className="text-muted-foreground">Secure payment processing with PayPal</p>
      </div>

      {/* Payment Steps Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {['form', 'processing', 'approval', 'completed'].map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step === stepName 
                ? 'border-blue-500 bg-blue-500 text-white' 
                : index < ['form', 'processing', 'approval', 'completed'].indexOf(step)
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-gray-300 text-gray-500'
            }`}>
              {step === stepName ? getStepIcon(step) : <span>{index + 1}</span>}
            </div>
            {index < 3 && (
              <div className={`w-12 h-0.5 ${
                index < ['form', 'processing', 'approval', 'completed'].indexOf(step)
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {step === 'form' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="w-5 h-5" />
              Select Payment Package
            </CardTitle>
            <CardDescription>
              Choose a job posting package or create a custom payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Predefined Packages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predefinedPackages.map((pkg) => (
                <Card 
                  key={pkg.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    paymentForm.items[0]?.sku === `JOB_${pkg.id.toUpperCase()}` 
                      ? 'ring-2 ring-blue-500' 
                      : ''
                  }`}
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{pkg.name}</h3>
                      <Badge variant="secondary">€{pkg.price}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                    <ul className="text-xs space-y-1">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Custom Payment Form */}
            <div className="space-y-4">
              <h3 className="font-medium">Custom Payment</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="1"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ 
                      ...prev, 
                      amount: e.target.value,
                      items: [{
                        ...prev.items[0],
                        unit_amount: e.target.value
                      }]
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={paymentForm.currency}
                    onValueChange={(value) => setPaymentForm(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm(prev => ({ 
                    ...prev, 
                    description: e.target.value,
                    items: [{
                      ...prev.items[0],
                      name: e.target.value
                    }]
                  }))}
                />
              </div>
            </div>

            {/* Payment Summary */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{paymentForm.description}</span>
                    <span>€{paymentForm.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (19%)</span>
                    <span>€{(parseFloat(paymentForm.amount) * 0.19).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>€{(parseFloat(paymentForm.amount) * 1.19).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={createPayPalOrder} 
              disabled={isLoading || !paymentForm.amount}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Order...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay with PayPal
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'processing' && (
        <Card>
          <CardContent className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-medium mb-2">Creating Payment Order</h3>
            <p className="text-muted-foreground">Please wait while we set up your payment...</p>
          </CardContent>
        </Card>
      )}

      {step === 'approval' && paymentOrder && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-medium mb-2">Waiting for Payment Approval</h3>
            <p className="text-muted-foreground mb-4">
              Complete your payment in the PayPal window that opened.
            </p>
            
            <div className="space-y-4">
              <Alert>
                <Receipt className="w-4 h-4" />
                <AlertDescription>
                  Invoice #{paymentOrder.invoice_number} has been created.
                  Complete the payment to activate your job posting.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={resetForm}>
                  Cancel Payment
                </Button>
                <Button onClick={() => window.open(paymentOrder.approval_url, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open PayPal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'completed' && paymentStatus && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium mb-2">Payment Completed!</h3>
            <p className="text-muted-foreground mb-4">
              Your payment has been successfully processed.
            </p>

            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Payment ID:</span>
                  <span className="font-mono">{paymentStatus.payment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span>{paymentStatus.payment.invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>€{(paymentStatus.payment.amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="default">Paid</Badge>
                </div>
              </div>
            </div>

            <Button onClick={resetForm} className="w-full">
              Make Another Payment
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'failed' && (
        <Card>
          <CardContent className="text-center py-8">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Payment Failed</h3>
            <p className="text-muted-foreground mb-4">
              There was an issue processing your payment. Please try again.
            </p>

            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                If you continue to experience issues, please contact our support team.
              </AlertDescription>
            </Alert>

            <Button onClick={resetForm} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
