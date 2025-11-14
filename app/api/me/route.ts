import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, email, full_name, role, is_subscribed, plan, avatar_url')
      .eq('user_id', user.id)
      .single()

    type ProfileRow = {
      id: string
      email?: string | null
      full_name?: string | null
      role?: string | null
      is_subscribed?: boolean | null
      plan?: string | null
      avatar_url?: string | null
    }

    const typedProfile = profile as ProfileRow | null

    if (profileError || !typedProfile) {
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: user.user_metadata?.role || 'user',
        is_subscribed: false,
        plan: 'free'
      })
    }

    return NextResponse.json({
      id: typedProfile.id,
      email: typedProfile.email || user.email,
      name: typedProfile.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role: typedProfile.role || user.user_metadata?.role || 'user',
      is_subscribed: !!typedProfile.is_subscribed,
      plan: typedProfile.plan || 'free',
      avatar_url: typedProfile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null
    })
  } catch (error) {
    console.error('GET /api/me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
