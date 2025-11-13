import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

function paypalApiBase() {
  return process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  const base = paypalApiBase()
  if (!clientId || !secret) throw new Error('Missing PayPal credentials')
  const basic = Buffer.from(`${clientId}:${secret}`).toString('base64')
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error('PayPal token request failed')
  const data = await res.json()
  return data.access_token as string
}

async function verifyWebhookSignature(headers: Headers, event: any) {
  const base = paypalApiBase()
  const token = await getPayPalAccessToken()
  const transmissionId = headers.get('paypal-transmission-id') || ''
  const transmissionTime = headers.get('paypal-transmission-time') || ''
  const certUrl = headers.get('paypal-cert-url') || ''
  const authAlgo = headers.get('paypal-auth-algo') || ''
  const transmissionSig = headers.get('paypal-transmission-sig') || ''
  const webhookId = process.env.PAYPAL_WEBHOOK_ID || ''
  if (!webhookId) throw new Error('Missing PAYPAL_WEBHOOK_ID')

  const res = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: webhookId,
      webhook_event: event,
    }),
    cache: 'no-store',
    next: { revalidate: 0 },
  })
  if (!res.ok) return false
  const data = await res.json()
  return data.verification_status === 'SUCCESS'
}

function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!url || !serviceKey) throw new Error('Missing Supabase service env')
  return createSupabaseClient(url, serviceKey)
}

async function fetchOrderPayerEmail(orderId: string) {
  if (!orderId) return null
  const base = paypalApiBase()
  const token = await getPayPalAccessToken()
  const res = await fetch(`${base}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    next: { revalidate: 0 },
  })
  if (!res.ok) return null
  const order = await res.json()
  return order?.payer?.email_address || null
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    const event = JSON.parse(bodyText || '{}')

    const valid = await verifyWebhookSignature(req.headers, event)
    if (!valid) return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 400 })

    const eventType = event?.event_type as string | undefined
    if (!eventType) return NextResponse.json({ ok: true })

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED') {
      const resource = event?.resource || {}
      let amountValue: string | undefined
      let currency: string | undefined
      let paymentRef: string | undefined
      let paidAt: string | undefined
      let orderId: string | undefined

      if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
        amountValue = resource?.amount?.value
        currency = resource?.amount?.currency_code
        paymentRef = resource?.id
        paidAt = resource?.create_time || resource?.update_time
        orderId = resource?.supplementary_data?.related_ids?.order_id
      } else if (eventType === 'CHECKOUT.ORDER.APPROVED') {
        const unit = Array.isArray(resource?.purchase_units) ? resource.purchase_units[0] : undefined
        amountValue = unit?.amount?.value
        currency = unit?.amount?.currency_code
        paymentRef = resource?.id
        paidAt = resource?.create_time || resource?.update_time
        orderId = resource?.id
      }

      const payerEmail = event?.resource?.payer?.email_address || (orderId ? await fetchOrderPayerEmail(orderId) : null)
      const total = amountValue ? parseFloat(amountValue) : undefined
      if (!total || !currency) return NextResponse.json({ ok: true })

      const supabase = getSupabaseServiceClient()
      let profileId: string | null = null
      if (payerEmail) {
        const { data: profile } = await supabase.from('profiles').select('id').eq('email', payerEmail).maybeSingle()
        profileId = profile?.id || null
      }

      if (!profileId) return NextResponse.json({ ok: true })

      const subtotal = total
      const taxAmount = 0
      const { error } = await supabase.from('invoices').insert({
        user_id: profileId,
        status: 'paid',
        subtotal,
        tax_rate: 0,
        tax_amount: taxAmount,
        total_amount: total,
        currency,
        billing_email: payerEmail,
        payment_method: 'paypal',
        payment_reference: paymentRef,
        paid_at: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
      })
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 })
  }
}
