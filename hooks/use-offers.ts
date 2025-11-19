/**
 * Custom hook for fetching and managing affiliate offers
 * Provides loading states, error handling, and automatic retries
 * Uses client-side cache to prevent unnecessary API calls on route changes
 */

import { useState, useEffect, useCallback } from 'react'
import { fetchWithCache } from '@/lib/utils/client-cache'

export interface Offer {
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
}

export interface SearchOffersParams {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  onSale?: boolean
  page?: number
  limit?: number
  sources?: string[]
  useCache?: boolean
}

interface OffersResponse {
  offers: Offer[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  meta: {
    sources: Record<string, number>
    cached: boolean
    timestamp: string
  }
}

interface UseOffersReturn {
  offers: Offer[]
  pagination: OffersResponse['pagination'] | null
  meta: OffersResponse['meta'] | null
  loading: boolean
  error: string | null
  search: (params: SearchOffersParams) => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Hook to search and fetch affiliate offers
 */
export function useOffers(initialParams?: SearchOffersParams): UseOffersReturn {
  const [offers, setOffers] = useState<Offer[]>([])
  const [pagination, setPagination] = useState<OffersResponse['pagination'] | null>(null)
  const [meta, setMeta] = useState<OffersResponse['meta'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastParams, setLastParams] = useState<SearchOffersParams | undefined>(initialParams)

  const search = useCallback(async (params: SearchOffersParams) => {
    setLoading(true)
    setError(null)
    setLastParams(params)

    try {
      // Build query string
      const queryParams = new URLSearchParams()
      
      if (params.query) queryParams.append('query', params.query)
      if (params.category) queryParams.append('category', params.category)
      if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString())
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString())
      if (params.onSale !== undefined) queryParams.append('onSale', params.onSale.toString())
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sources?.length) queryParams.append('sources', params.sources.join(','))
      if (params.useCache !== undefined) queryParams.append('useCache', params.useCache.toString())

      const url = `/api/v1/offers/search?${queryParams.toString()}`
      
      // Use cache with 1 hour TTL - prevents API calls on route changes/refreshes
      const data = await fetchWithCache<any>(url, undefined, params, 60 * 60 * 1000)

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch offers')
      }

      setOffers(data.data.offers)
      setPagination(data.data.pagination)
      setMeta(data.data.meta)
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while fetching offers'
      setError(errorMessage)
      console.error('Offers fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (lastParams) {
      await search(lastParams)
    }
  }, [lastParams, search])

  // Auto-fetch on mount if initial params provided
  useEffect(() => {
    if (initialParams) {
      search(initialParams)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    offers,
    pagination,
    meta,
    loading,
    error,
    search,
    refresh
  }
}

/**
 * Hook to fetch a single offer by ID
 */
export function useOffer(offerId: string | null) {
  const [offer, setOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!offerId) {
      setOffer(null)
      return
    }

    const fetchOffer = async () => {
      setLoading(true)
      setError(null)

      try {
        const url = `/api/v1/offers/${offerId}`
        
        // Use cache with 1 hour TTL
        const data = await fetchWithCache<any>(url, undefined, { offerId }, 60 * 60 * 1000)

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch offer')
        }

        setOffer(data.data)
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching offer')
        console.error('Offer fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOffer()
  }, [offerId])

  return { offer, loading, error }
}

/**
 * Hook to track affiliate link clicks
 */
export function useTrackAffiliateClick() {
  const trackClick = useCallback(async (offerId: string, affiliateUrl: string) => {
    try {
      // Track click analytics
      await fetch('/api/v1/analytics/affiliate-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, url: affiliateUrl })
      })

      // Navigate to affiliate link in current tab
      window.location.href = affiliateUrl
    } catch (error) {
      console.error('Failed to track affiliate click:', error)
      // Still open the link even if tracking fails
      window.location.href = affiliateUrl
    }
  }, [])

  return { trackClick }
}
