import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Save a job from external API to user's saved list
 * This endpoint creates the job offer in the database first, then saves it
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
      company,
      location,
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryPeriod,
      isRemote,
      skills,
      applicationUrl,
      source
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
      .eq('type', 'job')
      .single()

    if (existingOffer) {
      offerId = existingOffer.id
    } else {
      // Create the job offer in database
      const { data: newOffer, error: offerError } = await supabase
        .from('offers')
        .insert({
          title,
          slug,
          description: description || null,
          short_description: description?.substring(0, 500) || null,
          type: 'job',
          status: 'active',
          employment_type: employmentType || null,
          experience_level: experienceLevel || null,
          salary_min: salaryMin || null,
          salary_max: salaryMax || null,
          salary_currency: salaryCurrency || 'EUR',
          salary_period: salaryPeriod || 'yearly',
          location: location || null,
          is_remote: isRemote || false,
          skills: skills || null,
          application_url: applicationUrl || null,
          source: source || 'external',
          external_id: id,
          created_by: profile.id, // Set the user as creator
          featured: false,
          urgent: false,
          views_count: 0,
          applications_count: 0,
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (offerError) {
        console.error('Error creating job offer:', offerError)
        return NextResponse.json({ error: 'Failed to create job offer' }, { status: 500 })
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
      console.error('Error saving job offer:', saveError)
      return NextResponse.json({ error: 'Failed to save job offer' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Job saved successfully',
      offer_id: offerId 
    })
  } catch (error) {
    console.error('Save job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
