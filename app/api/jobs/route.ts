import {createClient} from "@/lib/supabase/server"
import {NextRequest, NextResponse} from "next/server"
import type {OfferInsert, OfferUpdate} from "@/lib/types/database"
import {API_CONFIG, CACHE_CONFIG} from "@/lib/config/api-keys"
import {searchActiveJobsDb} from "@/lib/api/active-jobs-db"
import {searchAdzunaJobs} from "@/lib/api/adzuna"
import {cacheWrap} from "@/lib/api/cache"
import {withRateLimit} from "@/lib/utils/rate-limiter"
import {sanitizeSnippet} from "@/lib/utils/text"
import {
  getStoredTranslationsBatch,
  storeTranslation,
  autoTranslateToAllLanguages,
  ContentType,
} from "@/lib/services/translation-service"
import {translateText, SupportedLanguage} from "@/lib/services/lingva-translate"

// Deduplicate external jobs by composite key: title + company + location (+ external_id when present)
function normalizeText(v: unknown): string {
  return typeof v === "string" ? v.toLowerCase().trim() : ""
}

export const GET = withRateLimit(handler, {max: 100, windowMs: 60000})

function dedupeExternalJobs(jobs: any[]): any[] {
  const seen = new Set<string>()
  const result: any[] = []

  for (const j of jobs) {
    const title = normalizeText(j?.title)
    const company = normalizeText(j?.company?.name ?? j?.company)
    const location = normalizeText(j?.location)
    const extId = normalizeText(j?.external_id)

    // Use a stable composite key; include external_id if available to tighten matches within same source
    const key = [title, company, location, extId].filter(Boolean).join("|")

    if (!seen.has(key)) {
      seen.add(key)
      result.push(j)
    }
  }

  return result
}

