import { createHash } from 'crypto'

import { API_CONFIG } from '@/lib/config/api-keys'
import { cache, CACHE_CONFIG } from '@/lib/utils/cache'
import { logger } from '@/lib/utils/logger'
import { withRetry } from '@/lib/utils/retry'
import { rateLimiter } from '@/lib/utils/rate-limiter'

const DEFAULT_DEALS_ENDPOINT = 'search'
const USER_AGENT = 'WIRsuchen/1.0 (+https://wirsuchen.com)'

export interface RapidAPIDealSearchParams {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
  sort?: string
  country?: string
  currency?: string
  onSale?: boolean
  store?: string
  isTest?: boolean
}

export interface RapidAPIDeal {
  id: string
  title: string
  store: string
  price: number | null
  originalPrice?: number | null
  currency?: string
  discountPercentage?: number | null
  rating?: number | null
  reviewsCount?: number | null
  url?: string
  imageUrl?: string
  category?: string
  tags?: string[]
}

export interface RapidAPIDealSearchResponse {
  deals: RapidAPIDeal[]
  total: number
  page: number
  pages: number
  cached: boolean
  sourceHost: string
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.,-]/g, '').replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const buildCacheKey = (host: string, params: RapidAPIDealSearchParams) => {
  const hash = createHash('md5').update(JSON.stringify(params)).digest('hex')
  return `rapidapi:deals:${host}:${hash}`
}

export class RapidAPIDealsAPI {
  private readonly host: string
  private readonly apiKey: string
  private readonly endpoint: string

  constructor(options?: { host?: string; endpoint?: string }) {
    this.host = (options?.host || API_CONFIG.rapidApi.host || '').trim()
    this.endpoint = options?.endpoint || DEFAULT_DEALS_ENDPOINT
    this.apiKey = API_CONFIG.rapidApi.key

    if (!this.host) {
      logger.warn('RapidAPI deals host not configured. Set RAPIDAPI_HOST to enable deals feed.')
    }

    if (!this.apiKey) {
      logger.warn('RapidAPI key missing. Deals API will return empty results.')
    }
  }

  private buildUrl(params: RapidAPIDealSearchParams): string {
    const url = new URL(`https://${this.host}/${this.endpoint}`)

    if (params.query) url.searchParams.set('query', params.query)
    if (params.category) url.searchParams.set('category', params.category)
    if (params.minPrice !== undefined) url.searchParams.set('minPrice', params.minPrice.toString())
    if (params.maxPrice !== undefined) url.searchParams.set('maxPrice', params.maxPrice.toString())
    if (params.page) url.searchParams.set('page', params.page.toString())
    if (params.limit) url.searchParams.set('limit', Math.min(params.limit, 50).toString())
    if (params.sort) url.searchParams.set('sort', params.sort)
    if (params.country) url.searchParams.set('country', params.country)
    if (params.currency) url.searchParams.set('currency', params.currency)
    if (params.store) url.searchParams.set('store', params.store)
    if (params.onSale !== undefined) url.searchParams.set('onSale', params.onSale ? 'true' : 'false')

    if (params.isTest) {
      url.searchParams.set('test', 'true')
    }

    return url.toString()
  }

  async searchDeals(params: RapidAPIDealSearchParams = {}): Promise<RapidAPIDealSearchResponse> {
    if (!this.host || !this.apiKey) {
      return {
        deals: [],
        total: 0,
        page: params.page || 1,
        pages: 0,
        cached: false,
        sourceHost: this.host,
      }
    }

    const cacheKey = buildCacheKey(this.host, params)
    const cached = await cache.get<RapidAPIDealSearchResponse>(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    const url = this.buildUrl(params)

    await rateLimiter.acquire('rapidApi', 'searchDeals')

    const payload = await withRetry(
      async () => {
        const started = Date.now()
        logger.apiRequest('rapidapi-deals', url, {
          host: this.host,
          category: params.category,
          query: params.query,
          page: params.page,
          limit: params.limit,
        })

        const response = await fetch(url, {
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': this.host,
            'User-Agent': USER_AGENT,
            Accept: 'application/json',
          },
        })

        const duration = Date.now() - started
        logger.apiResponse('rapidapi-deals', url, duration, response.status)

        if (!response.ok) {
          const text = await response.text().catch(() => undefined)
          const error = new Error(`RapidAPI deals error: ${response.status} ${response.statusText}`)
          logger.apiError('rapidapi-deals', url, {
            message: error.message,
            statusCode: response.status,
            body: text,
          })
          throw error
        }

        return response.json()
      },
      {
        onRetry: (attempt, error) => {
          logger.warn('Retrying RapidAPI deals request', {
            host: this.host,
            attempt,
            error: error.message,
          })
        },
      },
      'rapidapi',
      'searchDeals'
    )

    const items = Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.results)
          ? payload.results
          : Array.isArray(payload.deals)
            ? payload.deals
            : []

    const deals: RapidAPIDeal[] = items.map((item: any, index: number) => {
      const id =
        item.id ||
        item.offer_id ||
        item.sku ||
        item.productId ||
        `rapidapi-deal-${Date.now()}-${index}`

      const price = toNumber(item.price ?? item.current_price ?? item.price_now)
      const originalPrice = toNumber(item.original_price ?? item.list_price ?? item.price_was)
      const currency = item.currency || item.currency_code || params.currency

      let discountPercentage: number | null = null
      if (price !== null && originalPrice && originalPrice > price) {
        discountPercentage = Math.round(((originalPrice - price) / originalPrice) * 100)
      } else if (typeof item.discount_percentage === 'number') {
        discountPercentage = item.discount_percentage
      }

      return {
        id,
        title: item.title || item.name || item.product_name || 'Untitled deal',
        store: item.store || item.merchant || item.vendor || 'Unknown store',
        price,
        originalPrice,
        currency,
        discountPercentage,
        rating: toNumber(item.rating || item.score),
        reviewsCount: toNumber(item.reviews_count || item.review_count),
        url: item.url || item.link || item.offer_url,
        imageUrl: item.image_url || item.image || item.thumbnail,
        category: item.category || params.category,
        tags: Array.isArray(item.tags) ? item.tags : undefined,
      }
    })

    const total = typeof payload.total === 'number' ? payload.total : deals.length
    const page = params.page || 1
    const limit = params.limit || deals.length || 20
    const pages = payload.pages || Math.ceil(total / limit) || (deals.length > 0 ? 1 : 0)

    const response: RapidAPIDealSearchResponse = {
      deals,
      total,
      page,
      pages,
      cached: false,
      sourceHost: this.host,
    }

    await cache.set(cacheKey, response, {
      ttl: CACHE_CONFIG.affiliate.ttl || 3600,
      tags: ['rapidapi', 'deals'],
    })

    return response
  }
}

export const rapidApiDeals = new RapidAPIDealsAPI()

export const normalizeRapidAPIDeal = (deal: RapidAPIDeal) => ({
  id: deal.id,
  title: deal.title,
  store: deal.store,
  price: deal.price,
  originalPrice: deal.originalPrice,
  currency: deal.currency,
  discountPercentage: deal.discountPercentage,
  rating: deal.rating,
  reviewsCount: deal.reviewsCount,
  url: deal.url,
  imageUrl: deal.imageUrl,
  category: deal.category,
  tags: deal.tags,
  source: 'rapidapi',
})

