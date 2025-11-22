import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!url || !serviceKey) throw new Error('Missing Supabase service env')
  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!me || !['supervisor', 'admin'].includes(me.role as string)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') || undefined

  let query = supabase.from('profiles').select('id, user_id, email, full_name, role, created_at, is_subscribed, plan').order('created_at', { ascending: false })
  if (role) query = query.eq('role', role as any)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ users: data })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!me || !['supervisor', 'admin'].includes(me.role as string)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { profile_id, role, is_subscribed, plan } = body
  if (!profile_id) return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 })

  const update: Record<string, any> = {}
  if (role) update.role = role
  if (typeof is_subscribed === 'boolean') update.is_subscribed = is_subscribed
  if (typeof plan === 'string' && plan.length > 0) update.plan = plan
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

  // Use service role client to bypass RLS for updates
  const serviceClient = getSupabaseServiceClient()
  const { error } = await serviceClient.from('profiles').update(update).eq('id', profile_id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}