// GET /api/jobs - Fetch jobs with filtering and pagination
async function handler(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {searchParams} = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const category = searchParams.get("category")
    const location = searchParams.get("location")
    const type = searchParams.get("type")
    const remote = searchParams.get("remote")
    const search = searchParams.get("search")
    const featured = searchParams.get("featured")
    const includeExternal =
      (searchParams.get("include_external") ?? "true") === "true"
    const lang = searchParams.get("lang") || searchParams.get("locale") || "en" // Language parameter for translations

    const offset = (page - 1) * limit

    // Create cache key based on all query parameters (including language)
    const cacheKey = `jobs:${page}:${limit}:${category || "all"}:${
      location || "all"
    }:${type || "all"}:${remote || "false"}:${search || "all"}:${
      featured || "all"
    }:${includeExternal}:${lang}`
    console.log("🔑 [Jobs API] Cache key:", cacheKey)

    // Use cached response if available
    const cachedResponse = await cacheWrap(
      cacheKey,
      CACHE_CONFIG.jobs.ttl,
      async () => {
        // Build query
        // Get total count for pagination (DB only)
        let totalCount = 0
        let jobs: any[] = []

        // Helper to build base query with filters
        const buildQuery = (baseQuery: any) => {
          let q = baseQuery
            .eq("status", "active")
            .eq("type", "job")
            .not("published_at", "is", null)
            .lte("published_at", new Date().toISOString())
            .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)

          if (category) q = q.eq("category_id", category)
          if (location) q = q.ilike("location", `%${location}%`)
          if (type) q = q.eq("employment_type", type)
          if (remote === "true") q = q.eq("is_remote", true)
          if (featured === "true") q = q.eq("featured", true)
          if (search)
            q = q.or(
              `title.ilike.%${search}%,description.ilike.%${search}%,skills.cs.{${search}}`
            )

          return q
        }

        // Standard fetching for English or if prioritizing translation fails/is empty
        const fetchStandard = async () => {
          let query = supabase
            .from("offers")
            .select(`*, company:companies(*), category:categories(*)`)

          query = buildQuery(query)
            .order("featured", {ascending: false})
            .order("urgent", {ascending: false})
            .order("published_at", {ascending: false})
            .range(offset, offset + limit - 1)

          const {data, count} = await query

          // Get exact count if needed
          if (!count) {
            const countQuery = buildQuery(
              supabase.from("offers").select("*", {count: "exact", head: true})
            )
            const {count: c} = await countQuery
            totalCount = c || 0
          } else {
            totalCount = count
          }

          return data || []
        }

        // Specialized fetching to prioritize translated jobs
        if (lang !== "en") {
          try {
            // 1. Get IDs of all translated jobs for this language
            // We use type assertion since tables might not be fully typed in generated types
            const {data: translations} = await (supabase as any)
              .from("translations")
              .select("content_id")
              .eq("language", lang)
              .eq("type", "job")

            const translatedIds = (translations || [])
              .map((t: any) => {
                // Extract UUID from end of "job-source-uuid" string
                // UUID is 36 chars long
                if (!t.content_id || t.content_id.length < 36) return null
                return t.content_id.slice(-36)
              })
              .filter(Boolean)

            if (translatedIds.length === 0) {
              jobs = await fetchStandard()
            } else {
              // 2. Count matching translated jobs (applying all filters)
              const transQuery = buildQuery(
                supabase
                  .from("offers")
                  .select("*", {count: "exact", head: true})
              ).in("id", translatedIds)
              const {count: transCount} = await transQuery
              const validTransCount = transCount || 0

              // 3. Count matching untranslated jobs
              const untransQuery = buildQuery(
                supabase
                  .from("offers")
                  .select("*", {count: "exact", head: true})
              ).not("id", "in", translatedIds)
              const {count: untransCount} = await untransQuery
              const validUntransCount = untransCount || 0

              totalCount = validTransCount + validUntransCount

              // 4. Determine fetch ranges based on pagination
              // We want to fetch [offset ... offset+limit] from the virtual combined list [Translated... Untranslated...]

              const start = offset
              const end = offset + limit

              const transJobs: any[] = []
              const untransJobs: any[] = []

              // Fetch from Translated partition if range overlaps
              if (start < validTransCount) {
                const transLimit = Math.min(limit, validTransCount - start)
                let q = supabase
                  .from("offers")
                  .select(`*, company:companies(*), category:categories(*)`)
                q = buildQuery(q)
                  .in("id", translatedIds)
                  .order("featured", {ascending: false})
                  .order("published_at", {ascending: false})
                  .range(start, start + transLimit - 1)

                const {data} = await q
                if (data) transJobs.push(...data)
              }

              // Fetch from Untranslated partition if range overlaps
              // Calculate how many slots are left or if we are purely in untranslated territory
              const untransStart = Math.max(0, start - validTransCount)
              const jobsNeeded = limit - transJobs.length

              if (jobsNeeded > 0 && untransStart < validUntransCount) {
                let q = supabase
                  .from("offers")
                  .select(`*, company:companies(*), category:categories(*)`)
                q = buildQuery(q)
                  .not("id", "in", translatedIds)
                  .order("featured", {ascending: false})
                  .order("published_at", {ascending: false})
                  .range(untransStart, untransStart + jobsNeeded - 1)

                const {data} = await q
                if (data) untransJobs.push(...data)
              }

              jobs = [...transJobs, ...untransJobs]
            }
          } catch (err) {
            console.error("Error in translated sorting:", err)
            jobs = await fetchStandard()
          }
        } else {
          jobs = await fetchStandard()
        }

        // Fetch external jobs from multiple sources (prioritized order)
        let externalJobs: any[] = []

        if (includeExternal) {
          const country = "de" // Default to Germany for DACH region
          const remainingSlots = Math.max(0, limit - (jobs?.length ?? 0))

          // 1. Active Jobs DB (newest ATS jobs - highest priority)
          if (API_CONFIG.rapidApi.enabled && remainingSlots > 0) {
            try {
              const activeJobsFilter = search || category || "developer"
              const locationFilter = location
                ? `"${location}"`
                : '"Germany" OR "Austria" OR "Switzerland"'

              const activeJobs = await searchActiveJobsDb({
                limit: Math.min(10, remainingSlots), // Get up to 10 from Active Jobs DB
                offset: 0,
                title_filter: search ? `"${search}"` : undefined,
                location_filter: locationFilter,
                description_type: "text",
                country: country as any,
              })

              externalJobs.push(...activeJobs)
              console.log(
                `[Jobs API] Fetched ${activeJobs.length} jobs from Active Jobs DB`
              )
            } catch (error) {
              console.error("[Jobs API] Active Jobs DB failed:", error)
              // Continue with other sources
            }
          }

          // 2. Adzuna (fallback/supplement)
          const adzunaSlots = Math.max(0, remainingSlots - externalJobs.length)
          if (API_CONFIG.adzuna.enabled && adzunaSlots > 0) {
            try {
              // Map location to postcode if a German postal code is detected
              const postcode =
                location && /^\d{5}$/.test(location) ? location : undefined
              const adzunaJobs = await searchAdzunaJobs({
                country: country as any,
                what: search ?? undefined,
                where: postcode ? undefined : location ?? undefined,
                postcode,
                radiusKm: 25,
                page: 1,
                resultsPerPage: adzunaSlots,
                remote: remote === "true" ? true : false,
                language: "de",
                currency: "EUR",
                isTest: false,
              })

              externalJobs.push(...adzunaJobs)
              console.log(
                `[Jobs API] Fetched ${adzunaJobs.length} jobs from Adzuna`
              )
            } catch (error) {
              console.error("[Jobs API] Adzuna failed:", error)
              // Continue even if this source fails
            }
          }
        }

        // Merge with external (DB jobs first, then Active Jobs DB, then Adzuna)
        const dedupedExternal = dedupeExternalJobs(externalJobs)
        const combinedRaw: any[] = [...(jobs || []), ...dedupedExternal]

        // Sanitize snippets to prevent merged words from stripped tags (e.g., "in it" -> "init")
        const combined = combinedRaw.map(j => {
          const sd = j.short_description ?? j.description ?? ""
          return {
            ...j,
            short_description: sanitizeSnippet(
              typeof sd === "string" ? sd : ""
            ),
          }
        })

        // Apply translations for the requested language
        // This now works for ALL languages including English (for jobs originally in German/French)
        let translatedJobs = combined
        if (combined.length > 0) {
          try {
            // Get content IDs for batch lookup
            const contentIds = combined.map(
              j => `job-${j.source || "db"}-${j.id}`
            )
            console.log(
              `[Jobs API] Checking translations for lang=${lang}, count=${contentIds.length}. Sample ID: ${contentIds[0]}`
            )

            const translations = await getStoredTranslationsBatch(
              contentIds,
              lang,
              "job" as ContentType
            )
            console.log(
              `[Jobs API] Found ${translations.size} translations for ${lang}`
            )

            // Find jobs that need translation (not in DB for this language)
            const jobsNeedingTranslation = combined.filter(job => {
              const contentId = `job-${job.source || "db"}-${job.id}`
              return !translations.has(contentId)
            })

            // Translate and store missing translations (async, don't block response)
            if (jobsNeedingTranslation.length > 0) {
              console.log(
                `[Jobs API] Translating ${jobsNeedingTranslation.length} jobs to ${lang}...`
              )
              // Translate in background (don't await to not block response)
              ;(async () => {
                for (const job of jobsNeedingTranslation.slice(0, 10)) {
                  // Limit to 10 per request
                  try {
                    const contentId = `job-${job.source || "db"}-${job.id}`

                    // Detect source language and translate to target language
                    // For English target, we auto-detect source; for others, assume English source
                    const sourceLang = lang === "en" ? "auto" : "en"

                    // Translate title and description
                    const titleResult = await translateText(
                      job.title || "",
                      lang as SupportedLanguage,
                      sourceLang as any
                    )
                    const descResult = await translateText(
                      (job.description || "").substring(0, 1000),
                      lang as SupportedLanguage,
                      sourceLang as any
                    )

                    await storeTranslation(contentId, lang, "job", {
                      title: titleResult.translation || job.title,
                      description: descResult.translation || job.description,
                    })

                    // Small delay to avoid rate limiting
                    await new Promise(r => setTimeout(r, 200))
                  } catch (err) {
                    console.error(
                      `[Jobs API] Failed to translate job ${job.id}:`,
                      err
                    )
                  }
                }
                console.log(
                  `[Jobs API] Background translation completed for ${lang}`
                )
              })()
            }

            // Apply translations, falling back to original if not found
            translatedJobs = combined.map(job => {
              const translation = translations.get(
                `job-${job.source || "db"}-${job.id}`
              )
              if (translation) {
                return {
                  ...job,
                  title: translation.title || job.title,
                  description: translation.description || job.description,
                  short_description: translation.description
                    ? sanitizeSnippet(translation.description)
                    : job.short_description,
                }
              }
              return job
            })

            console.log(
              `[Jobs API] Applied ${translations.size} translations for lang=${lang}`
            )
          } catch (error) {
            console.error("[Jobs API] Translation error:", error)
            // Continue with original content on error
          }
        }

        return {
          jobs: translatedJobs,
          pagination: {
            page,
            limit,
            total: (totalCount || 0) + (dedupedExternal?.length || 0),
            pages: Math.max(1, Math.ceil((totalCount || 0) / limit)),
          },
          sources: {
            database: jobs?.length || 0,
            activeJobsDb: dedupedExternal.filter(j =>
              j.source?.includes("active-jobs")
            ).length,
            adzuna: dedupedExternal.filter(j => j.source === "adzuna").length,
          },
          language: lang,
        }
      }
    )

    console.log(
      `✅ [Jobs API] Successfully fetched ${cachedResponse.jobs.length} jobs`
    )

    return NextResponse.json({
      ...cachedResponse,
      cached: true,
      cacheTtl: `${CACHE_CONFIG.jobs.ttl} seconds (${Math.round(
        CACHE_CONFIG.jobs.ttl / 60
      )} minutes)`,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({error: "Internal server error"}, {status: 500})
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    // Get user profile to check permissions and plan
    const {data: profile} = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({error: "Profile not found"}, {status: 404})
    }

    // Type guard for profile
    if (!profile.id || !profile.role) {
      return NextResponse.json({error: "Invalid profile data"}, {status: 500})
    }

    // Check if user has permission to create jobs
    const allowedRoles = [
      "supervisor",
      "admin",
      "moderator",
      "lister",
      "publisher",
      "employer",
      "job_seeker",
    ]
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        {error: "Insufficient permissions"},
        {status: 403}
      )
    }

    // Check job limit for free users (job_seeker role)
    const isFreeUser = profile.role === "job_seeker"

    if (isFreeUser) {
      // Count existing jobs created by this user
      const {count: jobCount} = await supabase
        .from("offers")
        .select("*", {count: "exact", head: true})
        .eq("created_by", profile.id)
        .eq("type", "job")

      const maxJobsForFreeUsers = 5
      if ((jobCount || 0) >= maxJobsForFreeUsers) {
        return NextResponse.json(
          {
            error: `Free users can create up to ${maxJobsForFreeUsers} jobs. Please upgrade to create more jobs.`,
            limit: maxJobsForFreeUsers,
            current: jobCount || 0,
          },
          {status: 403}
        )
      }
    }

    const body = await request.json()

    // Validate required fields
    const {title, description, category_id, company_id} = body
    if (!title || !description || !category_id || !company_id) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, description, category_id, company_id",
        },
        {status: 400}
      )
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const jobData: OfferInsert = {
      ...body,
      description: body.description || undefined,
      slug: `${slug}-${Date.now()}`, // Ensure uniqueness
      type: "job",
      created_by: profile.id,
      status:
        profile.role === "moderator" ||
        profile.role === "admin" ||
        profile.role === "supervisor"
          ? "active"
          : "pending", // Auto-approve for moderators and above
      published_at:
        profile.role === "moderator" ||
        profile.role === "admin" ||
        profile.role === "supervisor"
          ? new Date().toISOString()
          : null,
    }

    const {data: job, error} = await supabase
      .from("offers")
      .insert(jobData)
      .select(
        `
        *,
        company:companies(*),
        category:categories(*)
      `
      )
      .single()

    if (error) {
      console.error("Error creating job:", error)
      return NextResponse.json({error: "Failed to create job"}, {status: 500})
    }

    // Auto-translate to ALL 4 languages in background
    // This ensures translations are ready when users view the job in any language
    if (job && job.id) {
      const contentId = `job-${job.id}`

      // Run translations in background (don't block response)
      autoTranslateToAllLanguages(contentId, "job", {
        title: job.title || "",
        description: job.description || "",
      })
        .then(result => {
          if (result.success) {
            console.log(
              `[Jobs API] ✓ Auto-translated job ${job.id} from ${result.sourceLanguage} to ${result.translatedLanguages.length} languages`
            )
          }
        })
        .catch(err => {
          console.error(
            `[Jobs API] Auto-translation failed for job ${job.id}:`,
            err
          )
        })
    }

    return NextResponse.json({job}, {status: 201})
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({error: "Internal server error"}, {status: 500})
  }
}
