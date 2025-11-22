import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*), profiles(full_name, email)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({ invoice })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
  const { items, tax_rate, ...updateData } = body

  // Recalculate totals if items or tax_rate changed
  let subtotal = updateData.subtotal
  let tax_amount = updateData.tax_amount
  let total_amount = updateData.total_amount

  if (items) {
    subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0)
    const rate = tax_rate !== undefined ? tax_rate : updateData.tax_rate
    tax_amount = subtotal * (rate / 100)
    total_amount = subtotal + tax_amount
  } else if (tax_rate !== undefined) {
    // Only tax rate changed
    const rate = tax_rate
    tax_amount = subtotal * (rate / 100)
    total_amount = subtotal + tax_amount
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      ...updateData,
      tax_rate: tax_rate !== undefined ? tax_rate : updateData.tax_rate,
      subtotal,
      tax_amount,
      total_amount,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  if (items) {
    // Delete existing items
    await supabase.from('invoice_items').delete().eq('invoice_id', id)
    
    // Insert new items
    const invoiceItems = items.map((item: any) => ({
      invoice_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price
    }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
