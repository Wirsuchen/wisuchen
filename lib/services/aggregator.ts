/**
 * API Aggregator Service
 * Intelligently combines data from multiple API sources
 * Handles parallel requests, deduplication, and error fallback
 */

import { AdzunaAPI, transformAdzunaJob, type AdzunaSearchParams } from './job-apis/adzuna'
import { RapidAPIService, transformRapidAPIJob } from './job-apis/rapidapi'
import { AdcellAPI, transformAdcellOffer, type AdcellSearchParams } from './affiliate-apis/adcell'
import { AwinAPI, transformAwinOffer, type AwinSearchParams } from './affiliate-apis/awin'
import { rapidApiDeals } from '@/lib/api/rapidapi-deals'
import { getEnabledDealSources, getEnabledJobSources } from '@/lib/api/sources'
import { logger, PerformanceTimer } from '@/lib/utils/logger'
import { cache, CacheKeys, CACHE_CONFIG } from '@/lib/utils/cache'
import { withRetry } from '@/lib/utils/retry'

export interface AggregatedJob {
  id: string
  title: string
  description: string
  company: string
  location: string
  salary?: {
    min?: number
    max?: number
    currency?: string
    text?: string
  }
  employmentType?: string
  experienceLevel?: string
  skills?: string[]
  applicationUrl?: string
  source: string
  publishedAt: string
  externalId: string
  sourceMeta?: {
    country?: string
    searchLocation?: string
    cached?: boolean
  }
}

export interface AggregatedOffer {
  id: string
  title: string
  description: string
  company: string
  price?: number
  discountPrice?: number
  discountPercentage?: number
  commissionRate: number
  affiliateUrl: string
  imageUrl?: string
  category: string
  source: string
  externalId: string
  metadata?: {
    currency?: string
    rating?: number | null
    reviewsCount?: number | null
    sourceHost?: string
    cached?: boolean
  }
}

export interface SearchJobsParams {
  query?: string
  location?: string
  employmentType?: string
  experienceLevel?: string
  salaryMin?: number
  salaryMax?: number
  page?: number
  limit?: number
  sources?: string[] // Filter specific sources
  useCache?: boolean
  includeRemote?: boolean
  radiusKm?: number
  countries?: string[]
  postcodes?: string[]
  isTest?: boolean
}

export interface SearchOffersParams {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  onSale?: boolean
  page?: number
  limit?: number
  sources?: string[] // Filter specific sources
  useCache?: boolean
  includeRemote?: boolean
  radiusKm?: number
  countries?: string[]
  postcodes?: string[]
  isTest?: boolean
}

/**
 * Main aggregator class
 */
export class APIAggregator {
  private adzunaAPI: AdzunaAPI
  private rapidAPI: RapidAPIService
  private adcellAPI: AdcellAPI
  private awinAPI: AwinAPI

  constructor() {
    this.adzunaAPI = new AdzunaAPI()
    this.rapidAPI = new RapidAPIService()
    this.adcellAPI = new AdcellAPI()
    this.awinAPI = new AwinAPI()
  }

