import { API_CONFIG } from '@/lib/config/api-keys'
import { cache, CACHE_CONFIG } from '@/lib/utils/cache'
import { logger } from '@/lib/utils/logger'
import { withRetry } from '@/lib/utils/retry'
import { rateLimiter } from '@/lib/utils/rate-limiter'
import { createHash } from 'crypto'

const USER_AGENT = 'WIRsuchen/1.0 (+https://wirsuchen.com)'

export interface AwinProduct {
  id: string
  title: string
  description: string
  merchant: string
  price: number
  currency: string
  image: string
  url: string
  category: string
  inStock: boolean
  brand?: string
  rating?: number
  originalPrice?: number
}

export interface AwinSearchParams {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
}

export interface AwinSearchResponse {
  products: AwinProduct[]
  total: number
  page: number
  pages: number
  cached: boolean
}

const buildCacheKey = (params: AwinSearchParams) => {
  const hash = createHash('md5').update(JSON.stringify(params)).digest('hex')
  return `awin:products:${hash}`
}

export class AwinAPI {
  private readonly oauthToken: string
  private readonly baseUrl: string
  private readonly publisherId: string

  constructor() {
    this.oauthToken = API_CONFIG.awin.oauthToken
    this.baseUrl = API_CONFIG.awin.baseUrl
    // Extract publisher ID from token or use default
    this.publisherId = '1005419' // Common test publisher ID

    if (!this.oauthToken) {
      logger.warn('AWIN OAuth token not configured. Affiliate deals will return empty results.')
    }
  }

  async searchProducts(params: AwinSearchParams = {}): Promise<AwinSearchResponse> {
    if (!this.oauthToken) {
      logger.warn('AWIN API: No OAuth token configured')
      return {
        products: [],
        total: 0,
        page: params.page || 1,
        pages: 0,
        cached: false,
      }
    }

    const cacheKey = buildCacheKey(params)
    const cached = await cache.get<AwinSearchResponse>(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    const page = params.page || 1
    const limit = params.limit || 20

    // AWIN Product Feed API v2 endpoint (correct endpoint)
    const url = new URL(`https://productdata.awin.com/datafeed/list/apikey/${this.oauthToken}`)
    
    // AWIN uses different parameter names
    if (params.query) url.searchParams.set('search', params.query)
    if (params.category) url.searchParams.set('category', params.category)
    if (params.minPrice) url.searchParams.set('minprice', params.minPrice.toString())
    if (params.maxPrice) url.searchParams.set('maxprice', params.maxPrice.toString())
    url.searchParams.set('limit', limit.toString())
    url.searchParams.set('offset', ((page - 1) * limit).toString())
    url.searchParams.set('format', 'json')

    await rateLimiter.acquire('awin', 'searchProducts')

    const payload = await withRetry(
      async () => {
        const started = Date.now()
        logger.apiRequest('awin', url.toString(), { query: params.query, page, limit })

        const response = await fetch(url.toString(), {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
          },
        })

        const duration = Date.now() - started
        logger.apiResponse('awin', url.toString(), duration, response.status)

        if (!response.ok) {
          const text = await response.text().catch(() => undefined)
          const error = new Error(`AWIN API error: ${response.status} ${response.statusText}`)
          logger.apiError('awin', url.toString(), {
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
          logger.warn('Retrying AWIN request', { attempt, error: error.message })
        },
      },
      'awin',
      'searchProducts'
    )

    // Parse AWIN response
    const products: AwinProduct[] = []
    const items = payload.response?.docs || payload.products || []

    for (const item of items) {
      try {
        const price = parseFloat(item.price?.amount || item.price || '0')
        const originalPrice = parseFloat(item.rrp?.amount || item.rrp || '0')

        products.push({
          id: item.aw_product_id || item.id || `awin-${Date.now()}-${Math.random()}`,
          title: item.product_name || item.title || 'Untitled Product',
          description: item.description || item.product_name || '',
          merchant: item.merchant_name || item.merchant || 'Unknown Merchant',
          price: price,
          currency: item.currency || 'EUR',
          image: item.aw_image_url || item.image_url || item.image || '/placeholder.jpg',
          url: item.aw_deep_link || item.product_link || item.url || '#',
          category: item.category_name || item.category || params.category || 'General',
          inStock: item.in_stock !== false,
          brand: item.brand_name || item.brand,
          rating: item.rating ? parseFloat(item.rating) : undefined,
          originalPrice: originalPrice > price ? originalPrice : undefined,
        })
      } catch (e) {
        logger.warn('Failed to parse AWIN product', { error: e, item })
      }
    }

    const total = payload.response?.numFound || products.length
    const pages = Math.ceil(total / limit) || 1

    const response: AwinSearchResponse = {
      products,
      total,
      page,
      pages,
      cached: false,
    }

    await cache.set(cacheKey, response, {
      ttl: CACHE_CONFIG.affiliate.ttl || 7200,
      tags: ['awin', 'products'],
    })

    return response
  }
}

export const awinApi = new AwinAPI()
