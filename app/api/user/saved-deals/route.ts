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

    // Fetch user's saved deals with offer details
    const { data: savedDeals, error } = await (supabase as any)
      .from('saved_offers')
      .select(`
        id,
        created_at,
        offer_id,
        offers (
          id,
          title,
          price,
          type,
          featured_image_url,
          affiliate_url,
          company_id,
          companies (
            name,
            logo_url
          )
        )
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching saved deals:', error)
      return NextResponse.json({ error: 'Failed to fetch saved deals' }, { status: 500 })
    }

    // Format the deals data
    const dealsFormatted = (savedDeals || [])
      .filter((item: any) => item.offers) // Only include items where offer still exists
      .map((item: any) => {
        const offer = item.offers as any
        
        // Calculate "saved" time ago
        const savedDate = new Date(item.created_at)
        const now = new Date()
        const diffMs = now.getTime() - savedDate.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        
        let saved = ''
        if (diffDays === 0) {
          saved = 'Today'
        } else if (diffDays === 1) {
          saved = 'Yesterday'
        } else if (diffDays < 7) {
          saved = `${diffDays} days ago`
        } else if (diffDays < 30) {
          const weeks = Math.floor(diffDays / 7)
          saved = `${weeks} week${weeks > 1 ? 's' : ''} ago`
        } else {
          const months = Math.floor(diffDays / 30)
          saved = `${months} month${months > 1 ? 's' : ''} ago`
        }

        return {
          id: offer.id,
          title: offer.title,
          price: offer.price || 0,
          originalPrice: offer.price || 0,
          discount: `0%`,
          saved,
          store: offer.companies?.name || 'Unknown Store',
          storeLogo: offer.companies?.logo_url || null,
          image: offer.featured_image_url || null,
          url: offer.affiliate_url || null,
        }
      })

    return NextResponse.json({ deals: dealsFormatted })
  } catch (error) {
    console.error('Saved deals error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

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
    const { offerId } = body || {}
    if (!offerId) {
      return NextResponse.json({ error: 'Missing offerId' }, { status: 400 })
    }

    const { error } = await (supabase as any)
      .from('saved_offers')
      .delete()
      .eq('user_id', profile.id)
      .eq('offer_id', offerId)

    if (error) {
      console.error('Remove saved deal error:', error)
      return NextResponse.json({ error: 'Failed to remove saved deal' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Saved deals DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
