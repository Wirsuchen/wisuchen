import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!me || !['supervisor', 'admin'].includes(me.role as string)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') || undefined

  let query = supabase.from('profiles').select('id, user_id, email, full_name, role, created_at').order('created_at', { ascending: false })
  if (role) query = query.eq('role', role)

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
  const { profile_id, role } = body
  if (!profile_id || !role) return NextResponse.json({ error: 'Missing profile_id or role' }, { status: 400 })

  const { error } = await supabase.from('profiles').update({ role }).eq('id', profile_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}








