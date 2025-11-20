import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: list current user's applications
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ items: [] })

  const { data, error } = await supabase
    .from('applications')
    .select('*, offer:offers(*)')
    .eq('applicant_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ items: data })
}

// POST: create application { offer_id, notes? }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const offerId = body.offer_id as string
  const notes = (body.notes as string) || null
  if (!offerId) return NextResponse.json({ error: 'Missing offer_id' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('applications')
    .insert({ offer_id: offerId, applicant_id: profile.id, status: 'submitted', notes })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ application: data })
}

// PUT: update status/notes { id, status?, notes? }
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const id = body.id as string
  const status = (body.status as string) || undefined
  const notes = (body.notes as string) || undefined
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // RLS will enforce ownership or moderator rights
  const { error } = await supabase
    .from('applications')
    .update({ status, notes })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}













