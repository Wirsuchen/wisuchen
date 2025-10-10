// Adzuna API Integration
import { API_CONFIG } from '@/lib/config/api-keys'

export interface AdzunaJob {
  id: string
  title: string
  location: {
    area: string[]
    display_name: string
  }
  description: string
  created: string
  company: {
    display_name: string
  }
  salary_min?: number
  salary_max?: number
  contract_type?: string
  redirect_url: string
  category: {
    label: string
    tag: string
  }
}

export interface AdzunaSearchParams {
  what?: string // job title, keywords
  where?: string // location
  distance?: number // search radius in km
  salary_min?: number
  salary_max?: number
  full_time?: boolean
  part_time?: boolean
  contract?: boolean
  permanent?: boolean
  page?: number
  results_per_page?: number
  sort_by?: 'relevance' | 'date' | 'salary'
  sort_dir?: 'up' | 'down'
  category?: string
}

export class AdzunaAPI {
  private baseUrl: string
  private appId: string
  private apiKey: string

  constructor() {
    this.baseUrl = API_CONFIG.adzuna.baseUrl
    this.appId = API_CONFIG.adzuna.appId
    this.apiKey = API_CONFIG.adzuna.apiKey
  }

  private buildUrl(country: string = 'de', endpoint: string, params: Record<string, any> = {}): string {
    const url = new URL(`${this.baseUrl}/${country}/${endpoint}`)
    url.searchParams.append('app_id', this.appId)
    url.searchParams.append('app_key', this.apiKey)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString())
      }
    })
    
    return url.toString()
  }

  async searchJobs(params: AdzunaSearchParams = {}): Promise<{
    results: AdzunaJob[]
    count: number
    mean?: number
  }> {
    try {
      const url = this.buildUrl('de', 'search/1', {
        what: params.what,
        where: params.where,
        distance: params.distance,
        salary_min: params.salary_min,
        salary_max: params.salary_max,
        full_time: params.full_time ? 1 : undefined,
        part_time: params.part_time ? 1 : undefined,
        contract: params.contract ? 1 : undefined,
        permanent: params.permanent ? 1 : undefined,
        page: params.page || 1,
        results_per_page: Math.min(params.results_per_page || 20, 50),
        sort_by: params.sort_by || 'relevance',
        sort_dir: params.sort_dir || 'down',
        category: params.category
      })

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TalentPlus/1.0 (https://talentplus.com)'
        }
      })

      if (!response.ok) {
        throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Adzuna API error:', error)
      throw error
    }
  }

  async getJobDetails(jobId: string): Promise<AdzunaJob> {
    try {
      const url = this.buildUrl('de', `jobs/${jobId}`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TalentPlus/1.0 (https://talentplus.com)'
        }
      })

      if (!response.ok) {
        throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Adzuna API error:', error)
      throw error
    }
  }

  async getCategories(): Promise<Array<{ label: string; tag: string }>> {
    try {
      const url = this.buildUrl('de', 'categories')
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TalentPlus/1.0 (https://talentplus.com)'
        }
      })

      if (!response.ok) {
        throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error('Adzuna API error:', error)
      throw error
    }
  }

  async getSalaryStats(params: { what?: string; where?: string }): Promise<{
    average: number
    count: number
    histogram: Array<{ salary: number; count: number }>
  }> {
    try {
      const url = this.buildUrl('de', 'salaries/search', params)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TalentPlus/1.0 (https://talentplus.com)'
        }
      })

      if (!response.ok) {
        throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Adzuna API error:', error)
      throw error
    }
  }
}

// Transform Adzuna job to our database format
export function transformAdzunaJob(job: AdzunaJob): any {
  return {
    title: job.title,
    description: job.description,
    short_description: job.description.substring(0, 500),
    type: 'job',
    status: 'active',
    employment_type: job.contract_type?.toLowerCase().includes('part') ? 'part_time' : 'full_time',
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_currency: 'EUR',
    location: job.location.display_name,
    application_url: job.redirect_url,
    source: 'adzuna',
    external_id: job.id,
    published_at: new Date(job.created).toISOString(),
    // Map to existing company or create placeholder
    company_name: job.company.display_name,
    category_name: job.category.label
  }
}
