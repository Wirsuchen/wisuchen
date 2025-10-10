// PayPal Payment API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PayPalAPI, formatPayPalAmount, parsePayPalAmount, getPayPalApprovalUrl } from '@/lib/services/payment/paypal'

// Create PayPal order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { 
      amount, 
      currency = 'EUR', 
      description, 
      invoice_id, 
      items = [],
      return_url,
      cancel_url 
    } = body

    if (!amount || !description) {
      return NextResponse.json({ 
        error: 'Missing required fields: amount, description' 
      }, { status: 400 })
    }

    // Create invoice record first
    const invoiceData = {
      user_id: profile.id,
      status: 'draft',
      subtotal: parsePayPalAmount(amount),
      tax_rate: 19.00, // German VAT
      tax_amount: Math.round(parsePayPalAmount(amount) * 0.19),
      total_amount: parsePayPalAmount(amount),
      currency: currency,
      billing_name: profile.full_name,
      billing_email: profile.email
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select('id, invoice_number')
      .single()

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Add invoice items
    if (items.length > 0) {
      const invoiceItems = items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.name,
        quantity: item.quantity || 1,
        unit_price: parsePayPalAmount(item.unit_amount),
        total_price: parsePayPalAmount(item.unit_amount) * (item.quantity || 1)
      }))

      await supabase
        .from('invoice_items')
        .insert(invoiceItems)
    }

    // Create PayPal order
    const paypalAPI = new PayPalAPI()
    const paypalOrder = await paypalAPI.createOrder({
      amount: formatPayPalAmount(invoiceData.total_amount),
      currency: currency,
      description: description,
      invoice_id: invoice.invoice_number,
      custom_id: invoice.id,
      return_url: return_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      items: items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity || 1,
        unit_amount: item.unit_amount,
        description: item.description,
        sku: item.sku
      }))
    })

    // Create payment record
    await supabase
      .from('payments')
      .insert({
        invoice_id: invoice.id,
        user_id: profile.id,
        amount: invoiceData.total_amount,
        currency: currency,
        status: 'pending',
        payment_method: 'paypal',
        payment_provider_id: paypalOrder.id,
        payment_provider_data: paypalOrder
      })

    // Update invoice with PayPal order ID
    await supabase
      .from('invoices')
      .update({
        status: 'sent',
        payment_reference: paypalOrder.id
      })
      .eq('id', invoice.id)

    const approvalUrl = getPayPalApprovalUrl(paypalOrder)

    return NextResponse.json({
      success: true,
      order_id: paypalOrder.id,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      approval_url: approvalUrl,
      order: paypalOrder
    })

  } catch (error) {
    console.error('PayPal order creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create PayPal order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Capture PayPal payment
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(*)
      `)
      .eq('payment_provider_id', order_id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Capture PayPal order
    const paypalAPI = new PayPalAPI()
    const capturedOrder = await paypalAPI.captureOrder(order_id)

    if (capturedOrder.status === 'COMPLETED') {
      // Update payment status
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          payment_provider_data: capturedOrder,
          processed_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      // Update invoice status
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', payment.invoice_id)

      return NextResponse.json({
        success: true,
        payment_id: payment.id,
        invoice_id: payment.invoice_id,
        status: 'completed',
        captured_order: capturedOrder
      })
    } else {
      return NextResponse.json({
        success: false,
        status: capturedOrder.status,
        order: capturedOrder
      }, { status: 400 })
    }

  } catch (error) {
    console.error('PayPal capture error:', error)
    return NextResponse.json({ 
      error: 'Failed to capture PayPal payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')
    const invoiceId = searchParams.get('invoice_id')

    if (!orderId && !invoiceId) {
      return NextResponse.json({ error: 'Missing order_id or invoice_id' }, { status: 400 })
    }

    let query = supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(*),
        user:profiles(id, email, full_name)
      `)

    if (orderId) {
      query = query.eq('payment_provider_id', orderId)
    } else if (invoiceId) {
      query = query.eq('invoice_id', invoiceId)
    }

    const { data: payment, error } = await query.single()

    if (error || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Get latest PayPal order status
    if (payment.payment_provider_id) {
      try {
        const paypalAPI = new PayPalAPI()
        const paypalOrder = await paypalAPI.getOrder(payment.payment_provider_id)
        
        // Update local status if different
        if (paypalOrder.status === 'COMPLETED' && payment.status !== 'completed') {
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              payment_provider_data: paypalOrder,
              processed_at: new Date().toISOString()
            })
            .eq('id', payment.id)

          await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString()
            })
            .eq('id', payment.invoice_id)
        }

        payment.paypal_order = paypalOrder
      } catch (paypalError) {
        console.error('Error fetching PayPal order:', paypalError)
      }
    }

    return NextResponse.json({ payment })

  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
