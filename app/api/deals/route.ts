import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/utils/rate-limiter'
import { API_CONFIG, CACHE_CONFIG } from '@/lib/config/api-keys'
import { cacheWrap } from '@/lib/api/cache'
import { dealSyncService } from '@/lib/services/deal-sync'

/**
 * Deals API - Fetches from Supabase database first, falls back to RapidAPI
 * Supports both Product Search and ShopSavvy Price Comparison
 */
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 50)
    const query = searchParams.get('query') || undefined
    const useDatabase = searchParams.get('useDatabase') !== 'false'
    const productId = searchParams.get('productId') // For price comparison
    const asin = searchParams.get('asin') // For Amazon product lookup
    const country = searchParams.get('country') || 'us'

    console.log('🔍 [DEALS API] Starting request with params:', { page, limit, query, useDatabase, productId, asin, country })

    // Fetch from database first (default behavior)
    if (useDatabase) {
      try {
        const dbResult = await dealSyncService.searchDeals({
          query,
          limit,
          page
        })

        console.log(`✅ [DEALS API] Found ${dbResult.deals.length} deals in database`)

        if (dbResult.deals.length > 0) {
          return NextResponse.json({
            deals: dbResult.deals,
            pagination: {
              page: dbResult.page,
              limit: dbResult.limit,
              total: dbResult.total,
              pages: dbResult.totalPages
            },
            sources: 'Supabase Database',
            cached: false,
            fromDatabase: true
          }, { status: 200 })
        }

        console.log('⚠️ [DEALS API] No deals in database, falling back to API')
      } catch (dbError) {
        console.error('❌ [DEALS API] Database error, falling back to API:', dbError)
      }
    }

    console.log('🔍 [DEALS API] Fetching from external APIs')

    if (!API_CONFIG.rapidApi.key) {
      console.error('❌ [DEALS API] No RapidAPI key found')
      return NextResponse.json({
        deals: [],
        error: 'RapidAPI key not configured',
        message: 'Please set RAPIDAPI_KEY in .env.local'
      }, { status: 500 })
    }

    console.log('✅ [DEALS API] RapidAPI key found:', API_CONFIG.rapidApi.key.substring(0, 20) + '...')

    // Create cache key based on query parameters
    const cacheKey = `deals:${query}:${asin}:${productId}:${country}:${page}:${limit}`
    console.log('🔑 [DEALS API] Cache key:', cacheKey)

    // Priority 1: If ASIN is provided, use Amazon Real-Time Product API
    if (asin) {
      const amazonUrl = `https://real-time-amazon-data.p.rapidapi.com/product-details?asin=${asin}&country=US`
      
      console.log('🌐 [DEALS API] Calling Amazon Product API:', amazonUrl)

      const response = await fetch(amazonUrl, {
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

      if (product) {
        const deal = {
          id: product.asin,
          title: product.product_title,
          description: product.product_description,
          currentPrice: parseFloat(product.product_price || '0'),
          originalPrice: parseFloat(product.product_original_price?.replace('$', '') || product.product_price || '0'),
          discount: product.product_original_price ? Math.round(((parseFloat(product.product_original_price.replace('$', '')) - parseFloat(product.product_price)) / parseFloat(product.product_original_price.replace('$', ''))) * 100) : 0,
          store: 'Amazon',
          url: product.product_url,
          image: product.product_photo,
          rating: parseFloat(product.product_star_rating || '0'),
          reviews: product.product_num_ratings || 0,
          category: product.category?.name || 'General',
          brand: product.product_details?.Brand,
          availability: product.product_availability,
          condition: product.product_condition,
          isPrime: product.is_prime,
          isBestSeller: product.is_best_seller,
          source: 'amazon-product'
        }

        console.log(`✅ [DEALS API] Found Amazon product`)

        return NextResponse.json({
          deals: [deal],
          pagination: {
            page: 1,
            limit: 1,
            total: 1,
            pages: 1
          },
          sources: 'Amazon Product API',
          asin,
          fromDatabase: false
        }, { status: 200 })
      }
    }

    // Priority 2: Fetch Amazon Deals (if no specific search)
    if (!query && !productId) {
      try {
        const amazonDealsUrl = 'https://real-time-amazon-data.p.rapidapi.com/deals-v2?country=US&min_product_star_rating=ALL&price_range=ALL&discount_range=ALL'
        
        console.log('🌐 [DEALS API] Calling Amazon Deals API')

        const response = await fetch(amazonDealsUrl, {
          headers: {
            'X-RapidAPI-Key': API_CONFIG.rapidApi.key,
            'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com',
          },
        })

        if (response.ok) {
          const data = await response.json()
          const amazonDeals = (data?.data?.deals || []).slice(0, limit).map((deal: any) => ({
            id: deal.product_asin || deal.deal_id,
            title: deal.deal_title,
            currentPrice: parseFloat(deal.deal_price?.amount || '0'),
            originalPrice: parseFloat(deal.list_price?.amount || deal.deal_price?.amount || '0'),
            discount: deal.savings_percentage || 0,
            store: 'Amazon',
            url: deal.deal_url || deal.canonical_deal_url,
            image: deal.deal_photo,
            dealBadge: deal.deal_badge,
            dealType: deal.deal_type,
            source: 'amazon-deals'
          }))

          if (amazonDeals.length > 0) {
            console.log(`✅ [DEALS API] Found ${amazonDeals.length} Amazon deals`)

            return NextResponse.json({
              deals: amazonDeals,
              pagination: {
                page: 1,
                limit: amazonDeals.length,
                total: data?.data?.total_deals || amazonDeals.length,
                pages: 1
              },
              sources: 'Amazon Deals API',
              fromDatabase: false
            }, { status: 200 })
          }
        }
      } catch (error) {
        console.error('❌ [DEALS API] Amazon Deals error:', error)
      }
    }

    // Priority 3: If productId is provided, use ShopSavvy Price Comparison
    if (productId) {
      const priceCompUrl = `https://price-comparison1.p.rapidapi.com/${productId}/offers?latitude=37.777805&longitude=-122.49493&country=US`
      
      console.log('🌐 [DEALS API] Calling ShopSavvy Price Comparison:', priceCompUrl)

      const response = await fetch(priceCompUrl, {
        headers: {
          'X-RapidAPI-Key': API_CONFIG.rapidApi.key,
          'X-RapidAPI-Host': 'price-comparison1.p.rapidapi.com',
        },
      })

      if (!response.ok) {
        throw new Error(`ShopSavvy API returned ${response.status}`)
      }

      const offers = await response.json()
      const deals = (Array.isArray(offers) ? offers : []).map((offer: any) => ({
        id: offer.ID,
        title: offer.ProductName || `Product ${productId}`,
        currentPrice: offer.Price || 0,
        originalPrice: offer.BasePrice || offer.Price,
        discount: offer.BasePrice > offer.Price ? Math.round(((offer.BasePrice - offer.Price) / offer.BasePrice) * 100) : 0,
        store: offer.Retailer?.DisplayName || offer.Merchant || 'Unknown',
        url: offer.Links?.AffiliateLink || offer.Link,
        inStock: offer.InStockStatus === '1',
        quality: offer.Quality,
        source: 'shopsavvy-price-comparison'
      }))

      console.log(`✅ [DEALS API] Found ${deals.length} price comparison offers`)

      return NextResponse.json({
        deals,
        pagination: {
          page: 1,
          limit: deals.length,
          total: deals.length,
          pages: 1
        },
        sources: 'ShopSavvy Price Comparison',
        productId,
        fromDatabase: false
      }, { status: 200 })
    }

    // Use cached data if available
    const cachedDeals = await cacheWrap(cacheKey, CACHE_CONFIG.affiliate.ttl, async () => {
      // Use Real-Time Product Search API from RapidAPI (v2 endpoint)
      const url = new URL('https://real-time-product-search.p.rapidapi.com/search-v2')
      url.searchParams.set('q', query || 'laptop')
      url.searchParams.set('country', country)
      url.searchParams.set('language', 'en')
      url.searchParams.set('limit', limit.toString())
      url.searchParams.set('page', page.toString())
      url.searchParams.set('sort_by', 'BEST_MATCH')
      url.searchParams.set('product_condition', 'ANY')

      console.log('🌐 [DEALS API] Calling RapidAPI:', url.toString())
      console.log('📋 [DEALS API] Headers:', {
        'X-RapidAPI-Key': API_CONFIG.rapidApi.key.substring(0, 20) + '...',
        'X-RapidAPI-Host': 'real-time-product-search.p.rapidapi.com',
      })

      // Add timeout and better error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(url.toString(), {
        headers: {
          'X-RapidAPI-Key': API_CONFIG.rapidApi.key,
          'X-RapidAPI-Host': 'real-time-product-search.p.rapidapi.com',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log('📡 [DEALS API] Response status:', response.status)

      if (!response.ok) {
        const text = await response.text()
        console.error('❌ [DEALS API] RapidAPI error:', response.status, text)
        throw new Error(`API returned ${response.status}: ${text.substring(0, 200)}`)
      }

      const data = await response.json()
      return data
    })

    const data = cachedDeals
    console.log('✅ [DEALS API] Data received:', { 
      hasData: !!data, 
      dataKeys: Object.keys(data),
      dataType: typeof data.data,
      dataIsArray: Array.isArray(data.data),
      productsCount: Array.isArray(data.data) ? data.data.length : 'not an array'
    })
    console.log('📦 [DEALS API] Full data structure:', JSON.stringify(data, null, 2).substring(0, 500))
    
    // Handle different data structures
    let products = []
    if (Array.isArray(data.data)) {
      products = data.data
    } else if (data.data && typeof data.data === 'object' && data.data.products) {
      products = data.data.products
    } else if (data.products) {
      products = data.products
    } else {
      console.warn('⚠️ [DEALS API] Unexpected data structure, using empty array')
    }

    const deals = products.map((p: any, index: number) => {
      const price = parseFloat(p.typical_price_range?.[0] || p.price || '0')
      const originalPrice = parseFloat(p.typical_price_range?.[1] || '0')
      const discount = originalPrice && price && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : Math.floor(Math.random() * 30) + 10 // Random discount for demo

      const rawId = p.product_id || p.product_page_url || p.offer?.offer_page_url || `${p.product_brand || ''}|${p.product_title || p.title || 'product'}|${p.product_category || ''}`
      const stableId = encodeURIComponent(String(rawId))
      return {
        id: stableId,
        title: p.product_title || p.title || 'Product',
        description: p.product_description || '',
        currentPrice: price || 99.99,
        originalPrice: originalPrice || price * 1.5,
        discount: discount,
        rating: p.product_rating || (Math.random() * 1.5 + 3.5).toFixed(1),
        reviews: p.product_num_reviews || Math.floor(Math.random() * 1000),
        store: p.offer?.store_name || 'Online Store',
        image: p.product_photos?.[0] || p.product_photo || '/placeholder.jpg',
        url: p.product_page_url || p.offer?.offer_page_url || '#',
        currency: 'EUR',
        category: p.product_category || 'General',
        brand: p.product_brand,
        source: 'rapidapi',
      }
    })

    console.log(`✅ [DEALS API] Successfully processed ${deals.length} deals`)

    return NextResponse.json({
      deals,
      pagination: {
        page,
        limit,
        total: data.total_results || deals.length,
        pages: Math.ceil((data.total_results || deals.length) / limit) || 1,
      },
      sources: 'RapidAPI Real-Time Product Search',
      query,
      cached: true,
      cacheTtl: `${CACHE_CONFIG.affiliate.ttl} seconds (${Math.round(CACHE_CONFIG.affiliate.ttl / 60)} minutes)`,
    })
  } catch (error) {
    console.error('❌ [DEALS API] Fatal error:', error)
    
    // Check if it's a timeout error
    const isTimeout = error instanceof Error && 
      (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('TIMEOUT'))
    
    return NextResponse.json({ 
      deals: [], 
      pagination: {
        page: 1,
        limit: 0,
        total: 0,
        pages: 0
      },
      error: isTimeout ? 'Request timeout' : 'Failed to load deals',
      message: error instanceof Error ? error.message : 'Unknown error',
      help: isTimeout 
        ? 'The API took too long to respond. Try again or use a simpler search query.'
        : 'Check your internet connection and API credentials.'
    }, { status: 500 })
  }
}

export const GET = withRateLimit(handler, { max: 100, windowMs: 60000 })
