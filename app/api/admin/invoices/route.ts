import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  
  // Check admin/supervisor role
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = (page - 1) * limit

  const { data: invoices, count, error } = await supabase
    .from('invoices')
    .select('*, profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invoices, count })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  
  // Check admin/supervisor role
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { user_id, items, tax_rate, recipient_details } = body

  // Generate Invoice Number
  const date = new Date()
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const dateStr = `${month}/${day}/${year}` // MM/DD/YYYY format

  // Find latest invoice for this date to increment
  const { data: latestInvoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .ilike('invoice_number', `%/${dateStr}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let sequence = '001'
  if (latestInvoice) {
    const parts = latestInvoice.invoice_number.split('/')
    if (parts.length > 0) {
      const lastSeq = parseInt(parts[0])
      sequence = String(lastSeq + 1).padStart(3, '0')
    }
  }

  const invoice_number = `${sequence}/${dateStr}`

  // Calculate totals
  const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0)
  const tax_amount = subtotal * (tax_rate / 100)
  const total_amount = subtotal + tax_amount

  // Create Invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      created_by: session.user.id, // Use session user as creator
      invoice_number,
      status: 'draft',
      // issued_at is not in schema, using created_at (auto)
      amount: total_amount, // Map total_amount to amount
      tax_rate,
      tax_amount,
      client_name: recipient_details?.name || 'Unknown', // Map billing_name to client_name
      client_email: recipient_details?.email, // Map billing_email to client_email
      client_address: recipient_details?.address, // Map billing_address to client_address
      description: `Invoice ${invoice_number}`,
      currency: 'EUR', // Default currency
    })
    .select()
    .single()

  if (invoiceError) {
    return NextResponse.json({ error: invoiceError.message }, { status: 500 })
  }

  // Create Invoice Items
  const invoiceItems = items.map((item: any) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price
  }))

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(invoiceItems)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ invoice })
}
