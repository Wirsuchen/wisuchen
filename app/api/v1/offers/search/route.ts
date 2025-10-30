/**
 * API Route: Search Affiliate Offers
 * GET /api/v1/offers/search
 * 
 * Aggregates affiliate offers from multiple sources
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiAggregator } from '@/lib/services/aggregator'
import { logger } from '@/lib/utils/logger'
import { withRateLimit } from '@/lib/utils/rate-limiter'

// Validation schema
const searchOffersSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  onSale: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  sources: z.string().optional().transform(val => val?.split(',').filter(Boolean)),
  useCache: z.enum(['true', 'false']).optional().transform(val => val !== 'false')
})

async function handler(req: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validatedParams = searchOffersSchema.parse(params)

    logger.apiRequest('aggregator', 'searchOffers', validatedParams)

    // Search offers
    const result = await apiAggregator.searchOffers(validatedParams)

    logger.apiResponse('aggregator', 'searchOffers', 0, 200)

    return NextResponse.json({
      success: true,
      data: {
        offers: result.offers,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / validatedParams.limit)
        },
        meta: {
          sources: result.sources,
          cached: result.cached,
          timestamp: new Date().toISOString()
        }
      }
    }, { status: 200 })

  } catch (error: any) {
    logger.apiError('aggregator', 'searchOffers', error)

    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }

    // Generic errors
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: error.statusCode || 500 })
  }
}

// Apply rate limiting
export const GET = withRateLimit(handler, { max: 100, windowMs: 60000 })