  /**
   * Search jobs across all enabled sources
   */
  async searchJobs(params: SearchJobsParams): Promise<{
    jobs: AggregatedJob[]
    sources: Record<string, number>
    total: number
    cached: boolean
  }> {
    console.log('🎯 [Aggregator] searchJobs called with params:', params)
    
    const timer = new PerformanceTimer()
    const cacheKey = CacheKeys.jobs(JSON.stringify(params))

    // Check cache if enabled
    if (params.useCache !== false && CACHE_CONFIG.jobs.enabled) {
      console.log('🎯 [Aggregator] Checking cache:', cacheKey)
      const cached = await cache.get<{ jobs: AggregatedJob[], sources: Record<string, number>, total: number }>(cacheKey)
      if (cached) {
        console.log('✅ [Aggregator] Cache HIT')
        logger.info('Jobs cache hit', { params })
        return { ...cached, cached: true }
      }
      console.log('❌ [Aggregator] Cache MISS')
    }

    const enabledSources = getEnabledJobSources(params.sources)
    console.log('🎯 [Aggregator] Enabled sources:', enabledSources)

    if (enabledSources.length === 0) {
      logger.warn('No job sources enabled', { requested: params.sources })
      return {
        jobs: [],
        sources: {},
        total: 0,
        cached: false,
      }
    }
    
    const results: AggregatedJob[] = []
    const sourceCounts: Record<string, number> = {}

    // Fetch from all sources in parallel
    const sourcePromises = enabledSources.map(async (source) => {
      try {
        let jobs: AggregatedJob[] = []

        switch (source) {
          case 'adzuna':
            jobs = await this.fetchFromAdzuna(params)
            break

          case 'rapidapi':
            jobs = await this.fetchFromRapidAPI(params)
            break
        }

        sourceCounts[source] = jobs.length
        return jobs
      } catch (error: any) {
        logger.error(`Failed to fetch jobs from ${source}`, { error: error.message })
        sourceCounts[source] = 0
        return []
      }
    })

    // Wait for all sources
    const allResults = await Promise.allSettled(sourcePromises)
    
    allResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(...result.value)
      }
    })

    // Deduplicate based on title and company
    const uniqueJobs = this.deduplicateJobs(results)

    // Apply pagination
    const page = params.page || 1
    const limit = params.limit || 20
    const startIndex = (page - 1) * limit
    const paginatedJobs = uniqueJobs.slice(startIndex, startIndex + limit)

    const response = {
      jobs: paginatedJobs,
      sources: sourceCounts,
      total: uniqueJobs.length,
      cached: false
    }

    // Cache the results
    if (CACHE_CONFIG.jobs.enabled) {
      await cache.set(cacheKey, response, {
        ttl: CACHE_CONFIG.jobs.ttl,
        tags: ['jobs']
      })
    }

    timer.log('Jobs aggregation completed', {
      total: uniqueJobs.length,
      sources: Object.keys(sourceCounts).length
    })

    return response
  }

  /**
   * Search affiliate offers across all enabled sources
   */
  async searchOffers(params: SearchOffersParams): Promise<{
    offers: AggregatedOffer[]
    sources: Record<string, number>
    total: number
    cached: boolean
  }> {
    const timer = new PerformanceTimer()
    const cacheKey = CacheKeys.affiliates(JSON.stringify(params))

    // Check cache if enabled
    if (params.useCache !== false && CACHE_CONFIG.affiliate.enabled) {
      const cached = await cache.get<{ offers: AggregatedOffer[], sources: Record<string, number>, total: number }>(cacheKey)
      if (cached) {
        logger.info('Offers cache hit', { params })
        return { ...cached, cached: true }
      }
    }

    const enabledSources = getEnabledDealSources(params.sources)
    const results: AggregatedOffer[] = []
    const sourceCounts: Record<string, number> = {}

    if (enabledSources.length === 0) {
      logger.warn('No affiliate sources enabled', { requested: params.sources })
      return {
        offers: [],
        sources: {},
        total: 0,
        cached: false,
      }
    }

    // Fetch from all sources in parallel
    const sourcePromises = enabledSources.map(async (source) => {
      try {
        let offers: AggregatedOffer[] = []

        switch (source) {
          case 'adcell':
            offers = await this.fetchFromAdcell(params)
            break

          case 'awin':
            offers = await this.fetchFromAwin(params)
            break

          case 'rapidapi-deals':
            offers = await this.fetchFromRapidApiDeals(params)
            break
        }

        sourceCounts[source] = offers.length
        return offers
      } catch (error: any) {
        logger.error(`Failed to fetch offers from ${source}`, { error: error.message })
        sourceCounts[source] = 0
        return []
      }
    })

    // Wait for all sources
    const allResults = await Promise.allSettled(sourcePromises)
    
    allResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(...result.value)
      }
    })

    // Deduplicate
    const uniqueOffers = this.deduplicateOffers(results)

    // Apply pagination
    const page = params.page || 1
    const limit = params.limit || 20
    const startIndex = (page - 1) * limit
    const paginatedOffers = uniqueOffers.slice(startIndex, startIndex + limit)

    const response = {
      offers: paginatedOffers,
      sources: sourceCounts,
      total: uniqueOffers.length,
      cached: false
    }

    // Cache the results
    if (CACHE_CONFIG.affiliate.enabled) {
      await cache.set(cacheKey, response, {
        ttl: CACHE_CONFIG.affiliate.ttl,
        tags: ['offers']
      })
    }

    timer.log('Offers aggregation completed', {
      total: uniqueOffers.length,
      sources: Object.keys(sourceCounts).length
    })

    return response
  }

  /**
   * Fetch jobs from Adzuna
   */
  private async fetchFromAdzuna(params: SearchJobsParams): Promise<AggregatedJob[]> {
    const adzunaParams: AdzunaSearchParams = {
      query: params.query,
      location: params.location,
      postcodes: params.postcodes,
      countries: params.countries,
      radiusKm: params.radiusKm,
      salaryMin: params.salaryMin,
      salaryMax: params.salaryMax,
      includeRemote: params.includeRemote,
      page: params.page,
      resultsPerPage: params.limit,
      isTest: params.isTest,
    }

    const responses = await this.adzunaAPI.searchJobs(adzunaParams)

    return responses.flatMap((response) =>
      response.results.map((job) => {
        const normalized = transformAdzunaJob(job, response.country)

        return {
          id: job.id,
          title: normalized.title,
          description: normalized.description,
          company: normalized.company_name || job.company.display_name,
          location: normalized.location || job.location.display_name,
          salary: {
            min: normalized.salary_min,
            max: normalized.salary_max,
            currency: normalized.salary_currency,
          },
          employmentType: normalized.employment_type,
          applicationUrl: normalized.application_url,
          source: 'adzuna',
          publishedAt: normalized.published_at,
          externalId: job.id,
          sourceMeta: {
            country: response.country,
            searchLocation: response.searchLocation,
            cached: response.cached,
          },
        }
      })
    )
  }

  /**
   * Fetch jobs from RapidAPI sources
   */
  private async fetchFromRapidAPI(params: SearchJobsParams): Promise<AggregatedJob[]> {
    console.log('📡 [Aggregator] fetchFromRapidAPI called with:', params)
    
    return withRetry(async () => {
      console.log('📡 [Aggregator] Calling rapidAPI.aggregateJobSearch')
      
      const rapidApiParams = {
        query: params.query,
        location: params.location,
        employment_type: params.employmentType,
        page: params.page,
        // Don't specify sources - let RapidAPI service use its defaults (job-search-api, jsearch)
        // Most old free job APIs on RapidAPI have been deprecated/removed (404 errors)
      }
      
      console.log('📡 [Aggregator] RapidAPI params:', rapidApiParams)
      
      const response = await this.rapidAPI.aggregateJobSearch(rapidApiParams)
      
      console.log('📡 [Aggregator] RapidAPI response:', {
        jobCount: response.jobs.length,
        sources: response.sources,
        total: response.total
      })

      const transformed = response.jobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        company: job.company,
        location: job.location,
        salary: {
          text: job.salary
        },
        employmentType: job.employment_type,
        experienceLevel: job.experience_level,
        skills: job.skills,
        applicationUrl: job.apply_url,
        source: `${(job as any).source || 'rapidapi-unknown'}`,
        publishedAt: job.posted_date || new Date().toISOString(),
        externalId: job.id
      }))
      
      console.log('✅ [Aggregator] Transformed RapidAPI jobs:', transformed.length)
      return transformed
    }, {}, 'rapidapi', 'searchJobs')
  }

  /**
   * Fetch offers from Adcell
   */
  private async fetchFromAdcell(params: SearchOffersParams): Promise<AggregatedOffer[]> {
    return withRetry(async () => {
      const searchParams: AdcellSearchParams = {
        search_term: params.query,
        category: params.category,
        min_price: params.minPrice,
        max_price: params.maxPrice,
        on_sale: params.onSale,
        page: params.page || 1,
        per_page: params.limit || 20,
      }

      const offers = await this.adcellAPI.getProducts(searchParams)
      
      return offers.map(offer => ({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        company: offer.advertiser.name,
        price: offer.price,
        discountPrice: offer.old_price,
        discountPercentage: offer.discount_percentage,
        commissionRate: offer.commission.rate,
        affiliateUrl: offer.tracking_url,
        imageUrl: offer.image_urls[0],
        category: offer.category,
        source: 'adcell',
        externalId: offer.id
      }))
    }, {}, 'adcell', 'searchOffers')
  }

  /**
   * Fetch offers from Awin
   */
  private async fetchFromAwin(params: SearchOffersParams): Promise<AggregatedOffer[]> {
    return withRetry(async () => {
      const searchParams: AwinSearchParams = {
        keywords: params.query,
        category: params.category,
        limit: params.limit || 20,
      }

      const offers = await this.awinAPI.searchOffers(searchParams)
      
      return offers.map(offer => ({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        company: offer.advertiser.name,
        price: offer.price,
        commissionRate: offer.commission.amount,
        affiliateUrl: offer.tracking_url,
        imageUrl: offer.image_url,
        category: offer.category,
        source: 'awin',
        externalId: offer.id
      }))
    }, {}, 'awin', 'searchOffers')
  }

  private async fetchFromRapidApiDeals(params: SearchOffersParams): Promise<AggregatedOffer[]> {
    const response = await rapidApiDeals.searchDeals({
      query: params.query,
      category: params.category,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      onSale: params.onSale,
      page: params.page,
      limit: params.limit,
    })

    return response.deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      description: [deal.store, deal.category].filter(Boolean).join(' • '),
      company: deal.store,
      price: deal.price ?? undefined,
      discountPrice: deal.originalPrice ?? undefined,
      discountPercentage: deal.discountPercentage ?? undefined,
      commissionRate: 0,
      affiliateUrl: deal.url || '',
      imageUrl: deal.imageUrl,
      category: deal.category || params.category || 'general',
      source: 'rapidapi-deals',
      externalId: deal.id,
      metadata: {
        currency: deal.currency,
        rating: deal.rating ?? null,
        reviewsCount: deal.reviewsCount ?? null,
        sourceHost: response.sourceHost,
        cached: response.cached,
      },
    }))
  }

  /**
   * Deduplicate jobs based on title and company
   */
  private deduplicateJobs(jobs: AggregatedJob[]): AggregatedJob[] {
    const seen = new Set<string>()
    const unique: AggregatedJob[] = []

    for (const job of jobs) {
      const title = job.title?.toLowerCase().trim() || ''
      const company = job.company?.toLowerCase().trim() || ''
      const location = job.location?.toLowerCase().trim() || ''
      const externalId = job.externalId?.toLowerCase().trim() || ''

      // Compose a stricter key including externalId and location where available
      const key = [title, company, location, externalId].filter(Boolean).join('|')

      if (!seen.has(key)) {
        seen.add(key)
        unique.push(job)
      }
    }

    return unique
  }

  /**
   * Deduplicate offers based on title and company
   */
  private deduplicateOffers(offers: AggregatedOffer[]): AggregatedOffer[] {
    const seen = new Set<string>()
    const unique: AggregatedOffer[] = []

    for (const offer of offers) {
      const key = `${offer.title.toLowerCase().trim()}-${offer.company.toLowerCase().trim()}`
      
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(offer)
      }
    }

    return unique
  }

  /**
   * Invalidate all cached data
   */
  async invalidateCache(type?: 'jobs' | 'offers') {
    if (type === 'jobs') {
      await cache.deleteByTag('jobs')
    } else if (type === 'offers') {
      await cache.deleteByTag('offers')
    } else {
      await cache.clear()
    }

    logger.info('Cache invalidated', { type: type || 'all' })
  }
}

// Export singleton instance
export const apiAggregator = new APIAggregator()
