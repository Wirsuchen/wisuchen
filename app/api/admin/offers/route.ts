import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!me || !['supervisor', 'admin', 'moderator'].includes(me.role as string)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, action } = await request.json()
  if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })

  const updates: any = {}
  if (action === 'approve') {
    updates.status = 'active'
    updates.published_at = new Date().toISOString()
  } else if (action === 'reject') {
    updates.status = 'rejected'
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { error } = await supabase.from('offers').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}








