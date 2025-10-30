// RapidAPI Job Services Integration
import { API_CONFIG } from '@/lib/config/api-keys'

export interface RapidAPIJob {
  id: string
  title: string
  company: string
  location: string
  description: string
  salary?: string
  employment_type?: string
  posted_date?: string
  apply_url?: string
  skills?: string[]
  experience_level?: string
}

export class RapidAPIService {
  private apiKey: string
  private baseHeaders: Record<string, string>

  constructor() {
    this.apiKey = API_CONFIG.rapidApi.key
    this.baseHeaders = {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': '',
      'Content-Type': 'application/json'
    }
  }

  private async makeRequest(host: string, endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const url = new URL(`https://${host}/${endpoint}`)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString())
      }
    })

    console.log('🔵 [RapidAPI] Making request:', {
      host,
      endpoint,
      fullUrl: url.toString(),
      params,
      apiKey: this.apiKey ? '✓ Present' : '✗ Missing'
    })

    const headers = {
      ...this.baseHeaders,
      'X-RapidAPI-Host': host
    }

    console.log('🔵 [RapidAPI] Request headers:', headers)

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers
      })

      console.log('🔵 [RapidAPI] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [RapidAPI] Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`RapidAPI error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ [RapidAPI] Success:', {
        host,
        dataKeys: Object.keys(data),
        dataType: typeof data,
        hasJobs: !!(data.jobs || data.data),
        jobCount: (data.jobs || data.data || []).length
      })

      return data
    } catch (error: any) {
      console.error('❌ [RapidAPI] Request failed:', {
        host,
        endpoint,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  // Employment Agency API
  async searchEmploymentAgencyJobs(params: {
    query?: string
    location?: string
    page?: number
    limit?: number
  }): Promise<RapidAPIJob[]> {
    try {
      const data = await this.makeRequest(
        'employment-agency-api.p.rapidapi.com',
        'jobs/search',
        params
      )
      return data.jobs || []
    } catch (error) {
      console.error('Employment Agency API error:', error)
      throw error
    }
  }

  // Glassdoor Real-Time API
  async searchGlassdoorJobs(params: {
    query?: string
    location?: string
    page?: number
  }): Promise<RapidAPIJob[]> {
    try {
      const data = await this.makeRequest(
        'glassdoor-real-time-api.p.rapidapi.com',
        'jobs',
        params
      )
      return data.data || []
    } catch (error) {
      console.error('Glassdoor API error:', error)
      throw error
    }
  }

  // Upwork Jobs API
  async searchUpworkJobs(params: {
    q?: string
    skills?: string
    budget_min?: number
    budget_max?: number
    page?: number
  }): Promise<RapidAPIJob[]> {
    try {
      const data = await this.makeRequest(
        'upwork-jobs-api.p.rapidapi.com',
        'jobs',
        params
      )
      return data.jobs || []
    } catch (error) {
      console.error('Upwork API error:', error)
      throw error
    }
  }

  // Active Jobs DB API
  async searchActiveJobs(params: {
    query?: string
    location?: string
    company?: string
    employment_type?: string
    page?: number
  }): Promise<RapidAPIJob[]> {
    try {
      const data = await this.makeRequest(
        'active-jobs-db-api.p.rapidapi.com',
        'jobs',
        params
      )
      return data.results || []
    } catch (error) {
      console.error('Active Jobs DB API error:', error)
      throw error
    }
  }

  // Job Postings API
  async searchJobPostings(params: {
    keywords?: string
    location?: string
    date_posted?: string
    employment_type?: string
    page?: number
  }): Promise<RapidAPIJob[]> {
    try {
      const data = await this.makeRequest(
        'job-postings-api.p.rapidapi.com',
        'search',
        params
      )
      return data.jobs || []
    } catch (error) {
      console.error('Job Postings API error:', error)
      throw error
    }
  }

  // Y Combinator Jobs API
  async searchYCombinatorJobs(params: {
    role?: string
    location?: string
    experience?: string
    page?: number
  }): Promise<RapidAPIJob[]> {
    try {
      const data = await this.makeRequest(
        'free-y-combinator-jobs-api.p.rapidapi.com',
        'jobs',
        params
      )
      return data.jobs || []
    } catch (error) {
      console.error('Y Combinator API error:', error)
      throw error
    }
  }

  // Freelancer API
  async searchFreelancerJobs(params: {
    query?: string
    skills?: string[]
    budget_min?: number
    budget_max?: number
    project_type?: string
    page?: number
  }): Promise<RapidAPIJob[]> {
    try {
      const data = await this.makeRequest(
        'freelancer-api.p.rapidapi.com',
        'projects',
        {
          ...params,
          skills: params.skills?.join(',')
        }
      )
      return data.projects || []
    } catch (error) {
      console.error('Freelancer API error:', error)
      throw error
    }
  }

  // Job Search API - Latest jobs from last 7 days (hourly refresh)
  // This is the PRIMARY source for most recent job postings
  async searchJobSearchAPI(params: {
    keyword: string
    location?: string
    page?: number
    limit?: number
    category?: string
  }): Promise<RapidAPIJob[]> {
    console.log('🔥 [Job Search API] Starting search with params:', params)
    
    try {
      const requestParams = {
        keyword: params.keyword || 'developer',
        location: params.location,
        page: params.page || 1,
        limit: Math.min(params.limit || 20, 50),
        category: params.category
      }
      
      console.log('🔥 [Job Search API] Request params:', requestParams)
      
      const data = await this.makeRequest(
        'job-search-api2.p.rapidapi.com',
        'jobs',
        requestParams
      )
      
      console.log('🔥 [Job Search API] Raw response:', {
        keys: Object.keys(data),
        type: typeof data,
        sample: JSON.stringify(data).substring(0, 200)
      })
      
      // Transform response to our format
      const jobs = data.jobs || data.data || []
      console.log('🔥 [Job Search API] Found jobs array:', {
        count: jobs.length,
        firstJob: jobs[0] ? Object.keys(jobs[0]) : 'none'
      })
      
      const transformed = jobs.map((job: any) => {
        const result = {
          id: job.id || job.job_id || `job-search-${Date.now()}-${Math.random()}`,
          title: job.title || job.job_title || '',
          company: job.company || job.company_name || job.employer || 'Not specified',
          location: job.location || job.job_location || 'Remote',
          description: job.description || job.job_description || '',
          salary: job.salary || job.salary_range || undefined,
          employment_type: job.employment_type || job.job_type || undefined,
          posted_date: job.posted_date || job.posting_date || job.date_posted || new Date().toISOString(),
          apply_url: job.apply_url || job.application_url || job.url || undefined,
          skills: job.skills || job.required_skills || [],
          experience_level: job.experience_level || job.seniority_level || undefined
        }
        return result
      })
      
      console.log('✅ [Job Search API] Transformed jobs:', transformed.length)
      return transformed
    } catch (error: any) {
      console.error('❌ [Job Search API] Error:', {
        message: error.message,
        stack: error.stack
      })
      return [] // Return empty array instead of throwing to prevent cascade failure
    }
  }

  // JSearch API - Google for Jobs aggregator (most comprehensive)
  // Aggregates from LinkedIn, Indeed, Glassdoor, ZipRecruiter, etc.
  async searchJSearchAPI(params: {
    query: string
    location?: string
    date_posted?: 'all' | 'today' | '3days' | 'week' | 'month'
    page?: number
    num_pages?: number
    employment_types?: string
  }): Promise<RapidAPIJob[]> {
    console.log('⚡ [JSearch API] Starting search with params:', params)
    
    try {
      const requestParams = {
        query: params.query || 'developer',
        location: params.location,
        date_posted: params.date_posted || 'week', // Default to last week for freshness
        page: params.page || 1,
        num_pages: Math.min(params.num_pages || 1, 5),
        employment_types: params.employment_types
      }
      
      console.log('⚡ [JSearch API] Request params:', requestParams)
      
      const data = await this.makeRequest(
        'jsearch.p.rapidapi.com',
        'search',
        requestParams
      )
      
      console.log('⚡ [JSearch API] Raw response:', {
        keys: Object.keys(data),
        type: typeof data,
        sample: JSON.stringify(data).substring(0, 200)
      })
      
      // Transform response to our format
      const jobs = data.data || []
      console.log('⚡ [JSearch API] Found jobs array:', {
        count: jobs.length,
        firstJob: jobs[0] ? Object.keys(jobs[0]) : 'none'
      })
      
      const transformed = jobs.map((job: any) => ({
        id: job.job_id || `jsearch-${Date.now()}-${Math.random()}`,
        title: job.job_title || '',
        company: job.employer_name || 'Not specified',
        location: job.job_city || job.job_state || job.job_country || 'Remote',
        description: job.job_description || '',
        salary: job.job_salary || job.job_min_salary || job.job_max_salary || undefined,
        employment_type: job.job_employment_type || undefined,
        posted_date: job.job_posted_at_datetime_utc || job.job_posted_at_timestamp || new Date().toISOString(),
        apply_url: job.job_apply_link || job.job_google_link || undefined,
        skills: job.job_required_skills || [],
        experience_level: job.job_experience_in_place_of_education || undefined
      }))
      
      console.log('✅ [JSearch API] Transformed jobs:', transformed.length)
      return transformed
    } catch (error: any) {
      console.error('❌ [JSearch API] Error:', {
        message: error.message,
        stack: error.stack
      })
      return [] // Return empty array instead of throwing
    }
  }

  // Aggregate search across multiple APIs
  // Uses working RapidAPI endpoints (most free job APIs have been deprecated)
  async aggregateJobSearch(params: {
    query?: string
    location?: string
    employment_type?: string
    page?: number
    sources?: string[]
  }): Promise<{
    jobs: RapidAPIJob[]
    sources: Record<string, number>
    total: number
  }> {
    console.log('🌐 [Aggregate] Starting aggregate search:', params)
    
    // Use only WORKING RapidAPI job sources
    // Most free job APIs on RapidAPI have been deprecated/removed (404 errors)
    // These are the only ones that still work:
    const sources = params.sources && params.sources.length > 0 
      ? params.sources 
      : [
          'job-search-api',  // Latest jobs from last 7 days
          'jsearch'          // Google for Jobs aggregator (LinkedIn, Indeed, etc.)
        ]
    console.log('🌐 [Aggregate] Using sources:', sources)
    
    const results: RapidAPIJob[] = []
    const sourceCounts: Record<string, number> = {}

    const searchPromises = sources.map(async (source) => {
      try {
        let jobs: RapidAPIJob[] = []
        
        switch (source) {
          case 'job-search-api':
            // PRIMARY: Latest jobs from last 7 days, hourly refresh
            jobs = await this.searchJobSearchAPI({
              keyword: params.query || 'developer',
              location: params.location,
              page: params.page,
              limit: 50
            })
            break
          case 'jsearch':
            // SECONDARY: Google for Jobs aggregator
            jobs = await this.searchJSearchAPI({
              query: params.query || 'developer',
              location: params.location,
              date_posted: 'week', // Last 7 days for freshness
              page: params.page,
              employment_types: params.employment_type
            })
            break
          case 'employment-agency':
            jobs = await this.searchEmploymentAgencyJobs(params)
            break
          case 'glassdoor':
            jobs = await this.searchGlassdoorJobs(params)
            break
          case 'upwork':
            jobs = await this.searchUpworkJobs(params)
            break
          case 'active-jobs':
            jobs = await this.searchActiveJobs(params)
            break
          case 'job-postings':
            jobs = await this.searchJobPostings(params)
            break
          case 'y-combinator':
            jobs = await this.searchYCombinatorJobs(params)
            break
          case 'freelancer':
            jobs = await this.searchFreelancerJobs(params)
            break
        }

        sourceCounts[source] = jobs.length
        return jobs.map(job => ({ ...job, source: `rapidapi-${source}` }))
      } catch (error) {
        console.error(`Error fetching from ${source}:`, error)
        sourceCounts[source] = 0
        return []
      }
    })

    const allResults = await Promise.all(searchPromises)
    console.log('🌐 [Aggregate] All promises resolved:', {
      promiseCount: allResults.length,
      resultCounts: allResults.map(r => r.length)
    })
    
    allResults.forEach(jobs => results.push(...jobs))
    console.log('🌐 [Aggregate] Total results before dedup:', results.length)

    // Remove duplicates based on title and company
    const uniqueJobs = results.filter((job, index, self) => 
      index === self.findIndex(j => 
        j.title.toLowerCase() === job.title.toLowerCase() && 
        j.company.toLowerCase() === job.company.toLowerCase()
      )
    )
    console.log('🌐 [Aggregate] After deduplication:', uniqueJobs.length)

    // Sort by posted date (newest first)
    uniqueJobs.sort((a, b) => {
      const dateA = new Date(a.posted_date || 0).getTime()
      const dateB = new Date(b.posted_date || 0).getTime()
      return dateB - dateA
    })

    console.log('✅ [Aggregate] Final result:', {
      uniqueJobs: uniqueJobs.length,
      sources: sourceCounts,
      total: uniqueJobs.length
    })

    return {
      jobs: uniqueJobs,
      sources: sourceCounts,
      total: uniqueJobs.length
    }
  }
}

// Transform RapidAPI job to our database format
export function transformRapidAPIJob(job: RapidAPIJob, source: string): any {
  return {
    title: job.title,
    description: job.description,
    short_description: job.description?.substring(0, 500),
    type: 'job',
    status: 'active',
    employment_type: normalizeEmploymentType(job.employment_type),
    experience_level: normalizeExperienceLevel(job.experience_level),
    location: job.location,
    skills: job.skills || [],
    application_url: job.apply_url,
    source: `rapidapi-${source}`,
    external_id: job.id,
    published_at: job.posted_date ? new Date(job.posted_date).toISOString() : new Date().toISOString(),
    company_name: job.company,
    salary_text: job.salary
  }
}

function normalizeEmploymentType(type?: string): string | null {
  if (!type) return null
  
  const normalized = type.toLowerCase()
  if (normalized.includes('full')) return 'full_time'
  if (normalized.includes('part')) return 'part_time'
  if (normalized.includes('contract')) return 'contract'
  if (normalized.includes('freelance')) return 'freelance'
  if (normalized.includes('intern')) return 'internship'
  if (normalized.includes('temp')) return 'temporary'
  
  return null
}

function normalizeExperienceLevel(level?: string): string | null {
  if (!level) return null
  
  const normalized = level.toLowerCase()
  if (normalized.includes('entry') || normalized.includes('junior')) return 'junior'
  if (normalized.includes('mid') || normalized.includes('intermediate')) return 'mid'
  if (normalized.includes('senior')) return 'senior'
  if (normalized.includes('lead') || normalized.includes('principal')) return 'lead'
  if (normalized.includes('executive') || normalized.includes('director')) return 'executive'
  
  return null
}
