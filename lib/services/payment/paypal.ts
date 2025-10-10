// PayPal Payment Integration
import { API_CONFIG } from '@/lib/config/api-keys'

export interface PayPalOrder {
  id: string
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED'
  intent: 'CAPTURE' | 'AUTHORIZE'
  purchase_units: Array<{
    reference_id?: string
    amount: {
      currency_code: string
      value: string
      breakdown?: {
        item_total?: { currency_code: string; value: string }
        shipping?: { currency_code: string; value: string }
        handling?: { currency_code: string; value: string }
        tax_total?: { currency_code: string; value: string }
        insurance?: { currency_code: string; value: string }
        shipping_discount?: { currency_code: string; value: string }
        discount?: { currency_code: string; value: string }
      }
    }
    payee?: {
      email_address?: string
      merchant_id?: string
    }
    description?: string
    custom_id?: string
    invoice_id?: string
    soft_descriptor?: string
    items?: Array<{
      name: string
      unit_amount: { currency_code: string; value: string }
      tax?: { currency_code: string; value: string }
      quantity: string
      description?: string
      sku?: string
      category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS' | 'DONATION'
    }>
    shipping?: {
      method?: string
      address?: {
        address_line_1?: string
        address_line_2?: string
        admin_area_2?: string
        admin_area_1?: string
        postal_code?: string
        country_code: string
      }
    }
  }>
  payer?: {
    name?: {
      given_name?: string
      surname?: string
    }
    email_address?: string
    payer_id?: string
    address?: {
      country_code?: string
    }
  }
  create_time?: string
  update_time?: string
  links?: Array<{
    href: string
    rel: string
    method?: string
  }>
}

export interface PayPalPayment {
  id: string
  amount: {
    total: string
    currency: string
  }
  description: string
  invoice_id?: string
  custom_id?: string
}

export class PayPalAPI {
  private baseUrl: string
  private clientId: string
  private clientSecret: string
  private accessToken?: string
  private tokenExpiry?: number

  constructor() {
    this.baseUrl = API_CONFIG.paypal.baseUrl
    this.clientId = API_CONFIG.paypal.clientId
    this.clientSecret = API_CONFIG.paypal.clientSecret
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      throw new Error(`PayPal auth error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // 1 minute buffer

    return this.accessToken
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'PayPal-Request-Id': `TalentPlus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`PayPal API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    return response.json()
  }

  async createOrder(orderData: {
    amount: string
    currency: string
    description: string
    invoice_id?: string
    custom_id?: string
    return_url: string
    cancel_url: string
    items?: Array<{
      name: string
      quantity: number
      unit_amount: string
      description?: string
      sku?: string
    }>
  }): Promise<PayPalOrder> {
    try {
      const order = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderData.custom_id || `order-${Date.now()}`,
          amount: {
            currency_code: orderData.currency,
            value: orderData.amount,
            breakdown: orderData.items ? {
              item_total: {
                currency_code: orderData.currency,
                value: orderData.amount
              }
            } : undefined
          },
          description: orderData.description,
          invoice_id: orderData.invoice_id,
          custom_id: orderData.custom_id,
          items: orderData.items?.map(item => ({
            name: item.name,
            unit_amount: {
              currency_code: orderData.currency,
              value: item.unit_amount
            },
            quantity: item.quantity.toString(),
            description: item.description,
            sku: item.sku,
            category: 'DIGITAL_GOODS' as const
          }))
        }],
        application_context: {
          return_url: orderData.return_url,
          cancel_url: orderData.cancel_url,
          brand_name: 'TalentPlus',
          locale: 'de-DE',
          landing_page: 'BILLING',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW'
        }
      }

      return await this.makeRequest('/v2/checkout/orders', {
        method: 'POST',
        body: JSON.stringify(order)
      })
    } catch (error) {
      console.error('PayPal create order error:', error)
      throw error
    }
  }

  async captureOrder(orderId: string): Promise<PayPalOrder> {
    try {
      return await this.makeRequest(`/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('PayPal capture order error:', error)
      throw error
    }
  }

  async getOrder(orderId: string): Promise<PayPalOrder> {
    try {
      return await this.makeRequest(`/v2/checkout/orders/${orderId}`)
    } catch (error) {
      console.error('PayPal get order error:', error)
      throw error
    }
  }

  async refundPayment(captureId: string, amount?: { value: string; currency_code: string }): Promise<any> {
    try {
      const refundData = amount ? { amount } : {}
      
      return await this.makeRequest(`/v2/payments/captures/${captureId}/refund`, {
        method: 'POST',
        body: JSON.stringify(refundData)
      })
    } catch (error) {
      console.error('PayPal refund error:', error)
      throw error
    }
  }

  async getPayment(paymentId: string): Promise<any> {
    try {
      return await this.makeRequest(`/v2/payments/captures/${paymentId}`)
    } catch (error) {
      console.error('PayPal get payment error:', error)
      throw error
    }
  }

  // Webhook verification
  async verifyWebhook(headers: Record<string, string>, body: string, webhookId: string): Promise<boolean> {
    try {
      const verificationData = {
        auth_algo: headers['paypal-auth-algo'],
        cert_id: headers['paypal-cert-id'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: JSON.parse(body)
      }

      const response = await this.makeRequest('/v1/notifications/verify-webhook-signature', {
        method: 'POST',
        body: JSON.stringify(verificationData)
      })

      return response.verification_status === 'SUCCESS'
    } catch (error) {
      console.error('PayPal webhook verification error:', error)
      return false
    }
  }

  // Subscription management (for recurring payments)
  async createSubscription(planId: string, subscriberInfo: {
    name: { given_name: string; surname: string }
    email_address: string
  }): Promise<any> {
    try {
      const subscription = {
        plan_id: planId,
        subscriber: subscriberInfo,
        application_context: {
          brand_name: 'TalentPlus',
          locale: 'de-DE',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`
        }
      }

      return await this.makeRequest('/v1/billing/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscription)
      })
    } catch (error) {
      console.error('PayPal create subscription error:', error)
      throw error
    }
  }

  async cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
    try {
      await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      })
    } catch (error) {
      console.error('PayPal cancel subscription error:', error)
      throw error
    }
  }
}

// Helper functions for payment processing
export function formatPayPalAmount(amount: number): string {
  return (amount / 100).toFixed(2) // Convert cents to euros
}

export function parsePayPalAmount(amount: string): number {
  return Math.round(parseFloat(amount) * 100) // Convert euros to cents
}

export function getPayPalApprovalUrl(order: PayPalOrder): string | null {
  const approvalLink = order.links?.find(link => link.rel === 'approve')
  return approvalLink?.href || null
}
