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

    const body = await request.json()
    const { name, slug, description, website_url, logo_url, is_active } = body

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Generate slug if not provided
    const companySlug = slug || name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if company with same slug already exists
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', companySlug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ 
        company: existing,
        message: 'Company already exists'
      })
    }

    // Get user profile for created_by
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name,
        slug: companySlug,
        description: description || null,
        website_url: website_url || null,
        logo_url: logo_url || null,
        is_active: is_active !== undefined ? is_active : true,
        created_by: profile?.id || null,
      })
      .select('id, name, slug')
      .single()

    if (error) {
      console.error('Error creating company:', error)
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }

    return NextResponse.json({ company }, { status: 201 })
  } catch (error) {
    console.error('Companies API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

