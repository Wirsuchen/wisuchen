import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { OfferInsert, OfferUpdate } from '@/lib/types/database'

// GET /api/jobs - Fetch jobs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const type = searchParams.get('type')
    const remote = searchParams.get('remote')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('offers')
      .select(`
        *,
        company:companies(*),
        category:categories(*)
      `)
      .eq('status', 'active')
      .eq('type', 'job')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)

    // Apply filters
    if (category) {
      query = query.eq('category_id', category)
    }
    
    if (location) {
      query = query.ilike('location', `%${location}%`)
    }
    
    if (type) {
      query = query.eq('employment_type', type)
    }
    
    if (remote === 'true') {
      query = query.eq('is_remote', true)
    }
    
    if (featured === 'true') {
      query = query.eq('featured', true)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,skills.cs.{${search}}`)
    }

    // Apply pagination and ordering
    query = query
      .order('featured', { ascending: false })
      .order('urgent', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: jobs, error, count } = await query

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('type', 'job')

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['supervisor', 'admin', 'moderator', 'lister', 'publisher', 'employer'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate required fields
    const { title, description, category_id, company_id } = body
    if (!title || !description || !category_id || !company_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, description, category_id, company_id' 
      }, { status: 400 })
    }

    // Create slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const jobData: OfferInsert = {
      ...body,
      slug: `${slug}-${Date.now()}`, // Ensure uniqueness
      type: 'job',
      created_by: profile.id,
      status: profile.role === 'moderator' || profile.role === 'admin' || profile.role === 'supervisor' 
        ? 'active' 
        : 'pending', // Auto-approve for moderators and above
      published_at: profile.role === 'moderator' || profile.role === 'admin' || profile.role === 'supervisor'
        ? new Date().toISOString()
        : null
    }

    const { data: job, error } = await supabase
      .from('offers')
      .insert(jobData)
      .select(`
        *,
        company:companies(*),
        category:categories(*)
      `)
      .single()

    if (error) {
      console.error('Error creating job:', error)
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
