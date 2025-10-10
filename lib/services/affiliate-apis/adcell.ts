// Adcell Affiliate API Integration
import { API_CONFIG } from '@/lib/config/api-keys'

export interface AdcellOffer {
  id: string
  title: string
  description: string
  advertiser: {
    id: string
    name: string
    logo?: string
  }
  commission: {
    rate: number
    type: 'percentage' | 'fixed'
    currency: string
  }
  tracking_url: string
  landing_page_url: string
  image_urls: string[]
  category: string
  price?: number
  old_price?: number
  discount_percentage?: number
  coupon_code?: string
  valid_from?: string
  valid_until?: string
  terms_and_conditions?: string
  shipping_costs?: number
  availability: string
  brand?: string
  ean?: string
}

export interface AdcellSearchParams {
  program_id?: string[]
  category?: string
  search_term?: string
  min_price?: number
  max_price?: number
  brand?: string
  has_coupon?: boolean
  on_sale?: boolean
  page?: number
  per_page?: number
  sort_by?: 'price' | 'commission' | 'popularity' | 'newest'
  sort_order?: 'asc' | 'desc'
}

export class AdcellAPI {
  private baseUrl: string
  private login: string
  private password: string

  constructor() {
    this.baseUrl = API_CONFIG.adcell.baseUrl
    this.login = API_CONFIG.adcell.login
    this.password = API_CONFIG.adcell.password
  }

  private getAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.login}:${this.password}`).toString('base64')
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}/${endpoint}`)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(','))
        } else {
          url.searchParams.append(key, value.toString())
        }
      }
    })

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
        'User-Agent': 'TalentPlus/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Adcell API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getPrograms(params: {
    status?: 'active' | 'inactive' | 'pending'
    category?: string
    page?: number
    per_page?: number
  } = {}): Promise<any[]> {
    try {
      const data = await this.makeRequest('programs', params)
      return data.programs || data.data || []
    } catch (error) {
      console.error('Adcell programs API error:', error)
      throw error
    }
  }

  async getProgramDetails(programId: string): Promise<any> {
    try {
      const data = await this.makeRequest(`programs/${programId}`)
      return data.program || data
    } catch (error) {
      console.error('Adcell program details API error:', error)
      throw error
    }
  }

  async getProducts(params: AdcellSearchParams = {}): Promise<AdcellOffer[]> {
    try {
      const data = await this.makeRequest('products', {
        program_id: params.program_id,
        category: params.category,
        q: params.search_term,
        price_min: params.min_price,
        price_max: params.max_price,
        brand: params.brand,
        has_coupon: params.has_coupon,
        on_sale: params.on_sale,
        page: params.page || 1,
        per_page: Math.min(params.per_page || 50, 100),
        sort: params.sort_by || 'popularity',
        order: params.sort_order || 'desc'
      })

      const products = data.products || data.data || []
      
      return products.map((product: any) => ({
        id: product.id || product.product_id,
        title: product.name || product.title,
        description: product.description || product.short_description || '',
        advertiser: {
          id: product.program_id || product.advertiser_id,
          name: product.program_name || product.advertiser_name || 'Unknown',
          logo: product.program_logo || product.advertiser_logo
        },
        commission: {
          rate: product.commission_rate || product.commission || 0,
          type: product.commission_type || 'percentage',
          currency: product.currency || 'EUR'
        },
        tracking_url: product.tracking_url || product.affiliate_url,
        landing_page_url: product.product_url || product.landing_url,
        image_urls: product.images || [product.image_url].filter(Boolean),
        category: product.category || product.category_name || 'General',
        price: parseFloat(product.price || product.current_price || 0),
        old_price: parseFloat(product.old_price || product.original_price || 0),
        discount_percentage: product.discount_percentage || product.discount,
        coupon_code: product.coupon_code || product.voucher_code,
        valid_from: product.valid_from || product.start_date,
        valid_until: product.valid_until || product.end_date,
        terms_and_conditions: product.terms || product.conditions,
        shipping_costs: parseFloat(product.shipping_costs || 0),
        availability: product.availability || product.stock_status || 'available',
        brand: product.brand || product.manufacturer,
        ean: product.ean || product.gtin
      }))
    } catch (error) {
      console.error('Adcell products API error:', error)
      throw error
    }
  }

  async getCategories(): Promise<Array<{ id: string; name: string; parent_id?: string }>> {
    try {
      const data = await this.makeRequest('categories')
      return data.categories || data.data || []
    } catch (error) {
      console.error('Adcell categories API error:', error)
      throw error
    }
  }

  async getStatistics(params: {
    program_id?: string
    start_date: string // YYYY-MM-DD
    end_date: string // YYYY-MM-DD
    group_by?: 'day' | 'week' | 'month'
  }): Promise<any> {
    try {
      const data = await this.makeRequest('statistics', params)
      return data.statistics || data
    } catch (error) {
      console.error('Adcell statistics API error:', error)
      throw error
    }
  }

  async generateTrackingLink(params: {
    program_id: string
    product_url: string
    sub_id?: string
    custom_params?: Record<string, string>
  }): Promise<string> {
    try {
      const data = await this.makeRequest('tracking/generate', params)
      return data.tracking_url || data.url
    } catch (error) {
      console.error('Adcell tracking link API error:', error)
      throw error
    }
  }

  // Search for offers with advanced filtering
  async searchOffers(params: AdcellSearchParams): Promise<AdcellOffer[]> {
    try {
      // Get active programs first
      const programs = await this.getPrograms({ status: 'active' })
      
      let targetPrograms = programs
      if (params.program_id?.length) {
        targetPrograms = programs.filter(program => 
          params.program_id!.includes(program.id.toString())
        )
      }

      const allOffers: AdcellOffer[] = []

      // Get products from each program
      for (const program of targetPrograms.slice(0, 10)) { // Limit to avoid rate limits
        try {
          const offers = await this.getProducts({
            ...params,
            program_id: [program.id]
          })
          allOffers.push(...offers)
        } catch (error) {
          console.error(`Error fetching products for program ${program.id}:`, error)
        }
      }

      return allOffers
    } catch (error) {
      console.error('Adcell search offers error:', error)
      throw error
    }
  }
}

// Transform Adcell offer to our database format
export function transformAdcellOffer(offer: AdcellOffer): any {
  return {
    title: offer.title,
    description: offer.description,
    short_description: offer.description.substring(0, 500),
    type: 'affiliate',
    status: 'active',
    affiliate_url: offer.tracking_url,
    commission_rate: offer.commission.rate,
    price: offer.price,
    discount_code: offer.coupon_code,
    featured_image_url: offer.image_urls[0],
    gallery_urls: offer.image_urls,
    source: 'adcell',
    external_id: offer.id,
    published_at: offer.valid_from ? new Date(offer.valid_from).toISOString() : new Date().toISOString(),
    expires_at: offer.valid_until ? new Date(offer.valid_until).toISOString() : null,
    company_name: offer.advertiser.name,
    category_name: offer.category,
    requirements: offer.terms_and_conditions,
    // Additional metadata
    metadata: {
      brand: offer.brand,
      ean: offer.ean,
      old_price: offer.old_price,
      discount_percentage: offer.discount_percentage,
      shipping_costs: offer.shipping_costs,
      availability: offer.availability
    }
  }
}
