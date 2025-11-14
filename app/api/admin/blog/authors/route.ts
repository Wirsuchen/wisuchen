import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_ROLES = ['supervisor', 'admin', 'moderator'] as const
const AUTHOR_ROLES = ['supervisor', 'admin', 'moderator', 'blogger', 'editor'] as const

type Role = (typeof ADMIN_ROLES)[number] | (typeof AUTHOR_ROLES)[number] | string

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: me } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    const myRole = (me?.role || 'user') as Role
    if (!ADMIN_ROLES.includes(myRole as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: authors, error } = await supabase
      .from('profiles')
      .select('id, user_id, email, full_name, role, avatar_url')
      .in('role', AUTHOR_ROLES as unknown as string[])
      .order('full_name', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ authors: authors || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
