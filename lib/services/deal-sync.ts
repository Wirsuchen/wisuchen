/**
 * Deal Sync Service
 * Syncs deals from external APIs to Supabase database
 * Incrementally builds a persistent deal repository
 */

import { createClient } from '@supabase/supabase-js'
import { API_CONFIG } from '@/lib/config/api-keys'
import { logger } from '@/lib/utils/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface DealSyncStats {
  total: number
  new: number
  updated: number
  skipped: number
  errors: number
}

export class DealSyncService {
  private supabase

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey)
  }

  /**
   * Sync deals from all sources to database
   */
  async syncAllDeals(params?: {
    query?: string
    limit?: number
    productIds?: string[]
    asins?: string[]
  }): Promise<DealSyncStats> {
    const stats: DealSyncStats = {
      total: 0,
      new: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    }

    try {
      console.log('🔄 [DealSync] Starting deal sync...')

      // Priority 1: Fetch from Amazon Real-Time Deals (Best source)
      try {
        const amazonDeals = await this.fetchAmazonDeals()
        console.log(`📦 [DealSync] Fetched ${amazonDeals.length} deals from Amazon`)
        
        for (const deal of amazonDeals) {
          try {
            const result = await this.upsertDeal(deal)
            stats.total++
            if (result === 'new') stats.new++
            else if (result === 'updated') stats.updated++
            else stats.skipped++
          } catch (error) {
            stats.errors++
            console.error(`❌ [DealSync] Error syncing Amazon deal:`, error)
          }
        }
      } catch (error) {
        console.error('❌ [DealSync] Amazon deals fetch failed:', error)
        stats.errors++
      }

      // Priority 2: Fetch specific Amazon products by ASIN
      if (params?.asins && params.asins.length > 0) {
        for (const asin of params.asins) {
          try {
            const productDeal = await this.fetchAmazonProduct(asin)
            if (productDeal) {
              const result = await this.upsertDeal(productDeal)
              stats.total++
              if (result === 'new') stats.new++
              else if (result === 'updated') stats.updated++
              else stats.skipped++
            }
          } catch (error) {
            stats.errors++
            console.error(`❌ [DealSync] Error syncing Amazon product ${asin}:`, error)
          }
        }
      }

      // Priority 3: Fetch from RapidAPI Real-Time Product Search
      const productSearchDeals = await this.fetchRapidAPIProductSearch(params?.query || 'laptop', params?.limit || 50)
      
      for (const deal of productSearchDeals) {
        try {
          const result = await this.upsertDeal(deal)
          stats.total++
          if (result === 'new') stats.new++
          else if (result === 'updated') stats.updated++
          else stats.skipped++
        } catch (error) {
          stats.errors++
          console.error(`❌ [DealSync] Error syncing deal ${deal.id}:`, error)
        }
      }

      // Fetch from ShopSavvy Price Comparison
      if (params?.productIds && params.productIds.length > 0) {
        for (const productId of params.productIds) {
          try {
            const priceCompDeals = await this.fetchShopSavvyPriceComparison(productId)
            
            for (const deal of priceCompDeals) {
              try {
                const result = await this.upsertDeal(deal)
                stats.total++
                if (result === 'new') stats.new++
                else if (result === 'updated') stats.updated++
                else stats.skipped++
              } catch (error) {
                stats.errors++
                console.error(`❌ [DealSync] Error syncing price comparison deal:`, error)
              }
            }
          } catch (error) {
            stats.errors++
            console.error(`❌ [DealSync] Error fetching ShopSavvy for product ${productId}:`, error)
          }
        }
      }

      console.log('✅ [DealSync] Sync complete:', stats)
      return stats

    } catch (error) {
      console.error('❌ [DealSync] Fatal sync error:', error)
      throw error
    }
  }

  /**
   * Fetch deals from Amazon Real-Time Deals API
   */
  private async fetchAmazonDeals(): Promise<any[]> {
    try {
      const url = 'https://real-time-amazon-data.p.rapidapi.com/deals-v2?country=US&min_product_star_rating=ALL&price_range=ALL&discount_range=ALL'

      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': API_CONFIG.rapidApi.key,
          'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com',
        },
      })

      if (!response.ok) {
        throw new Error(`Amazon API returned ${response.status}`)
      }

      const data = await response.json()
      const deals = data?.data?.deals || []

      return deals.map((deal: any) => ({
        id: deal.product_asin || deal.deal_id,
        title: deal.deal_title || 'Amazon Deal',
        description: deal.deal_title || '',
        currentPrice: parseFloat(deal.deal_price?.amount || '0'),
        originalPrice: parseFloat(deal.list_price?.amount || deal.deal_price?.amount || '0'),
        image: deal.deal_photo,
        url: deal.deal_url || deal.canonical_deal_url,
        store: 'Amazon',
        category: 'General',
        brand: 'Amazon',
        rating: 0,
        reviews: 0,
        discount: deal.savings_percentage || 0,
        dealBadge: deal.deal_badge,
        dealType: deal.deal_type,
        dealState: deal.deal_state,
        source: 'amazon-deals'
      }))
    } catch (error) {
      console.error('Error fetching Amazon Deals:', error)
      return []
    }
  }

  /**
   * Fetch product details from Amazon Real-Time Product API
   */
  private async fetchAmazonProduct(asin: string): Promise<any | null> {
    try {
      const url = `https://real-time-amazon-data.p.rapidapi.com/product-details?asin=${asin}&country=US`

      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': API_CONFIG.rapidApi.key,
          'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com',
        },
      })

      if (!response.ok) {
        throw new Error(`Amazon Product API returned ${response.status}`)
      }

      const result = await response.json()
      const product = result?.data

      if (!product) return null

      return {
        id: product.asin,
        title: product.product_title || 'Amazon Product',
        description: product.product_description || '',
        currentPrice: parseFloat(product.product_price || '0'),
        originalPrice: parseFloat(product.product_original_price?.replace('$', '') || product.product_price || '0'),
        image: product.product_photo,
        url: product.product_url,
        store: 'Amazon',
        category: product.category?.name || 'General',
        brand: product.product_details?.Brand || 'Amazon',
        rating: parseFloat(product.product_star_rating || '0'),
        reviews: product.product_num_ratings || 0,
        availability: product.product_availability,
        condition: product.product_condition,
        isPrime: product.is_prime,
        isBestSeller: product.is_best_seller,
        source: 'amazon-product'
      }
    } catch (error) {
      console.error(`Error fetching Amazon product ${asin}:`, error)
      return null
    }
  }

  /**
   * Fetch deals from RapidAPI Real-Time Product Search
   */
  private async fetchRapidAPIProductSearch(query: string, limit: number): Promise<any[]> {
    try {
      const url = new URL('https://real-time-product-search.p.rapidapi.com/search-v2')
      url.searchParams.set('q', query)
      url.searchParams.set('country', 'us')
      url.searchParams.set('language', 'en')
      url.searchParams.set('limit', limit.toString())
      url.searchParams.set('page', '1')

      const response = await fetch(url.toString(), {
        headers: {
          'X-RapidAPI-Key': API_CONFIG.rapidApi.key,
          'X-RapidAPI-Host': 'real-time-product-search.p.rapidapi.com',
        },
      })

      if (!response.ok) {
        // Handle rate limiting gracefully
        if (response.status === 429) {
          console.warn('⚠️ [DealSync] RapidAPI rate limit reached (429). Skipping this source.')
          return []
        }
        throw new Error(`RapidAPI returned ${response.status}`)
      }

      const data = await response.json()
      const products = Array.isArray(data.data) ? data.data : []

      return products.map((p: any) => {
        const price = parseFloat(p.typical_price_range?.[0] || p.price || '0')
        const originalPrice = parseFloat(p.typical_price_range?.[1] || '0')
        
        return {
          id: p.product_id || `rapidapi-${Date.now()}-${Math.random()}`,
          title: p.product_title || p.title || 'Product',
          description: p.product_description || '',
          currentPrice: price || 99.99,
          originalPrice: originalPrice || price * 1.5,
          image: p.product_photos?.[0] || p.product_photo || null,
          url: p.product_page_url || p.offer?.offer_page_url,
          store: p.offer?.store_name || 'Online Store',
          category: p.product_category || 'General',
          brand: p.product_brand,
          rating: p.product_rating || 0,
          reviews: p.product_num_reviews || 0,
          source: 'rapidapi-product-search'
        }
      })
    } catch (error) {
      console.error('Error fetching RapidAPI Product Search:', error)
      return []
    }
  }

  /**
   * Fetch deals from ShopSavvy Price Comparison API
   */
  private async fetchShopSavvyPriceComparison(productId: string): Promise<any[]> {
    try {
      const url = `https://price-comparison1.p.rapidapi.com/${productId}/offers?latitude=37.777805&longitude=-122.49493&country=US`

      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': API_CONFIG.rapidApi.key,
          'X-RapidAPI-Host': 'price-comparison1.p.rapidapi.com',
        },
      })

      if (!response.ok) {
        throw new Error(`ShopSavvy API returned ${response.status}`)
      }

      const data = await response.json()
      const offers = Array.isArray(data) ? data : []

      return offers.map((offer: any) => ({
        id: offer.ID || `shopsavvy-${productId}-${Math.random()}`,
        title: offer.ProductName || `Product ${productId}`,
        description: '',
        currentPrice: offer.Price || 0,
        originalPrice: offer.BasePrice || offer.Price,
        image: null,
        url: offer.Links?.AffiliateLink || offer.Link || '#',
        store: offer.Retailer?.DisplayName || offer.Merchant || 'Unknown Store',
        category: 'General',
        brand: null,
        rating: 0,
        reviews: 0,
        inStock: offer.InStockStatus === '1',
        quality: offer.Quality,
        source: 'shopsavvy-price-comparison',
        externalProductId: productId
      }))
    } catch (error) {
      console.error(`Error fetching ShopSavvy for product ${productId}:`, error)
      return []
    }
  }

  /**
   * Insert or update a deal in the database
   */
  private async upsertDeal(deal: any): Promise<'new' | 'updated' | 'skipped'> {
    try {
      // Check if deal already exists
      const { data: existing } = await this.supabase
        .from('offers')
        .select('id, updated_at')
        .eq('external_id', deal.id)
        .eq('source', deal.source)
        .eq('type', 'affiliate')
        .single()

      const discount = deal.originalPrice && deal.currentPrice
        ? Math.round(((deal.originalPrice - deal.currentPrice) / deal.originalPrice) * 100)
        : 0

      const dealData = {
        title: deal.title,
        slug: this.generateSlug(deal.title, deal.id),
        description: deal.description || '',
        short_description: deal.description?.substring(0, 200) || '',
        type: 'affiliate',
        status: 'active',
        price: deal.currentPrice,
        affiliate_url: deal.url,
        commission_rate: null,
        discount_code: null,
        featured_image_url: deal.image,
        source: deal.source,
        external_id: deal.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (existing) {
        // Update existing deal
        const { error } = await this.supabase
          .from('offers')
          .update(dealData)
          .eq('id', existing.id)

        if (error) throw error
        return 'updated'
      } else {
        // Insert new deal
        const { error } = await this.supabase
          .from('offers')
          .insert([dealData])

        if (error) {
          // If unique constraint violation, skip
          if (error.code === '23505') {
            return 'skipped'
          }
          throw error
        }
        return 'new'
      }
    } catch (error: any) {
      // Handle duplicate key errors gracefully
      if (error.code === '23505') {
        return 'skipped'
      }
      throw error
    }
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(title: string, id: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100)
    return `${slug}-${id.substring(0, 8)}`
  }

  /**
   * Get total deal count from database
   */
  async getTotalDealCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'affiliate')
      .eq('status', 'active')

    if (error) {
      console.error('Error getting deal count:', error)
      return 0
    }

    return count || 0
  }

  /**
   * Search deals from database
   */
  async searchDeals(params: {
    query?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    limit?: number
    page?: number
  }) {
    let query = this.supabase
      .from('offers')
      .select('*', { count: 'exact' })
      .eq('type', 'affiliate')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (params.query) {
      query = query.or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`)
    }

    if (params.minPrice) {
      query = query.gte('price', params.minPrice)
    }

    if (params.maxPrice) {
      query = query.lte('price', params.maxPrice)
    }

    const page = params.page || 1
    const limit = params.limit || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error searching deals:', error)
      throw error
    }

    return {
      deals: (data || []).map((d: any) => ({
        id: d.external_id || d.id,
        title: d.title,
        description: d.description,
        currentPrice: d.price,
        originalPrice: d.price * 1.3, // Estimate if not stored
        discount: 25, // Estimate
        image: d.featured_image_url,
        url: d.affiliate_url,
        store: d.source,
        category: 'General',
        rating: 4.5,
        reviews: 0,
        source: d.source
      })),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}

export const dealSyncService = new DealSyncService()
