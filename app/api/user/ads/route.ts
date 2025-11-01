import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    // Fetch user's job ads
    const { data: ads, error } = await supabase
      .from('offers')
      .select(`
        id,
        title,
        status,
        type,
        created_at,
        expires_at,
        company_id,
        companies (
          name,
          logo_url
        )
      `)
      .eq('created_by', profile.id)
      .eq('type', 'job')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user ads:', error)
      return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
    }

    // Get view and applicant counts for each ad
    const adsWithStats = await Promise.all(
      (ads || []).map(async (ad) => {
        // Get views count
        const { count: views } = await supabase
          .from('impressions')
          .select('*', { count: 'exact', head: true })
          .eq('offer_id', ad.id)

        // Get applicants count
        const { count: applicants } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('offer_id', ad.id)

        // Calculate "posted" time ago
        const createdDate = new Date(ad.created_at)
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
          company: ad.companies?.name || 'Unknown',
          companyLogo: ad.companies?.logo_url || null,
        }
      })
    )

    return NextResponse.json({ ads: adsWithStats })
  } catch (error) {
    console.error('User ads error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
