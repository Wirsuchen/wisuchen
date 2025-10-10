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

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        ...this.baseHeaders,
        'X-RapidAPI-Host': host
      }
    })

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status} ${response.statusText}`)
    }

    return response.json()
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

  // Aggregate search across multiple APIs
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
    const sources = params.sources || ['employment-agency', 'glassdoor', 'active-jobs', 'job-postings']
    const results: RapidAPIJob[] = []
    const sourceCounts: Record<string, number> = {}

    const searchPromises = sources.map(async (source) => {
      try {
        let jobs: RapidAPIJob[] = []
        
        switch (source) {
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
        return jobs.map(job => ({ ...job, source }))
      } catch (error) {
        console.error(`Error fetching from ${source}:`, error)
        sourceCounts[source] = 0
        return []
      }
    })

    const allResults = await Promise.all(searchPromises)
    allResults.forEach(jobs => results.push(...jobs))

    // Remove duplicates based on title and company
    const uniqueJobs = results.filter((job, index, self) => 
      index === self.findIndex(j => 
        j.title.toLowerCase() === job.title.toLowerCase() && 
        j.company.toLowerCase() === job.company.toLowerCase()
      )
    )

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
