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

  // Real-Time Glassdoor API - Fresh job data from Glassdoor
  async searchGlassdoorRealTimeJobs(params: {
    query?: string
    location?: string
    employment_type?: string
    page?: number
    limit?: number
  }): Promise<RapidAPIJob[]> {
    try {
      console.log('🔍 [Glassdoor] Starting search:', params)
      
      const data = await this.makeRequest(
        'real-time-glassdoor-data.p.rapidapi.com',
        'job-search',
        {
          query: params.query || 'developer',
          location: params.location || 'germany',
          location_type: 'ANY',
          min_company_rating: 'ANY',
          domain: 'www.glassdoor.com',
          page: params.page || 1,
          limit: params.limit || 10
        }
      )

      console.log('📊 [Glassdoor] Response received:', {
        status: data.status,
        total: data.data?.total_count || 0,
        jobsCount: data.data?.jobs?.length || 0
      })

      if (!data.data || !data.data.jobs) {
        console.warn('⚠️ [Glassdoor] No jobs in response')
        return []
      }

      // Map Glassdoor API format to RapidAPIJob format
      const jobs: RapidAPIJob[] = data.data.jobs.map((job: any) => {
        // Calculate age in days and convert to posted_date
        const postedDate = new Date()
        postedDate.setDate(postedDate.getDate() - (job.age_in_days || 0))
        
        // Format salary
        let salaryText = ''
        if (job.salary_min && job.salary_max) {
          const currency = job.salary_currency === 'USD' ? '$' : '€'
          const period = job.salary_period === 'ANNUAL' ? '/year' : '/hour'
          salaryText = `${currency}${job.salary_min.toLocaleString()} - ${currency}${job.salary_max.toLocaleString()}${period}`
        }

        return {
          id: job.job_id?.toString() || `glassdoor-${Math.random()}`,
          title: job.job_title || 'Untitled Position',
          company: job.company_name || 'Company',
          location: job.location_name || params.location || 'Germany',
          description: `${job.job_title} at ${job.company_name}. ${job.easy_apply ? 'Easy Apply available. ' : ''}Company rating: ${job.rating || 'Not rated'}.`,
          salary: salaryText,
          employment_type: params.employment_type || 'full_time',
          posted_date: postedDate.toISOString(),
          apply_url: job.job_link,
          skills: [],
          experience_level: undefined
        }
      })

      console.log('✅ [Glassdoor] Mapped jobs:', jobs.length)
      return jobs
    } catch (error) {
      console.error('❌ [Glassdoor] API error:', error)
      return [] // Return empty array instead of throwing to prevent breaking aggregate search
    }
  }

  // Upwork Jobs API v2 - Active freelance jobs from last 1 hour
  async searchUpworkJobs(params: {
    q?: string
    skills?: string
    budget_min?: number
    budget_max?: number
    page?: number
    limit?: number
  }): Promise<RapidAPIJob[]> {
    try {
      console.log('💼 [Upwork] Starting search:', params)
      
      const data = await this.makeRequest(
        'upwork-jobs-api2.p.rapidapi.com',
        'active-freelance-1h',
        {
          limit: params.limit || 10
        }
      )

      console.log('📊 [Upwork] Response received:', {
        dataKeys: Object.keys(data || {}),
        jobsCount: Array.isArray(data) ? data.length : (data.jobs?.length || 0)
      })

      // Handle different response formats
      let jobs = []
      if (Array.isArray(data)) {
        jobs = data
      } else if (data.jobs) {
        jobs = data.jobs
      } else if (data.data) {
        jobs = data.data
      }

      // Map Upwork API format to RapidAPIJob format
      const mappedJobs: RapidAPIJob[] = jobs.map((job: any) => {
        // Parse date
        const postedDate = job.date_posted || new Date().toISOString()
        
        // Format salary from hourly rates
        let salaryText = ''
        if (job.project_budget_hourly_min && job.project_budget_hourly_max) {
          const currency = job.project_budget_currency === 'USD' ? '$' : '€'
          salaryText = `${currency}${job.project_budget_hourly_min}-${job.project_budget_hourly_max}/hr`
        } else if (job.salary_raw?.value) {
          const minVal = job.salary_raw.value.minValue
          const maxVal = job.salary_raw.value.maxValue
          const currency = job.salary_raw.currency === 'USD' ? '$' : '€'
          const unit = job.salary_raw.value.unitText === 'HOUR' ? '/hr' : ''
          if (minVal && maxVal) {
            salaryText = `${currency}${minVal}-${maxVal}${unit}`
          }
        } else if (job.project_budget_total > 0) {
          const currency = job.project_budget_currency === 'USD' ? '$' : '€'
          salaryText = `${currency}${job.project_budget_total} (Fixed)`
        }

        // Extract skills from multiple sources
        const skills: string[] = []
        if (job.skills_additional && Array.isArray(job.skills_additional)) {
          skills.push(...job.skills_additional)
        }
        if (job.skills_ontology) {
          Object.values(job.skills_ontology).forEach((skillGroup: any) => {
            if (typeof skillGroup === 'object' && !Array.isArray(skillGroup)) {
              Object.values(skillGroup).forEach((skillList: any) => {
                if (Array.isArray(skillList)) {
                  skills.push(...skillList)
                }
              })
            }
          })
        }
        if (job.skills_occupation) {
          skills.push(job.skills_occupation)
        }

        // Determine location - prefer client_country or fallback to worldwide
        let location = 'Remote (Worldwide)'
        if (job.client_country) {
          location = job.client_country
        } else if (job.location?.worldRegion) {
          location = `Remote (${job.location.worldRegion})`
        }

        // Build company/client name
        const company = job.client_company_size 
          ? `Upwork Client (${job.client_company_size} employees)` 
          : 'Upwork Client'

        return {
          id: job.id?.toString() || `upwork-${Math.random()}`,
          title: job.title || 'Freelance Project',
          company: company,
          location: location,
          description: job.description_text || job.description || '',
          salary: salaryText,
          employment_type: 'freelance',
          posted_date: postedDate,
          apply_url: job.url || `https://www.upwork.com/jobs/~${job.id}`,
          skills: skills.filter((s, i, arr) => arr.indexOf(s) === i), // Remove duplicates
          experience_level: job.weekly_hours || job.project_type
        }
      })

      console.log('✅ [Upwork] Mapped jobs:', mappedJobs.length)
      return mappedJobs
    } catch (error) {
      console.error('❌ [Upwork] API error:', error)
      return [] // Return empty array instead of throwing to prevent breaking aggregate search
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

  // Y Combinator Jobs API - Active jobs from last 7 days
  async searchYCombinatorJobs(params: {
    role?: string
    location?: string
    experience?: string
    page?: number
  }): Promise<RapidAPIJob[]> {
    try {
      console.log('🚀 [Y Combinator] Starting search:', params)
      
      const data = await this.makeRequest(
        'free-y-combinator-jobs-api.p.rapidapi.com',
        'active-jb-7d',
        {}
      )

      console.log('📊 [Y Combinator] Response received:', {
        dataType: Array.isArray(data) ? 'array' : 'object',
        jobsCount: Array.isArray(data) ? data.length : 0
      })

      // Handle response - should be an array
      const jobs = Array.isArray(data) ? data : []

      // Map Y Combinator API format to RapidAPIJob format
      const mappedJobs: RapidAPIJob[] = jobs.map((job: any) => {
        // Format salary
        let salaryText = ''
        if (job.salary_raw?.value) {
          const minVal = job.salary_raw.value.minValue
          const maxVal = job.salary_raw.value.maxValue
          const currency = job.salary_raw.currency === 'USD' ? '$' : '€'
          const unit = job.salary_raw.value.unitText === 'YEAR' ? '/year' : ''
          if (minVal && maxVal) {
            salaryText = `${currency}${minVal.toLocaleString()}-${maxVal.toLocaleString()}${unit}`
          }
        }

        // Get location - use first from locations_derived or countries_derived
        let location = 'Remote'
        if (job.locations_derived && job.locations_derived.length > 0) {
          location = job.locations_derived[0]
        } else if (job.countries_derived && job.countries_derived.length > 0) {
          location = job.countries_derived[0]
        }

        // Add remote indicator if applicable
        if (job.remote_derived || job.location_type === 'TELECOMMUTE') {
          location = `${location} (Remote)`
        }

        // Get employment type
        const employmentType = job.employment_type?.[0]?.toLowerCase().replace('_', ' ') || 'full_time'

        return {
          id: job.id?.toString() || `yc-${Math.random()}`,
          title: job.title || 'Position',
          company: job.organization || 'Y Combinator Company',
          location: location,
          description: `${job.title} at ${job.organization}. ${job.organization_url ? `Company: ${job.organization_url}` : ''}`,
          salary: salaryText,
          employment_type: employmentType,
          posted_date: job.date_posted || job.date_created || new Date().toISOString(),
          apply_url: job.url || '',
          skills: [],
          experience_level: job.seniority || undefined
        }
      })

      console.log('✅ [Y Combinator] Mapped jobs:', mappedJobs.length)
      return mappedJobs
    } catch (error) {
      console.error('❌ [Y Combinator] API error:', error)
      return [] // Return empty array instead of throwing to prevent breaking aggregate search
    }
  }

  // Freelancer API - Find active freelance jobs
  async searchFreelancerJobs(params: {
    query?: string
    skills?: string[]
    budget_min?: number
    budget_max?: number
    project_type?: string
    page?: number
  }): Promise<RapidAPIJob[]> {
    try {
      console.log('💻 [Freelancer] Starting search:', params)
      
      const data = await this.makeRequest(
        'freelancer-api.p.rapidapi.com',
        'api/find-job',
        {}
      )

      console.log('📊 [Freelancer] Response received:', {
        dataKeys: Object.keys(data || {}),
        postsCount: data.posts?.length || 0
      })

      if (!data.posts || !Array.isArray(data.posts)) {
        console.warn('⚠️ [Freelancer] No posts in response')
        return []
      }

      // Map Freelancer API format to RapidAPIJob format
      const mappedJobs: RapidAPIJob[] = data.posts.map((project: any) => {
        // Parse budget/price
        let salaryText = project['project-price'] || ''
        
        // Extract skills from tags
        const skills = project['project-tags'] 
          ? project['project-tags'].split(' ').filter((s: string) => s.length > 0)
          : []

        // Clean title (remove "days left" and "Verified" suffixes)
        let title = project['project-title'] || 'Freelance Project'
        title = title.replace(/\d+\s+days?\s+left/gi, '').replace(/Verified/gi, '').trim()

        // Parse description (truncate if too long)
        let description = project['project-description'] || ''
        if (description.length > 500) {
          description = description.substring(0, 497) + '...'
        }

        // Determine if payment is verified
        const isVerified = project['payment']?.includes('Verified') || false
        const paymentStatus = isVerified ? ' (Payment Verified)' : ''

        return {
          id: project['project-link']?.split('/').pop() || `freelancer-${Math.random()}`,
          title: title,
          company: `Freelancer.com${paymentStatus}`,
          location: 'Remote (Worldwide)',
          description: description,
          salary: salaryText,
          employment_type: 'freelance',
          posted_date: new Date().toISOString(), // API doesn't provide exact date
          apply_url: project['project-link'] || '',
          skills: skills,
          experience_level: project['freelancers-bids']
        }
      })

      console.log('✅ [Freelancer] Mapped jobs:', mappedJobs.length)
      return mappedJobs
    } catch (error) {
      console.error('❌ [Freelancer] API error:', error)
      return [] // Return empty array instead of throwing to prevent breaking aggregate search
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
      // Skip if no keyword provided
      if (!params.keyword) {
        console.log('🔥 [Job Search API] No keyword provided, skipping')
        return []
      }

      const requestParams = {
        keyword: params.keyword,
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
      // Skip if no query provided
      if (!params.query) {
        console.log('⚡ [JSearch API] No query provided, skipping')
        return []
      }

      const requestParams = {
        query: params.query,
        location: params.location,
        date_posted: params.date_posted || 'week', // Default to last week for freshness
        page: params.page || 1,
        num_pages: params.num_pages || 1,
        employment_types: params.employment_types
      }
      
      console.log(' [JSearch API] Request params:', requestParams)
      
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
    
    // Use only WORKING and SUBSCRIBED RapidAPI job sources
    // Most free job APIs on RapidAPI have been deprecated/removed (404 errors)
    const sources = params.sources && params.sources.length > 0 
      ? params.sources 
      : [
          'jsearch',       // Google for Jobs aggregator (LinkedIn, Indeed, etc.) - SUBSCRIBED
          'glassdoor',     // Real-Time Glassdoor API - Fresh job data with salaries - SUBSCRIBED
          'upwork',        // Upwork Jobs API v2 - Active freelance jobs from last 1 hour - SUBSCRIBED
          'y-combinator',  // Y Combinator Jobs - Active startup jobs from last 7 days - SUBSCRIBED
          'freelancer'     // Freelancer.com - Active freelance projects - SUBSCRIBED
        ]
    console.log('🌐 [Aggregate] Using sources:', sources)
    
    const results: RapidAPIJob[] = []
    const sourceCounts: Record<string, number> = {}

    const searchPromises = sources.map(async (source) => {
      try {
        let jobs: RapidAPIJob[] = []
        
        switch (source) {
          case 'jsearch':
            // Google for Jobs aggregator (SUBSCRIBED)
            if (!params.query) {
              console.log('⚡ [JSearch] No query provided, skipping')
              break
            }
            jobs = await this.searchJSearchAPI({
              query: params.query,
              location: params.location,
              date_posted: 'week', // Last 7 days for freshness
              page: params.page || 1,
              num_pages: 10, // Fetch 10 pages for maximum jobs
              employment_types: params.employment_type
            })
            break
          case 'job-search-api':
            // NOT SUBSCRIBED - Skip to avoid 403 errors
            console.warn('⚠️ [Job Search API] Not subscribed, skipping')
            break
          case 'employment-agency':
            jobs = await this.searchEmploymentAgencyJobs(params)
            break
          case 'glassdoor':
            jobs = await this.searchGlassdoorRealTimeJobs({
              ...params,
              limit: 50 // Request maximum 50 jobs
            })
            break
          case 'upwork':
            jobs = await this.searchUpworkJobs({
              ...params,
              limit: 50 // Request maximum 50 jobs
            })
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
