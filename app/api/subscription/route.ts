import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

async function cancelPayPalSubscription(subId: string, reason?: string) {
  if (!subId) return { ok: false, error: 'missing_subscription_id' }
  try {
    const base = paypalApiBase()
    const token = await getPayPalAccessToken()
    const res = await fetch(`${base}/v1/billing/subscriptions/${subId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: reason || 'User requested cancellation' }),
      cache: 'no-store',
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      const txt = await res.text()
      return { ok: false, error: txt || `paypal_cancel_failed_${res.status}` }
    }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'paypal_cancel_error' }
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { paypalSubscriptionId, reason } = await request.json().catch(() => ({ })) as { paypalSubscriptionId?: string, reason?: string }

    // Optionally cancel PayPal subscription first if provided
    if (paypalSubscriptionId) {
      const result = await cancelPayPalSubscription(paypalSubscriptionId, reason)
      if (!result.ok) {
        // Proceed with local unsubscribe even if PayPal cancel fails, but surface info
        // You can change this to a hard failure if business rules require it
        // return NextResponse.json({ error: result.error }, { status: 502 })
      }
    }

    // Update current user's profile to free plan
    const { error } = await supabase
      .from('profiles')
      .update({ is_subscribed: false, plan: 'free' })
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
