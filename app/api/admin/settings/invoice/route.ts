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

  const { data: settings, error } = await supabase
    .from('system_settings')
    .select('*')
    .in('key', ['invoice_sender_details', 'invoice_payment_details', 'invoice_default_tax_rate'])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const settingsMap = settings.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value
    return acc
  }, {})

  return NextResponse.json(settingsMap)
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
  const updates = Object.entries(body).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString()
  }))

  const { error } = await supabase
    .from('system_settings')
    .upsert(updates)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
