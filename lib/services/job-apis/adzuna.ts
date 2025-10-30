// Adzuna API Integration - enhanced adapter with caching, retries, and multi-country support
import { createHash } from 'crypto'

import { API_CONFIG } from '@/lib/config/api-keys'
import { cache, CACHE_CONFIG } from '@/lib/utils/cache'
import { logger } from '@/lib/utils/logger'
import { withRetry } from '@/lib/utils/retry'
import { rateLimiter } from '@/lib/utils/rate-limiter'

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
  salary_is_predicted?: string
}

export interface AdzunaSearchParams {
  query?: string
  location?: string
  postcodes?: string[]
  countries?: string[]
  radiusKm?: number
  salaryMin?: number
  salaryMax?: number
  fullTime?: boolean
  partTime?: boolean
  contract?: boolean
  permanent?: boolean
  includeRemote?: boolean
  page?: number
  resultsPerPage?: number
  sortBy?: 'relevance' | 'date' | 'salary'
  sortDir?: 'up' | 'down'
  category?: string
  language?: string
  currency?: string
  /** Legacy aliases handled for backwards compatibility */
  what?: string
  where?: string
  distance?: number
  salary_min?: number
  salary_max?: number
  full_time?: boolean
  part_time?: boolean
  results_per_page?: number
  sort_by?: 'relevance' | 'date' | 'salary'
  sort_dir?: 'up' | 'down'
  isTest?: boolean
}

export interface AdzunaSearchResponse {
  results: AdzunaJob[]
  count: number
  mean?: number
  country: string
  searchLocation?: string
  cached: boolean
}

export interface AdzunaCountryConfig {
  language: string
  currency: string
}

const DEFAULT_COUNTRY = 'de'

const COUNTRY_SETTINGS: Record<string, AdzunaCountryConfig> = {
  de: { language: 'de', currency: 'EUR' },
  gb: { language: 'en', currency: 'GBP' },
  fr: { language: 'fr', currency: 'EUR' },
  nl: { language: 'nl', currency: 'EUR' },
  pl: { language: 'pl', currency: 'PLN' },
  it: { language: 'it', currency: 'EUR' },
  es: { language: 'es', currency: 'EUR' },
  se: { language: 'sv', currency: 'SEK' },
  ch: { language: 'de', currency: 'CHF' },
  at: { language: 'de', currency: 'EUR' },
  dk: { language: 'da', currency: 'DKK' },
  fi: { language: 'fi', currency: 'EUR' },
  be: { language: 'nl', currency: 'EUR' },
  no: { language: 'no', currency: 'NOK' },
  cz: { language: 'cs', currency: 'CZK' },
}

const DEFAULT_RADIUS_KM = 25
const MAX_RESULTS_PER_PAGE = 50
const MAX_POSTCODE_QUERIES = 10

const USER_AGENT = 'WIRsuchen/1.0 (+https://wirsuchen.com)'

const buildCacheKey = (country: string, params: Record<string, unknown>) => {
  const hash = createHash('md5').update(JSON.stringify(params)).digest('hex')
  return `adzuna:${country}:${hash}`
}

export class AdzunaAPI {
  private readonly baseUrl: string
  private readonly appId: string
  private readonly apiKey: string

  constructor() {
    this.baseUrl = API_CONFIG.adzuna.baseUrl
    this.appId = API_CONFIG.adzuna.appId
    this.apiKey = API_CONFIG.adzuna.apiKey

    if (!this.appId || !this.apiKey) {
      logger.warn('Adzuna credentials missing. Adapter will return empty results.')
    }
  }

  private resolveCountrySettings(country: string) {
    const settings = COUNTRY_SETTINGS[country.toLowerCase()]
    return settings || COUNTRY_SETTINGS[DEFAULT_COUNTRY]
  }

