import { API_CONFIG } from '@/lib/config/api-keys'
import { cache, CACHE_CONFIG } from '@/lib/utils/cache'
import { logger } from '@/lib/utils/logger'
import { withRetry } from '@/lib/utils/retry'
import { rateLimiter } from '@/lib/utils/rate-limiter'
import { createHash } from 'crypto'

const USER_AGENT = 'WIRsuchen/1.0 (+https://wirsuchen.com)'

export interface AdcellProduct {
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
  ean?: string
  originalPrice?: number
}

export interface AdcellSearchParams {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
}

export interface AdcellSearchResponse {
  products: AdcellProduct[]
  total: number
  page: number
  pages: number
  cached: boolean
}

const buildCacheKey = (params: AdcellSearchParams) => {
  const hash = createHash('md5').update(JSON.stringify(params)).digest('hex')
  return `adcell:products:${hash}`
}

export class AdcellAPI {
  private readonly login: string
  private readonly password: string
  private readonly baseUrl: string

  constructor() {
    this.login = API_CONFIG.adcell.login
    this.password = API_CONFIG.adcell.password
    // Use correct ADCELL API base URL
    this.baseUrl = 'https://www.adcell.de/api'

    if (!this.login || !this.password) {
      logger.warn('ADCELL credentials not configured. Affiliate deals will return empty results.')
    }
  }

  async searchProducts(params: AdcellSearchParams = {}): Promise<AdcellSearchResponse> {
    if (!this.login || !this.password) {
      logger.warn('ADCELL API: No credentials configured')
      return {
        products: [],
        total: 0,
        page: params.page || 1,
        pages: 0,
        cached: false,
      }
    }

    const cacheKey = buildCacheKey(params)
    const cached = await cache.get<AdcellSearchResponse>(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    const page = params.page || 1
    const limit = params.limit || 20

    // ADCELL Product Feed API (correct endpoint - use programs/products)
    const url = new URL(`${this.baseUrl}/programs/${this.login}/products`)
    
    if (params.query) url.searchParams.set('q', params.query)
    if (params.category) url.searchParams.set('category', params.category)
    if (params.minPrice) url.searchParams.set('minPrice', params.minPrice.toString())
    if (params.maxPrice) url.searchParams.set('maxPrice', params.maxPrice.toString())
    url.searchParams.set('page', page.toString())
    url.searchParams.set('limit', limit.toString())

    await rateLimiter.acquire('adcell', 'searchProducts')

    // Basic auth credentials
    const authString = Buffer.from(`${this.login}:${this.password}`).toString('base64')

    const payload = await withRetry(
      async () => {
        const started = Date.now()
        logger.apiRequest('adcell', url.toString(), { query: params.query, page, limit })

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Basic ${authString}`,
            'User-Agent': USER_AGENT,
            'Accept': 'application/json',
          },
        })

        const duration = Date.now() - started
        logger.apiResponse('adcell', url.toString(), duration, response.status)

        if (!response.ok) {
          const text = await response.text().catch(() => undefined)
          const error = new Error(`ADCELL API error: ${response.status} ${response.statusText}`)
          logger.apiError('adcell', url.toString(), {
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
          logger.warn('Retrying ADCELL request', { attempt, error: error.message })
        },
      },
      'adcell',
      'searchProducts'
    )

    // Parse ADCELL response
    const products: AdcellProduct[] = []
    const items = payload.products || payload.data || payload.items || []

    for (const item of items) {
      try {
        const price = parseFloat(item.price || '0')
        const originalPrice = parseFloat(item.old_price || item.original_price || '0')

        products.push({
          id: item.product_id || item.id || `adcell-${Date.now()}-${Math.random()}`,
          title: item.name || item.title || 'Untitled Product',
          description: item.description || item.name || '',
          merchant: item.program_name || item.merchant || 'Unknown Merchant',
          price: price,
          currency: item.currency || 'EUR',
          image: item.image_url || item.image || '/placeholder.jpg',
          url: item.deeplink || item.product_url || item.url || '#',
          category: item.category || params.category || 'General',
          inStock: item.in_stock !== false && item.available !== false,
          brand: item.brand || item.manufacturer,
          ean: item.ean,
          originalPrice: originalPrice > price ? originalPrice : undefined,
        })
      } catch (e) {
        logger.warn('Failed to parse ADCELL product', { error: e, item })
      }
    }

    const total = payload.total || payload.totalCount || products.length
    const pages = Math.ceil(total / limit) || 1

    const response: AdcellSearchResponse = {
      products,
      total,
      page,
      pages,
      cached: false,
    }

    await cache.set(cacheKey, response, {
      ttl: CACHE_CONFIG.affiliate.ttl || 7200,
      tags: ['adcell', 'products'],
    })

    return response
  }
}

export const adcellApi = new AdcellAPI()
