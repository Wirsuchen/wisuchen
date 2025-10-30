/**
 * API Route: Price Comparison Search
 * GET /api/v1/prices/search
 * 
 * Uses eBay Browse API (OAuth) for DE/AT/CH marketplaces with currency filter
 * Falls back to RapidAPI deals if eBay credentials are not configured
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withRateLimit } from '@/lib/utils/rate-limiter'
import { logger } from '@/lib/utils/logger'
import { searchEbayItems } from '@/lib/services/ebay'
import { rapidApiDeals } from '@/lib/api/rapidapi-deals'

const schema = z.object({
  q: z.string().min(1, 'q is required').optional(),
  market: z.enum(['DE', 'AT', 'CH']).default('DE'),
  limit: z.coerce.number().min(1).max(50).default(20),
  sort: z.string().optional(),
  currency: z.enum(['EUR', 'CHF']).optional(),
})

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())
    const validated = schema.parse(params)

    logger.apiRequest('prices', 'search', validated)

    // Determine currency by market if not provided
    const currency = validated.currency || (validated.market === 'CH' ? 'CHF' : 'EUR')

    // Try eBay first (returns empty if no credentials)
    const ebay = await searchEbayItems({
      q: validated.q || '',
      limit: validated.limit,
      sort: validated.sort,
      market: validated.market,
      currency,
    })

    let payload: any
    let source = 'ebay'

    if (!ebay.items || ebay.items.length === 0) {
      // Fallback to RapidAPI deals
      const deals = await rapidApiDeals.searchDeals({
        query: validated.q,
        limit: validated.limit,
        currency,
      })

      payload = {
        items: deals.deals.map((d) => ({
          id: d.id,
          title: d.title,
          store: d.store,
          price: d.price,
          currency: d.currency || currency,
          image: d.imageUrl,
          url: d.url,
          discountPercentage: d.discountPercentage ?? undefined,
        })),
        total: deals.total,
        cached: deals.cached,
      }
      source = 'rapidapi-deals'
    } else {
      payload = {
        items: ebay.items,
        total: ebay.total,
        cached: false,
      }
    }

    const res = NextResponse.json({
      success: true,
      data: payload,
      meta: {
        source,
        market: validated.market,
        currency,
        timestamp: new Date().toISOString(),
      },
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
      }
    })

    return res
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      }, { status: 400 })
    }

    logger.apiError('prices', 'search', error)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Internal server error',
    }, { status: 500 })
  }
}

export const GET = withRateLimit(handler, { max: 100, windowMs: 60000 })
