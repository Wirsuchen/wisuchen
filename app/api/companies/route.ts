import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/companies - List companies
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('companies')
      .select('id, name, slug, logo_url, is_active')
      .eq('is_active', true)
      .order('name')
      .limit(limit)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: companies, error } = await query

    if (error) {
      console.error('Error fetching companies:', error)
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    return NextResponse.json({ companies: companies || [] })
  } catch (error) {
    console.error('Companies API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile for role check:', profileError)
    }

    // Check if user has permission to create companies
    const allowedRoles = ['supervisor', 'admin', 'moderator', 'lister', 'publisher', 'employer', 'job_seeker']
    if (profile && !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: `Your role (${profile.role}) does not have permission to create companies. Required roles: ${allowedRoles.join(', ')}`
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, website_url, logo_url, is_active } = body

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Generate slug if not provided
    const companySlug = slug || name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if company with same name already exists (case-insensitive)
    const trimmedName = name.trim()
    const { data: existingByName } = await supabase
      .from('companies')
      .select('id, name, slug')
      .ilike('name', trimmedName)
      .maybeSingle()

    if (existingByName) {
      return NextResponse.json({ 
        company: existingByName,
        message: 'Company with this name already exists'
      }, { status: 200 })
    }

    // Check if company with same slug already exists
    const { data: existingBySlug } = await supabase
      .from('companies')
      .select('id, name, slug')
      .eq('slug', companySlug)
      .maybeSingle()

    if (existingBySlug) {
      return NextResponse.json({ 
        company: existingBySlug,
        message: 'Company with this slug already exists'
      }, { status: 200 })
    }

    // Use the profile we already fetched (or fetch again if we don't have it)
    let profileForCreatedBy = profile
    if (!profileForCreatedBy) {
      const { data: fetchedProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      profileForCreatedBy = fetchedProfile
    }

    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name: trimmedName,
        slug: companySlug,
        description: description || null,
        website_url: website_url || null,
        logo_url: logo_url || null,
        is_active: is_active !== undefined ? is_active : true,
        created_by: profileForCreatedBy?.id || null,
      })
      .select('id, name, slug')
      .single()

    if (error) {
      console.error('Error creating company:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      
      // Provide more specific error messages
      if (error.code === '23505') { // Unique constraint violation
        // Check if it's a slug or name conflict
        if (error.message.includes('slug') || error.details?.includes('slug')) {
          // Try to find existing company by slug
          const { data: existingBySlug } = await supabase
            .from('companies')
            .select('id, name, slug')
            .eq('slug', companySlug)
            .maybeSingle()
          
          if (existingBySlug) {
            return NextResponse.json({ 
              company: existingBySlug,
              message: 'Company with this slug already exists'
            }, { status: 200 })
          }
        }
        return NextResponse.json({ 
          error: 'A company with this name or slug already exists',
          details: error.message || error.details || 'Unique constraint violation'
        }, { status: 409 })
      }
      
      // Handle other database errors
      if (error.code === '23502') { // Not null violation
        return NextResponse.json({ 
          error: 'Missing required field',
          details: error.message || 'A required field is missing'
        }, { status: 400 })
      }
      
      if (error.code === '23503') { // Foreign key violation
        return NextResponse.json({ 
          error: 'Invalid reference',
          details: error.message || 'Referenced record does not exist'
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to create company',
        details: error.message || error.details || 'Database error occurred',
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({ company }, { status: 201 })
  } catch (error: any) {
    console.error('Companies API error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred',
      type: error.name || 'UnknownError'
    }, { status: 500 })
  }
}