  private buildUrl(country: string, page: number, params: Record<string, any>): string {
    const endpoint = `search/${page}`
    const url = new URL(`${this.baseUrl}/${country}/${endpoint}`)

    url.searchParams.append('app_id', this.appId)
    url.searchParams.append('app_key', this.apiKey)
    url.searchParams.append('results_per_page', Math.min(params.results_per_page ?? 20, MAX_RESULTS_PER_PAGE).toString())

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value.toString())
      }
    })

    return url.toString()
  }

  private async requestJobs(
    country: string,
    searchLocation: string | undefined,
    params: AdzunaSearchParams
  ): Promise<AdzunaSearchResponse> {
    const { language, currency } = this.resolveCountrySettings(country)
    const page = Math.max(1, params.page ?? 1)
    const resultsPerPage = Math.min(params.resultsPerPage ?? params.results_per_page ?? 20, MAX_RESULTS_PER_PAGE)
    const radiusKm = params.radiusKm ?? params.distance ?? DEFAULT_RADIUS_KM

    const queryParams: Record<string, any> = {
      what: params.query ?? params.what,
      where: searchLocation ?? params.location ?? params.where,
      distance: radiusKm,
      salary_min: params.salaryMin ?? params.salary_min,
      salary_max: params.salaryMax ?? params.salary_max,
      // Removed: what_language - not supported by Adzuna API
      // Removed: sort_dir - causes 400 errors, use sort_by only
      full_time: params.fullTime ?? params.full_time ? 1 : undefined,
      part_time: params.partTime ?? params.part_time ? 1 : undefined,
      contract: params.contract ? 1 : undefined,
      permanent: params.permanent ? 1 : undefined,
      sort_by: params.sortBy ?? params.sort_by ?? 'date',
      category: params.category,
      results_per_page: resultsPerPage,
    }

    if (params.isTest) {
      queryParams.is_test = 1
      if (!queryParams.max_days_old) {
        queryParams.max_days_old = 7
      }
    }

    const cacheKey = buildCacheKey(country, {
      ...queryParams,
      page,
      searchLocation,
    })

    const ttl = CACHE_CONFIG.jobs.ttl || 3600

    const cachedResponse = await cache.get<AdzunaSearchResponse>(cacheKey)
    if (cachedResponse) {
      return { ...cachedResponse, cached: true }
    }

    if (!this.appId || !this.apiKey) {
      return { results: [], count: 0, country, searchLocation, cached: false }
    }

    await rateLimiter.acquire('adzuna', 'searchJobs')

    const url = this.buildUrl(country, page, queryParams)

    const response = await withRetry(
      async () => {
        const started = Date.now()
        logger.apiRequest('adzuna', url, {
          country,
          location: searchLocation,
          radiusKm,
        })

        const fetchResponse = await fetch(url, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
          },
        })

        const duration = Date.now() - started
        logger.apiResponse('adzuna', url, duration, fetchResponse.status)

        if (!fetchResponse.ok) {
          const errorBody = await fetchResponse.text().catch(() => undefined)
          const error = new Error(`Adzuna API error: ${fetchResponse.status} ${fetchResponse.statusText}`)
          logger.apiError('adzuna', url, {
            message: error.message,
            statusCode: fetchResponse.status,
            body: errorBody,
          })
          throw error
        }

        return fetchResponse.json()
      },
      {
        onRetry: (attempt, error) => {
          logger.warn('Retrying Adzuna request', {
            attempt,
            country,
            location: searchLocation,
            error: error.message,
          })
        },
      },
      'adzuna',
      'searchJobs'
    )

    const payload = {
      results: Array.isArray(response.results) ? response.results : [],
      count: typeof response.count === 'number' ? response.count : 0,
      mean: response.mean,
      country,
      searchLocation,
      cached: false,
    }

    await cache.set(cacheKey, payload, {
      ttl,
      tags: ['adzuna', 'jobs'],
    })

    return payload
  }

  async searchJobs(params: AdzunaSearchParams = {}): Promise<AdzunaSearchResponse[]> {
    const countries = params.countries && params.countries.length > 0
      ? params.countries
      : [DEFAULT_COUNTRY]

    const postcodes = params.postcodes?.slice(0, MAX_POSTCODE_QUERIES)
    const locationCandidates = postcodes && postcodes.length > 0
      ? postcodes
      : [params.location ?? params.where]

    const results: AdzunaSearchResponse[] = []

    for (const country of countries) {
      for (const locationCandidate of locationCandidates) {
        const response = await this.requestJobs(country, locationCandidate, params)
        results.push(response)
      }
    }

    return results
  }

  async getCategories(country: string = DEFAULT_COUNTRY): Promise<Array<{ label: string; tag: string }>> {
    await rateLimiter.acquire('adzuna', 'getCategories')

    const response = await withRetry(
      async () => {
        const endpoint = `${this.baseUrl}/${country}/categories?app_id=${this.appId}&app_key=${this.apiKey}`

        logger.apiRequest('adzuna', endpoint, { country })
        const res = await fetch(endpoint, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
          },
        })

        logger.apiResponse('adzuna', endpoint, 0, res.status)

        if (!res.ok) {
          throw new Error(`Adzuna API error: ${res.status} ${res.statusText}`)
        }

        return res.json()
      },
      {},
      'adzuna',
      'getCategories'
    )

    return Array.isArray(response.results) ? response.results : []
  }

  async getSalaryStats(country: string, params: { query?: string; location?: string }) {
    await rateLimiter.acquire('adzuna', 'getSalaryStats')

    const queryParams = new URLSearchParams({
      app_id: this.appId,
      app_key: this.apiKey,
    })

    if (params.query) queryParams.append('what', params.query)
    if (params.location) queryParams.append('where', params.location)

    const endpoint = `${this.baseUrl}/${country}/salaries/search?${queryParams.toString()}`

    const response = await withRetry(
      async () => {
        logger.apiRequest('adzuna', endpoint)
        const res = await fetch(endpoint, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
          },
        })

        logger.apiResponse('adzuna', endpoint, 0, res.status)

        if (!res.ok) {
          throw new Error(`Adzuna API error: ${res.status} ${res.statusText}`)
        }

        return res.json()
      },
      {},
      'adzuna',
      'getSalaryStats'
    )

    return response
  }
}

// Transform Adzuna job to our internal representation
export function transformAdzunaJob(job: AdzunaJob, country: string): any {
  const settings = COUNTRY_SETTINGS[country as keyof typeof COUNTRY_SETTINGS] || COUNTRY_SETTINGS[DEFAULT_COUNTRY]

  return {
    title: job.title,
    description: job.description,
    short_description: job.description ? job.description.substring(0, 500) : '',
    type: 'job',
    status: 'active',
    employment_type: job.contract_type?.toLowerCase().includes('part') ? 'part_time' : 'full_time',
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_currency: settings.currency,
    location: job.location?.display_name,
    application_url: job.redirect_url,
    source: 'adzuna',
    external_id: job.id,
    published_at: new Date(job.created).toISOString(),
    company_name: job.company?.display_name,
    category_name: job.category?.label,
    raw: job,
  }
}
