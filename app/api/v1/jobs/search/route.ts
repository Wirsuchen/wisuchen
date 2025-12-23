/**
 * API Route: Search Jobs
 * GET /api/v1/jobs/search
 *
 * Aggregates jobs from multiple sources with caching and rate limiting
 */

import {NextRequest, NextResponse} from "next/server"
import {z} from "zod"
import {apiAggregator} from "@/lib/services/aggregator"
import {jobSyncService} from "@/lib/services/job-sync"
import {translationService} from "@/lib/services/translation-service"
import {logger} from "@/lib/utils/logger"
import {withRateLimit} from "@/lib/utils/rate-limiter"

// Validation schema
const searchJobsSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  employmentType: z
    .enum([
      "full_time",
      "part_time",
      "contract",
      "freelance",
      "internship",
      "temporary",
    ])
    .optional(),
  experienceLevel: z
    .enum(["junior", "mid", "senior", "lead", "executive"])
    .optional(),
  salaryMin: z.coerce.number().positive().optional(),
  salaryMax: z.coerce.number().positive().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(500).default(100),
  sources: z
    .string()
    .optional()
    .transform(val => val?.split(",").filter(Boolean)),
  useCache: z
    .enum(["true", "false"])
    .optional()
    .transform(val => val !== "false"),
  useDatabase: z
    .enum(["true", "false"])
    .optional()
    .transform(val => val !== "false"),
  // DACH/location controls
  country: z.enum(["de", "at", "ch"]).optional(),
  countries: z
    .string()
    .optional()
    .transform(v =>
      v
        ? v
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
        : undefined
    ),
  postcodes: z
    .string()
    .optional()
    .transform(v =>
      v
        ? v
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
        : undefined
    ),
  radiusKm: z.coerce.number().positive().optional(),
  distance: z.coerce.number().positive().optional(),
  includeRemote: z
    .enum(["true", "false"])
    .optional()
    .transform(v => v === "true"),
  isTest: z
    .enum(["true", "false"])
    .optional()
    .transform(v => v === "true"),
  locale: z.enum(["en", "de", "fr", "it"]).optional().default("en"),
})

async function handler(req: NextRequest) {
  try {
    // Parse and validate query parameters
    const {searchParams} = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())

    const validatedParams = searchJobsSchema.parse(params)

    logger.apiRequest("aggregator", "searchJobs", validatedParams)

    // Normalize DACH params
    const countries =
      validatedParams.countries ||
      (validatedParams.country ? [validatedParams.country] : undefined)
    const radiusKm = validatedParams.radiusKm ?? validatedParams.distance

    // Fetch from database (default behavior)
    if (validatedParams.useDatabase !== false) {
      try {
        const dbResult = await jobSyncService.searchJobs({
          query: validatedParams.query,
          location: validatedParams.location,
          employmentType: validatedParams.employmentType,
          experienceLevel: validatedParams.experienceLevel,
          limit: validatedParams.limit,
          page: validatedParams.page,
          locale: validatedParams.locale,
        })

        logger.apiResponse("database", "searchJobs", 0, 200)

        // Calculate source breakdown from jobs
        const sourcesCounts: Record<string, number> = {}
        dbResult.jobs.forEach((job: any) => {
          const source = job.source || "unknown"
          sourcesCounts[source] = (sourcesCounts[source] || 0) + 1
        })

        let mappedJobs = dbResult.jobs.map((job: any) => ({
          id: job.id,
          externalId: job.external_id,
          title: job.title,
          description: job.description,
          // Prefer real company name when available; otherwise omit
          company: (job as any).company?.name || "",
          location: job.location,
          salary: {
            min: job.salary_min,
            max: job.salary_max,
            currency: job.salary_currency,
            text:
              job.salary_min && job.salary_max
                ? `€${job.salary_min}-€${job.salary_max}`
                : undefined,
          },
          employmentType: job.employment_type,
          experienceLevel: job.experience_level,
          skills: job.skills || [],
          applicationUrl: job.application_url,
          source: job.source,
          publishedAt: job.published_at,
        }))

        // Always apply translations - works for all languages including English
        // (source content may be in German/French and need translation to English)
        if (validatedParams.locale) {
          mappedJobs = await translationService.translateJobs(
            mappedJobs,
            validatedParams.locale
          )
        }

        const res = NextResponse.json(
          {
            success: true,
            data: {
              jobs: mappedJobs,
              pagination: {
                page: dbResult.page,
                limit: dbResult.limit,
                total: dbResult.total,
                totalPages: dbResult.totalPages,
              },
              meta: {
                sources: sourcesCounts,
                cached: false,
                fromDatabase: true,
                timestamp: new Date().toISOString(),
              },
            },
          },
          {status: 200}
        )

        // Cache for 1 hour
        res.headers.set(
          "Cache-Control",
          "public, s-maxage=3600, stale-while-revalidate=300"
        )
        return res
      } catch (dbError: any) {
        console.error("Database search failed, falling back to API:", dbError)
        // Fall through to API aggregation
      }
    }

    // Fallback: Fetch from external APIs
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
      isTest: validatedParams.isTest,
    })

    logger.apiResponse("aggregator", "searchJobs", 0, 200)

    let jobs = result.jobs
    // Always apply translations - works for all languages including English
    // (source content may be in German/French and need translation to English)
    if (validatedParams.locale) {
      jobs = await translationService.translateJobs(
        jobs,
        validatedParams.locale
      )
    }

    const res = NextResponse.json(
      {
        success: true,
        data: {
          jobs: jobs,
          pagination: {
            page: validatedParams.page,
            limit: validatedParams.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / validatedParams.limit),
          },
          meta: {
            sources: result.sources,
            cached: result.cached,
            fromDatabase: false,
            dbError: (globalThis as any).__lastDbError || null,
            timestamp: new Date().toISOString(),
          },
        },
      },
      {status: 200}
    )

    // Cache for 1 hour (3600s) for maximum jobs, revalidate in background for 5 minutes
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=300"
    )
    return res
  } catch (error: any) {
    logger.apiError("aggregator", "searchJobs", error)

    // Validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        {status: 400}
      )
    }

    // Generic errors
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      {status: error.statusCode || 500}
    )
  }
}

// Apply rate limiting
export const GET = withRateLimit(handler, {max: 100, windowMs: 60000})
