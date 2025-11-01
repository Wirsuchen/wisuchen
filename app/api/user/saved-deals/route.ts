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

    // Fetch user's saved deals with offer details
    const { data: savedDeals, error } = await supabase
      .from('saved_offers')
      .select(`
        id,
        created_at,
        offer_id,
        offers (
          id,
          title,
          price,
          original_price,
          type,
          discount_percentage,
          featured_image_url,
          redirect_url,
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
      .filter(item => item.offers) // Only include items where offer still exists
      .map((item) => {
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

        // Calculate discount if not provided
        const discount = offer.discount_percentage || 
          (offer.original_price && offer.price 
            ? Math.round(((offer.original_price - offer.price) / offer.original_price) * 100) 
            : 0)

        return {
          id: offer.id,
          title: offer.title,
          price: offer.price || 0,
          originalPrice: offer.original_price || offer.price || 0,
          discount: `${discount}%`,
          saved,
          store: offer.companies?.name || 'Unknown Store',
          storeLogo: offer.companies?.logo_url || null,
          image: offer.featured_image_url || null,
          url: offer.redirect_url || null,
        }
      })

    return NextResponse.json({ deals: dealsFormatted })
  } catch (error) {
    console.error('Saved deals error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
