import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PayPalAPI } from '@/lib/services/payment/paypal'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { capture_id, amount, currency_code = 'EUR' } = body
    if (!capture_id) return NextResponse.json({ error: 'Missing capture_id' }, { status: 400 })

    const paypal = new PayPalAPI()
    const refund = await paypal.refundPayment(capture_id, amount ? { value: amount, currency_code } : undefined)

    return NextResponse.json({ success: true, refund })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Refund failed' }, { status: 500 })
  }
}












