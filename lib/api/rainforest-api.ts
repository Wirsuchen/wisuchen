// Rainforest API - Amazon Product Search (Works with RapidAPI)
// This is a reliable alternative for product/deals data

import { createHash } from 'crypto'
import { cache, CACHE_CONFIG } from '@/lib/utils/cache'
import { logger } from '@/lib/utils/logger'
import { withRetry } from '@/lib/utils/retry'
import { rateLimiter } from '@/lib/utils/rate-limiter'

const USER_AGENT = 'WIRsuchen/1.0'

export interface RainforestProduct {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  currency: string
  image: string
  url: string
  rating?: number
  reviews?: number
  store: string
  category?: string
  brand?: string
}

export interface RainforestSearchParams {
  query?: string
  category?: string
  page?: number
  limit?: number
}

export interface RainforestSearchResponse {
  products: RainforestProduct[]
  total: number
  page: number
  pages: number
  cached: boolean
}

const buildCacheKey = (params: RainforestSearchParams) => {
  const hash = createHash('md5').update(JSON.stringify(params)).digest('hex')
  return `rainforest:products:${hash}`
}

export class RainforestAPI {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = 'https://rainforest-products.p.rapidapi.com'
  }

  async searchProducts(params: RainforestSearchParams = {}): Promise<RainforestSearchResponse> {
    if (!this.apiKey) {
      logger.warn('Rainforest API: No API key configured')
      return {
        products: [],
        total: 0,
        page: params.page || 1,
        pages: 0,
        cached: false,
      }
    }

    const cacheKey = buildCacheKey(params)
    const cached = await cache.get<RainforestSearchResponse>(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    const query = params.query || 'electronics'
    const page = params.page || 1
    const limit = params.limit || 20

    const url = new URL(`${this.baseUrl}/search`)
    url.searchParams.set('query', query)
    url.searchParams.set('page', page.toString())
    
    if (params.category) url.searchParams.set('category', params.category)

    await rateLimiter.acquire('rapidApi', 'searchProducts')

    try {
      const started = Date.now()
      logger.apiRequest('rainforest', url.toString(), { query, page, limit })

      const response = await fetch(url.toString(), {
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'rainforest-products.p.rapidapi.com',
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
      })

      const duration = Date.now() - started
      logger.apiResponse('rainforest', url.toString(), duration, response.status)

      if (!response.ok) {
        const text = await response.text().catch(() => undefined)
        logger.apiError('rainforest', url.toString(), {
          statusCode: response.status,
          body: text,
        })
        
        return {
          products: [],
          total: 0,
          page,
          pages: 0,
          cached: false,
        }
      }

      const data = await response.json()
      const items = data.search_results || data.products || []

      const products: RainforestProduct[] = items.map((item: any, index: number) => {
        const price = parseFloat(item.price?.value || item.price || '0')
        const originalPrice = parseFloat(item.list_price?.value || item.original_price || '0')

        return {
          id: item.asin || item.id || `rf-${Date.now()}-${index}`,
          title: item.title || 'Untitled Product',
          description: item.description || item.title || '',
          price: price,
          originalPrice: originalPrice > price ? originalPrice : undefined,
          currency: item.price?.currency || 'EUR',
          image: item.image || item.thumbnail || '/placeholder.jpg',
          url: item.link || item.url || '#',
          rating: item.rating ? parseFloat(item.rating) : undefined,
          reviews: item.ratings_total || item.reviews_count || undefined,
          store: 'Amazon',
          category: params.category || 'General',
          brand: item.brand,
        }
      })

      const total = data.total_results || products.length
      const pages = Math.ceil(total / limit) || 1

      const response_data: RainforestSearchResponse = {
        products,
        total,
        page,
        pages,
        cached: false,
      }

      await cache.set(cacheKey, response_data, {
        ttl: CACHE_CONFIG.affiliate.ttl || 3600,
        tags: ['rainforest', 'products'],
      })

      return response_data
    } catch (error) {
      logger.error('Rainforest API error', { error })
      return {
        products: [],
        total: 0,
        page,
        pages: 0,
        cached: false,
      }
    }
  }
}
