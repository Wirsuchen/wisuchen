/**
 * Job Sync Service
 * Syncs jobs from external APIs to Supabase database
 * Incrementally builds a persistent job repository
 */

import {createClient} from "@supabase/supabase-js"
import {RapidAPIService} from "./job-apis/rapidapi"
import {AdzunaAPI} from "./job-apis/adzuna"
import {logger} from "@/lib/utils/logger"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface JobSyncStats {
  total: number
  new: number
  updated: number
  skipped: number
  errors: number
}

export class JobSyncService {
  private supabase
  private rapidAPI: RapidAPIService
  private adzunaAPI: AdzunaAPI

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey)
    this.rapidAPI = new RapidAPIService()
    this.adzunaAPI = new AdzunaAPI()
  }

  /**
   * Sync jobs from all sources to database
   */
  async syncAllJobs(params?: {
    query?: string
    limit?: number
  }): Promise<JobSyncStats> {
    const stats: JobSyncStats = {
      total: 0,
      new: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    }

    try {
      console.log("🔄 [JobSync] Starting job sync...")

      // Fetch from RapidAPI sources
      const rapidJobs = await this.rapidAPI.aggregateJobSearch({
        query: params?.query,
        page: 1,
      })

      console.log(
        `📥 [JobSync] Fetched ${rapidJobs.jobs.length} jobs from RapidAPI`
      )

      // Sync each job to database
      for (const job of rapidJobs.jobs) {
        try {
          const result = await this.upsertJob(job)
          stats.total++
          if (result === "new") stats.new++
          else if (result === "updated") stats.updated++
          else stats.skipped++
        } catch (error) {
          stats.errors++
          console.error(`❌ [JobSync] Error syncing job ${job.id}:`, error)
        }
      }

      // Fetch from Adzuna
      try {
        const adzunaResponse = await this.adzunaAPI.searchJobs({
          query: params?.query,
          resultsPerPage: params?.limit || 50,
          page: 1,
        })

        for (const response of adzunaResponse) {
          for (const job of response.results) {
            try {
              const normalized = {
                id: job.id,
                title: job.title,
                company: job.company.display_name,
                location: job.location.display_name,
                description: job.description,
                salary:
                  job.salary_min || job.salary_max
                    ? `€${job.salary_min || 0}-€${job.salary_max || 0}`
                    : undefined,
                employment_type: "full_time",
                posted_date: job.created,
                apply_url: job.redirect_url,
                skills: [],
                source: "adzuna",
                experience_level: undefined,
              }

              const result = await this.upsertJob(normalized)
              stats.total++
              if (result === "new") stats.new++
              else if (result === "updated") stats.updated++
              else stats.skipped++
            } catch (error) {
              stats.errors++
              console.error(`❌ [JobSync] Error syncing Adzuna job:`, error)
            }
          }
        }

        console.log(
          `📥 [JobSync] Synced ${
            adzunaResponse[0]?.results.length || 0
          } jobs from Adzuna`
        )
      } catch (error) {
        console.error("❌ [JobSync] Adzuna sync failed:", error)
      }

      console.log("✅ [JobSync] Sync complete:", stats)
      return stats
    } catch (error) {
      console.error("❌ [JobSync] Fatal sync error:", error)
      throw error
    }
  }

  /**
   * Insert or update a job in the database
   */
  private async upsertJob(job: any): Promise<"new" | "updated" | "skipped"> {
    try {
      // Check if job already exists
      const {data: existing} = await this.supabase
        .from("offers")
        .select("id, updated_at")
        .eq("external_id", job.id)
        .eq("source", job.source)
        .eq("type", "job")
        .single()

      const jobData = {
        title: job.title,
        slug: this.generateSlug(job.title, job.id),
        description: job.description || "",
        short_description: job.description?.substring(0, 200) || "",
        type: "job",
        status: "active",
        employment_type: this.mapEmploymentType(job.employment_type),
        experience_level: this.mapExperienceLevel(job.experience_level),
        salary_min: this.extractSalary(job.salary, "min"),
        salary_max: this.extractSalary(job.salary, "max"),
        salary_currency: "EUR",
        location: job.location,
        is_remote: job.location?.toLowerCase().includes("remote") || false,
        skills: job.skills || [],
        application_url: job.apply_url || job.applicationUrl,
        source: job.source,
        external_id: job.id,
        published_at:
          job.posted_date || job.publishedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (existing) {
        // Update existing job
        const {error} = await this.supabase
          .from("offers")
          .update(jobData)
          .eq("id", existing.id)

        if (error) throw error
        return "updated"
      } else {
        // Insert new job
        const {error} = await this.supabase.from("offers").insert([jobData])

        if (error) {
          // If unique constraint violation, skip
          if (error.code === "23505") {
            return "skipped"
          }
          throw error
        }
        return "new"
      }
    } catch (error: any) {
      // Handle duplicate key errors gracefully
      if (error.code === "23505") {
        return "skipped"
      }
      throw error
    }
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(title: string, id: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100)
    return `${slug}-${id.substring(0, 8)}`
  }

  /**
   * Map employment type to enum
   */
  private mapEmploymentType(type?: string): string | undefined {
    if (!type) return undefined
    const map: Record<string, string> = {
      full_time: "full_time",
      "full time": "full_time",
      part_time: "part_time",
      "part time": "part_time",
      contract: "contract",
      freelance: "freelance",
      internship: "internship",
      temporary: "temporary",
    }
    return map[type.toLowerCase()] || undefined
  }

  /**
   * Map experience level to enum
   */
  private mapExperienceLevel(level?: string): string | undefined {
    if (!level) return undefined
    const map: Record<string, string> = {
      junior: "junior",
      mid: "mid",
      senior: "senior",
      lead: "lead",
      executive: "executive",
    }
    return map[level.toLowerCase()] || undefined
  }

  /**
   * Extract salary from text or object
   */
  private extractSalary(salary: any, part: "min" | "max"): number | undefined {
    if (!salary) return undefined

    if (typeof salary === "object") {
      return part === "min" ? salary.min : salary.max
    }

    if (typeof salary === "string") {
      const numbers = salary.match(/\d+/g)
      if (!numbers || numbers.length === 0) return undefined
      const values = numbers.map(n => parseInt(n))
      return part === "min" ? Math.min(...values) : Math.max(...values)
    }

    return undefined
  }

  /**
   * Get total job count from database
   */
  async getTotalJobCount(): Promise<number> {
    const {count, error} = await this.supabase
      .from("offers")
      .select("*", {count: "exact", head: true})
      .eq("type", "job")
      .eq("status", "active")

    if (error) {
      console.error("Error getting job count:", error)
      return 0
    }

    return count || 0
  }

  /**
   * Search jobs from database
   * When locale is provided, only returns jobs that have translations for that language
   * When requireFullTranslation is true, only returns jobs with all 4 language translations
   */
  async searchJobs(params: {
    query?: string
    location?: string
    employmentType?: string
    experienceLevel?: string
    limit?: number
    page?: number
    locale?: string
    requireFullTranslation?: boolean // Only return jobs with all 4 language translations
  }) {
    const page = params.page || 1
    const limit = params.limit || 20
    const from = (page - 1) * limit

    // If requireFullTranslation is true, use a dedicated RPC function that handles
    // the join server-side (avoids passing 1000s of IDs in the URL which causes Bad Request)
    if (params.requireFullTranslation) {
      try {
        // Use RPC function that returns paginated results with all filters applied
        const {data, error, count} = await this.supabase.rpc(
          "search_fully_translated_jobs",
          {
            p_query: params.query || null,
            p_location: params.location || null,
            p_employment_type: params.employmentType || null,
            p_experience_level: params.experienceLevel || null,
            p_limit: limit,
            p_offset: from,
          }
        )

        if (error) {
          console.error("Error in search_fully_translated_jobs RPC:", error)
          // Fall through to regular search
        } else {
          // Get total count - RPC returns BIGINT directly, not an object
          const {data: countResult, error: countError} = await this.supabase.rpc(
            "count_fully_translated_jobs",
            {
              p_query: params.query || null,
              p_location: params.location || null,
              p_employment_type: params.employmentType || null,
              p_experience_level: params.experienceLevel || null,
            }
          )

          if (countError) {
            console.error("Error in count_fully_translated_jobs RPC:", countError)
        }

          // countResult is the BIGINT value directly
          const totalCount = typeof countResult === 'number' ? countResult : parseInt(countResult, 10) || 0

          console.log(
            `[JobSync] Found ${data?.length || 0} fully translated jobs (page ${page}, total: ${totalCount})`
          )

        return {
            jobs: data || [],
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
        }
      }
      } catch (error) {
        console.error("Error in requireFullTranslation:", error)
        // Fall through to regular search
      }
    }

    // Regular search (no translation requirement)
    let query = this.supabase
      .from("offers")
      .select("*", {count: "exact"})
      .eq("type", "job")
      .eq("status", "active")
      .order("published_at", {ascending: false})

    if (params.query) {
      query = query.or(
        `title.ilike.%${params.query}%,description.ilike.%${params.query}%`
      )
    }

    if (params.location) {
      // Support comma-separated location patterns (OR matching)
      const locationPatterns = params.location.split(',').map(l => l.trim()).filter(Boolean)
      if (locationPatterns.length === 1) {
        query = query.ilike("location", `%${locationPatterns[0]}%`)
      } else if (locationPatterns.length > 1) {
        // Build OR filter for multiple locations
        const orFilter = locationPatterns.map(loc => `location.ilike.%${loc}%`).join(',')
        query = query.or(orFilter)
      }
    }

    if (params.employmentType) {
      query = query.eq("employment_type", params.employmentType)
    }

    if (params.experienceLevel) {
      query = query.eq("experience_level", params.experienceLevel)
    }

    const to = from + limit - 1
    query = query.range(from, to)

    const {data, error, count} = await query

    if (error) {
      console.error("Error searching jobs:", error)
      throw error
    }

    return {
      jobs: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }
  }
}

export const jobSyncService = new JobSyncService()
