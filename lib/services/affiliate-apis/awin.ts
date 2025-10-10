// Awin Affiliate API Integration
import { API_CONFIG } from '@/lib/config/api-keys'

export interface AwinOffer {
  id: string
  title: string
  description: string
  advertiser: {
    id: string
    name: string
  }
  commission: {
    amount: number
    type: string
    currency: string
  }
  tracking_url: string
  deep_link_url: string
  image_url?: string
  category: string
  price?: number
  discount?: string
  valid_from?: string
  valid_to?: string
  terms?: string
}

export interface AwinSearchParams {
  advertiser_ids?: string[]
  category?: string
  keywords?: string
  min_commission?: number
  max_commission?: number
  currency?: string
  region?: string
  limit?: number
  offset?: number
}

export class AwinAPI {
  private baseUrl: string
  private oauthToken: string

  constructor() {
    this.baseUrl = API_CONFIG.awin.baseUrl
    this.oauthToken = API_CONFIG.awin.oauthToken
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}/${API_CONFIG.awin.apiVersion}/${endpoint}`)
    
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
        'Authorization': `Bearer ${this.oauthToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TalentPlus/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Awin API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getAdvertisers(params: {
    relationship_status?: 'joined' | 'pending' | 'declined'
    limit?: number
    offset?: number
  } = {}): Promise<any[]> {
    try {
      const data = await this.makeRequest('advertisers', params)
      return data.advertisers || []
    } catch (error) {
      console.error('Awin advertisers API error:', error)
      throw error
    }
  }

  async getCommissionGroups(advertiserId: string): Promise<any[]> {
    try {
      const data = await this.makeRequest(`advertisers/${advertiserId}/commissiongroups`)
      return data.commissionGroups || []
    } catch (error) {
      console.error('Awin commission groups API error:', error)
      throw error
    }
  }

  async getCreatives(params: {
    advertiser_id?: string
    type?: 'banner' | 'text' | 'video' | 'product'
    size?: string
    language?: string
    limit?: number
    offset?: number
  } = {}): Promise<any[]> {
    try {
      const data = await this.makeRequest('creatives', params)
      return data.creatives || []
    } catch (error) {
      console.error('Awin creatives API error:', error)
      throw error
    }
  }

  async getProductFeeds(advertiserId: string): Promise<any[]> {
    try {
      const data = await this.makeRequest(`advertisers/${advertiserId}/productfeeds`)
      return data.productFeeds || []
    } catch (error) {
      console.error('Awin product feeds API error:', error)
      throw error
    }
  }

  async getTransactions(params: {
    start_date: string // YYYY-MM-DD
    end_date: string // YYYY-MM-DD
    advertiser_id?: string
    status?: 'pending' | 'approved' | 'declined'
    limit?: number
    offset?: number
  }): Promise<any[]> {
    try {
      const data = await this.makeRequest('transactions', params)
      return data.transactions || []
    } catch (error) {
      console.error('Awin transactions API error:', error)
      throw error
    }
  }

  async generateTrackingLink(params: {
    advertiser_id: string
    deep_link_url: string
    campaign_ref?: string
  }): Promise<string> {
    try {
      const data = await this.makeRequest('links/generate', params)
      return data.tracking_url || data.url
    } catch (error) {
      console.error('Awin tracking link API error:', error)
      throw error
    }
  }

  // Search for offers across multiple advertisers
  async searchOffers(params: AwinSearchParams): Promise<AwinOffer[]> {
    try {
      // Get advertisers first
      const advertisers = await this.getAdvertisers({ relationship_status: 'joined' })
      
      let filteredAdvertisers = advertisers
      if (params.advertiser_ids?.length) {
        filteredAdvertisers = advertisers.filter(adv => 
          params.advertiser_ids!.includes(adv.id.toString())
        )
      }

      const offers: AwinOffer[] = []

      // Get creatives/offers from each advertiser
      for (const advertiser of filteredAdvertisers.slice(0, params.limit || 10)) {
        try {
          const creatives = await this.getCreatives({
            advertiser_id: advertiser.id,
            limit: 50
          })

          const advertiserOffers = creatives.map(creative => ({
            id: creative.id,
            title: creative.name || creative.alt_text || 'Affiliate Offer',
            description: creative.description || creative.alt_text || '',
            advertiser: {
              id: advertiser.id,
              name: advertiser.name
            },
            commission: {
              amount: creative.commission_amount || 0,
              type: creative.commission_type || 'percentage',
              currency: 'EUR'
            },
            tracking_url: creative.tracking_url || '',
            deep_link_url: creative.click_url || '',
            image_url: creative.image_url,
            category: advertiser.category || 'General',
            terms: creative.terms
          }))

          offers.push(...advertiserOffers)
        } catch (error) {
          console.error(`Error fetching creatives for advertiser ${advertiser.id}:`, error)
        }
      }

      // Filter by keywords if provided
      if (params.keywords) {
        const keywords = params.keywords.toLowerCase()
        return offers.filter(offer => 
          offer.title.toLowerCase().includes(keywords) ||
          offer.description.toLowerCase().includes(keywords) ||
          offer.advertiser.name.toLowerCase().includes(keywords)
        )
      }

      return offers
    } catch (error) {
      console.error('Awin search offers error:', error)
      throw error
    }
  }
}

// Transform Awin offer to our database format
export function transformAwinOffer(offer: AwinOffer): any {
  return {
    title: offer.title,
    description: offer.description,
    short_description: offer.description.substring(0, 500),
    type: 'affiliate',
    status: 'active',
    affiliate_url: offer.tracking_url || offer.deep_link_url,
    commission_rate: offer.commission.amount,
    price: offer.price,
    discount_code: offer.discount,
    featured_image_url: offer.image_url,
    source: 'awin',
    external_id: offer.id,
    published_at: offer.valid_from ? new Date(offer.valid_from).toISOString() : new Date().toISOString(),
    expires_at: offer.valid_to ? new Date(offer.valid_to).toISOString() : null,
    company_name: offer.advertiser.name,
    category_name: offer.category,
    requirements: offer.terms
  }
}
