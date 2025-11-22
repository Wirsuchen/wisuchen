import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Save a deal from external API to user's saved list
 * This endpoint creates the offer in the database first, then saves it
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { 
      id, 
      title, 
      description, 
      currentPrice, 
      originalPrice,
      image,
      url,
      store,
      category 
    } = body

    if (!id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate a slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100) + '-' + Date.now()

    // Check if offer already exists
    let offerId = id
    const { data: existingOffer } = await supabase
      .from('offers')
      .select('id')
      .eq('external_id', id)
      .eq('type', 'affiliate')
      .single()

    if (existingOffer) {
      offerId = existingOffer.id
    } else {
      // Create the offer in database
      const { data: newOffer, error: offerError } = await supabase
        .from('offers')
        .insert({
          title,
          slug,
          description: description || null,
          short_description: description?.substring(0, 500) || null,
          type: 'affiliate',
          status: 'active',
          price: currentPrice || 0,
          affiliate_url: url,
          featured_image_url: image || null,
          source: 'rapidapi',
          external_id: id,
          featured: false,
          urgent: false,
          views_count: 0,
          clicks_count: 0,
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (offerError) {
        console.error('Error creating offer:', offerError)
        return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
      }

      offerId = newOffer.id
    }

    // Check if already saved
    const { data: existingSave } = await (supabase as any)
      .from('saved_offers')
      .select('id')
      .eq('user_id', profile.id)
      .eq('offer_id', offerId)
      .single()

    if (existingSave) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already saved',
        offer_id: offerId 
      })
    }

    // Save the offer to user's saved list
    const { error: saveError } = await (supabase as any)
      .from('saved_offers')
      .insert({ 
        user_id: profile.id, 
        offer_id: offerId 
      })

    if (saveError) {
      console.error('Error saving offer:', saveError)
      return NextResponse.json({ error: 'Failed to save offer' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Deal saved successfully',
      offer_id: offerId 
    })
  } catch (error) {
    console.error('Save deal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
