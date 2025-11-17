import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase: any = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get limit from query params (default: 10, max: 50)
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    // Fetch user's job ads (base fields only)
    const { data: ads, error } = await supabase
      .from('offers')
      .select('id, title, status, type, created_at, expires_at, company_id')
      .eq('created_by', profile.id)
      .eq('type', 'job')
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user ads:', error)
      return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
    }

    // Get view and applicant counts for each ad
    const adsWithStats = await Promise.all(
      (ads || []).map(async (ad: any) => {
        // Get views count
        const { count: views } = await (supabase as any)
          .from('impressions')
          .select('*', { count: 'exact', head: true })
          .eq('offer_id', ad.id)

        // Get applicants count
        const { count: applicants } = await (supabase as any)
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('offer_id', ad.id)

        // Calculate "posted" time ago
        const createdDate = new Date(ad.created_at || new Date().toISOString())
        const now = new Date()
        const diffMs = now.getTime() - createdDate.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        
        let posted = ''
        if (diffDays === 0) {
          posted = 'Today'
        } else if (diffDays === 1) {
          posted = 'Yesterday'
        } else if (diffDays < 7) {
          posted = `${diffDays} days ago`
        } else if (diffDays < 30) {
          const weeks = Math.floor(diffDays / 7)
          posted = `${weeks} week${weeks > 1 ? 's' : ''} ago`
        } else {
          const months = Math.floor(diffDays / 30)
          posted = `${months} month${months > 1 ? 's' : ''} ago`
        }

        return {
          id: ad.id,
          title: ad.title,
          status: ad.status === 'active' ? 'Active' : 'Expired',
          views: views || 0,
          applicants: applicants || 0,
          posted,
          company: undefined,
          companyLogo: null,
          expires: ad.expires_at,
        }
      })
    )

    return NextResponse.json({ ads: adsWithStats })
  } catch (error) {
    console.error('User ads error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase: any = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id, action } = body || {}
    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })
    }

    if (action === 'refresh') {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('created_by', profile.id)
      if (error) {
        console.error('Refresh ad error:', error)
        return NextResponse.json({ error: 'Failed to refresh' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error) {
    console.error('User ads PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase: any = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id } = body || {}
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('offers')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('created_by', profile.id)

    if (error) {
      console.error('Archive ad error:', error)
      return NextResponse.json({ error: 'Failed to archive ad' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Ad archived successfully' })
  } catch (error) {
    console.error('User ads DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
