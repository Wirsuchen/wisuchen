import { NextRequest, NextResponse } from 'next/server'
import { API_CONFIG, CACHE_CONFIG } from '@/lib/config/api-keys'
import { cacheWrap } from '@/lib/api/cache'

/**
 * Deals API - Uses RapidAPI Real-Time Product Search
 * This works with your existing RAPIDAPI_KEY
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 20) // Max 20 for faster response
    const query = searchParams.get('query') || 'laptop' // Simple query for better results
    const country = searchParams.get('country') || 'us' // US has better data availability

    console.log('🔍 [DEALS API] Starting request with params:', { page, limit, query, country })

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
    const cacheKey = `deals:${query}:${country}:${page}:${limit}`
    console.log('🔑 [DEALS API] Cache key:', cacheKey)

    // Use cached data if available
    const cachedDeals = await cacheWrap(cacheKey, CACHE_CONFIG.affiliate.ttl, async () => {
      // Use Real-Time Product Search API from RapidAPI (v2 endpoint)
      const url = new URL('https://real-time-product-search.p.rapidapi.com/search-v2')
      url.searchParams.set('q', query)
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

      return {
        id: p.product_id || `deal-${Date.now()}-${index}`,
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
      error: isTimeout ? 'Request timeout' : 'Failed to load deals',
      message: error instanceof Error ? error.message : 'Unknown error',
      help: isTimeout 
        ? 'The API took too long to respond. Try again or use a simpler search query.'
        : 'Check your internet connection and API credentials.'
    }, { status: 500 })
  }
}
