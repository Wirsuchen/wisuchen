/**
 * API Route: Search Jobs
 * GET /api/v1/jobs/search
 * 
 * Aggregates jobs from multiple sources with caching and rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiAggregator } from '@/lib/services/aggregator'
import { logger } from '@/lib/utils/logger'
import { withRateLimit } from '@/lib/utils/rate-limiter'

// Validation schema
const searchJobsSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'freelance', 'internship', 'temporary']).optional(),
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'lead', 'executive']).optional(),
  salaryMin: z.coerce.number().positive().optional(),
  salaryMax: z.coerce.number().positive().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  sources: z.string().optional().transform(val => val?.split(',').filter(Boolean)),
  useCache: z.enum(['true', 'false']).optional().transform(val => val !== 'false'),
  // DACH/location controls
  country: z.enum(['de','at','ch']).optional(),
  countries: z.string().optional().transform(v => v ? v.split(',').map(s => s.trim()).filter(Boolean) : undefined),
  postcodes: z.string().optional().transform(v => v ? v.split(',').map(s => s.trim()).filter(Boolean) : undefined),
  radiusKm: z.coerce.number().positive().optional(),
  distance: z.coerce.number().positive().optional(),
  includeRemote: z.enum(['true','false']).optional().transform(v => v === 'true'),
  isTest: z.enum(['true','false']).optional().transform(v => v === 'true'),
})

async function handler(req: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const validatedParams = searchJobsSchema.parse(params)

    logger.apiRequest('aggregator', 'searchJobs', validatedParams)

    // Normalize DACH params for aggregator
    const countries = validatedParams.countries || (validatedParams.country ? [validatedParams.country] : undefined)
    const radiusKm = validatedParams.radiusKm ?? validatedParams.distance

    // Search jobs
    const result = await apiAggregator.searchJobs({
      query: validatedParams.query,
      location: validatedParams.location,
      employmentType: validatedParams.employmentType,
      experienceLevel: validatedParams.experienceLevel,
      salaryMin: validatedParams.salaryMin,
      salaryMax: validatedParams.salaryMax,
      page: validatedParams.page,
      limit: validatedParams.limit,
      sources: validatedParams.sources as any,
      useCache: validatedParams.useCache,
      includeRemote: validatedParams.includeRemote,
      radiusKm,
      countries,
      postcodes: validatedParams.postcodes as any,
      // Pass testing flag through for sandboxing
      isTest: validatedParams.isTest,
    })

    logger.apiResponse('aggregator', 'searchJobs', 0, 200)

    const res = NextResponse.json({
      success: true,
      data: {
        jobs: result.jobs,
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

    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=60')
    return res

  } catch (error: any) {
    logger.apiError('aggregator', 'searchJobs', error)

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
