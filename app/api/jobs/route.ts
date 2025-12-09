import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { OfferInsert, OfferUpdate } from '@/lib/types/database'
import { API_CONFIG, CACHE_CONFIG } from '@/lib/config/api-keys'
import { searchActiveJobsDb } from '@/lib/api/active-jobs-db'
import { searchAdzunaJobs } from '@/lib/api/adzuna'
import { cacheWrap } from '@/lib/api/cache'
import { withRateLimit } from '@/lib/utils/rate-limiter'
import { sanitizeSnippet } from '@/lib/utils/text'
import { getStoredTranslationsBatch, ContentType } from '@/lib/services/translation-service'

// Deduplicate external jobs by composite key: title + company + location (+ external_id when present)
function normalizeText(v: unknown): string {
  return typeof v === 'string' ? v.toLowerCase().trim() : ''
}

export const GET = withRateLimit(handler, { max: 100, windowMs: 60000 })

function dedupeExternalJobs(jobs: any[]): any[] {
  const seen = new Set<string>()
  const result: any[] = []

  for (const j of jobs) {
    const title = normalizeText(j?.title)
    const company = normalizeText(j?.company?.name ?? j?.company)
    const location = normalizeText(j?.location)
    const extId = normalizeText(j?.external_id)

    // Use a stable composite key; include external_id if available to tighten matches within same source
    const key = [title, company, location, extId].filter(Boolean).join('|')

    if (!seen.has(key)) {
      seen.add(key)
      result.push(j)
    }
  }

  return result
}

// GET /api/jobs - Fetch jobs with filtering and pagination
async function handler(request: NextRequest) {
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
    const lang = searchParams.get('lang') || 'en' // Language parameter for translations
    
    const offset = (page - 1) * limit

    // Create cache key based on all query parameters (including language)
    const cacheKey = `jobs:${page}:${limit}:${category || 'all'}:${location || 'all'}:${type || 'all'}:${remote || 'false'}:${search || 'all'}:${featured || 'all'}:${includeExternal}:${lang}`
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
    const dedupedExternal = dedupeExternalJobs(externalJobs)
    const combinedRaw: any[] = [...dedupedExternal, ...(jobs || [])]

    // Sanitize snippets to prevent merged words from stripped tags (e.g., "in it" -> "init")
    const combined = combinedRaw.map((j) => {
      const sd = j.short_description ?? j.description ?? ''
      return {
        ...j,
        short_description: sanitizeSnippet(typeof sd === 'string' ? sd : ''),
      }
    })

    // Apply translations if language is not English
    let translatedJobs = combined
    if (lang !== 'en' && combined.length > 0) {
      try {
        // Get content IDs for batch lookup
        const contentIds = combined.map(j => `job-${j.source || 'db'}-${j.id}`)
        const translations = await getStoredTranslationsBatch(contentIds, lang, 'job' as ContentType)
        
        // Apply translations, falling back to original if not found
        translatedJobs = combined.map(job => {
          const translation = translations.get(`job-${job.source || 'db'}-${job.id}`)
          if (translation) {
            return {
              ...job,
              title: translation.title || job.title,
              description: translation.description || job.description,
              short_description: translation.description ? sanitizeSnippet(translation.description) : job.short_description
            }
          }
          return job
        })
        
        console.log(`[Jobs API] Applied ${translations.size} translations for lang=${lang}`)
      } catch (error) {
        console.error('[Jobs API] Translation error:', error)
        // Continue with original content on error
      }
    }

    return {
      jobs: translatedJobs,
      pagination: {
        page,
        limit,
        total: (totalCount || 0) + (dedupedExternal?.length || 0),
        pages: Math.max(1, Math.ceil((totalCount || 0) / limit)),
      },
      sources: {
        database: jobs?.length || 0,
        activeJobsDb: dedupedExternal.filter(j => j.source?.includes('active-jobs')).length,
        adzuna: dedupedExternal.filter(j => j.source === 'adzuna').length,
      },
      language: lang
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

    // Get user profile to check permissions and plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, plan, is_subscribed')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user has permission to create jobs
    const allowedRoles = ['supervisor', 'admin', 'moderator', 'lister', 'publisher', 'employer', 'job_seeker']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check job limit for free users (job_seeker role with free plan)
    const isPaidUser = profile.is_subscribed || ['pro', 'professional', 'business'].includes(profile.plan || '')
    const isFreeUser = profile.role === 'job_seeker' && !isPaidUser
    
    if (isFreeUser) {
      // Count existing jobs created by this user
      const { count: jobCount } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', profile.id)
        .eq('type', 'job')
      
      const maxJobsForFreeUsers = 5
      if ((jobCount || 0) >= maxJobsForFreeUsers) {
        return NextResponse.json({ 
          error: `Free users can create up to ${maxJobsForFreeUsers} jobs. Please upgrade to create more jobs.`,
          limit: maxJobsForFreeUsers,
          current: jobCount || 0
        }, { status: 403 })
      }
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
