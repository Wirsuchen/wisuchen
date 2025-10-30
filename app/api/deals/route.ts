import { NextRequest, NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/config/api-keys'
import { rapidApiDeals } from '@/lib/api/rapidapi-deals'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const query = searchParams.get('query') || undefined
    const category = searchParams.get('category') || undefined

    const resp = await rapidApiDeals.searchDeals({ query, category, page, limit })
    const deals = resp.deals.map((d) => ({
      id: d.id,
      title: d.title,
      currentPrice: d.price ?? 0,
      originalPrice: d.originalPrice ?? null,
      discount: d.discountPercentage ?? null,
      rating: d.rating ?? null,
      reviews: d.reviewsCount ?? null,
      store: d.store,
      image: d.imageUrl,
      url: d.url,
      currency: d.currency ?? 'EUR',
      source: 'rapidapi',
    }))

    return NextResponse.json({
      deals,
      pagination: {
        page,
        limit,
        total: resp.total ?? deals.length,
        pages: resp.pages ?? 1,
      },
      provider: resp.sourceHost || API_CONFIG.rapidApi.host || null,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Deals API error:', error)
    return NextResponse.json({ deals: [], error: 'Failed to load deals' }, { status: 500 })
  }
}


