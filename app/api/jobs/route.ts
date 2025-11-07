import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { OfferInsert, OfferUpdate } from '@/lib/types/database'
import { API_CONFIG, CACHE_CONFIG } from '@/lib/config/api-keys'
import { searchActiveJobsDb } from '@/lib/api/active-jobs-db'
import { searchAdzunaJobs } from '@/lib/api/adzuna'
import { cacheWrap } from '@/lib/api/cache'

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
    const includeExternal = (searchParams.get('include_external') ?? 'true') === 'true'
    
    const offset = (page - 1) * limit

    // Create cache key based on all query parameters
    const cacheKey = `jobs:${page}:${limit}:${category || 'all'}:${location || 'all'}:${type || 'all'}:${remote || 'false'}:${search || 'all'}:${featured || 'all'}:${includeExternal}`
    console.log('🔑 [Jobs API] Cache key:', cacheKey)

    // Use cached response if available
    const cachedResponse = await cacheWrap(cacheKey, CACHE_CONFIG.jobs.ttl, async () => {

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

    // Get total count for pagination (DB only)
    const { count: totalCount } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('type', 'job')

    // Fetch external jobs from multiple sources (prioritized order)
    let externalJobs: any[] = []
    
    if (includeExternal) {
      const country = 'de' // Default to Germany for DACH region
      const remainingSlots = Math.max(0, 20 - (jobs?.length ?? 0))
      
      // 1. Active Jobs DB (newest ATS jobs - highest priority)
      if (API_CONFIG.rapidApi.enabled && remainingSlots > 0) {
        try {
          const activeJobsFilter = search || category || 'developer'
          const locationFilter = location ? `"${location}"` : '"Germany" OR "Austria" OR "Switzerland"'
          
          const activeJobs = await searchActiveJobsDb({
            limit: Math.min(10, remainingSlots), // Get up to 10 from Active Jobs DB
            offset: 0,
            title_filter: search ? `"${search}"` : undefined,
            location_filter: locationFilter,
            description_type: 'text',
            country: country as any,
          })
          
          externalJobs.push(...activeJobs)
          console.log(`[Jobs API] Fetched ${activeJobs.length} jobs from Active Jobs DB`)
        } catch (error) {
          console.error('[Jobs API] Active Jobs DB failed:', error)
          // Continue with other sources
        }
      }
      
      // 2. Adzuna (fallback/supplement)
      const adzunaSlots = Math.max(0, remainingSlots - externalJobs.length)
      if (API_CONFIG.adzuna.enabled && adzunaSlots > 0) {
        try {
          // Map location to postcode if a German postal code is detected
          const postcode = location && /^\d{5}$/.test(location) ? location : undefined
          const adzunaJobs = await searchAdzunaJobs({
            country: country as any,
            what: search ?? undefined,
            where: postcode ? undefined : location ?? undefined,
            postcode,
            radiusKm: 25,
            page: 1,
            resultsPerPage: adzunaSlots,
            remote: remote === 'true' ? true : false,
            language: 'de',
            currency: 'EUR',
            isTest: false,
          })
          
          externalJobs.push(...adzunaJobs)
          console.log(`[Jobs API] Fetched ${adzunaJobs.length} jobs from Adzuna`)
        } catch (error) {
          console.error('[Jobs API] Adzuna failed:', error)
          // Continue even if this source fails
        }
      }
    }

    // Merge with external (Active Jobs DB first, then Adzuna, then DB jobs)
    const combined = [...externalJobs, ...(jobs || [])]

    return {
      jobs: combined,
      pagination: {
        page,
        limit,
        total: (totalCount || 0) + (externalJobs?.length || 0),
        pages: Math.max(1, Math.ceil((totalCount || 0) / limit)),
      },
      sources: {
        database: jobs?.length || 0,
        activeJobsDb: externalJobs.filter(j => j.source?.includes('active-jobs')).length,
        adzuna: externalJobs.filter(j => j.source === 'adzuna').length,
      }
    }
    })

    console.log(`✅ [Jobs API] Successfully fetched ${cachedResponse.jobs.length} jobs`)

    return NextResponse.json({
      ...cachedResponse,
      cached: true,
      cacheTtl: `${CACHE_CONFIG.jobs.ttl} seconds (${Math.round(CACHE_CONFIG.jobs.ttl / 60)} minutes)`,
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
