import {createClient} from "@/lib/supabase/server"
import {NextRequest, NextResponse} from "next/server"
import type {OfferUpdate} from "@/lib/types/database"
import {
  getStoredTranslation,
  storeTranslation,
  ContentType,
  SupportedLanguage,
} from "@/lib/services/translation-service"
import {translateText} from "@/lib/services/lingva-translate"

// GET /api/jobs/[id] - Get a specific job
export async function GET(
  request: NextRequest,
  context: {params: Promise<{id: string}>}
) {
  try {
    const supabase = await createClient()
    const {id} = await context.params

    // Get locale from query params or Accept-Language header
    const url = new URL(request.url)
    const locale =
      url.searchParams.get("locale") ||
      request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ||
      "en"

    // Validate UUID format - if invalid, return 404 immediately
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({error: "Job not found"}, {status: 404})
    }

    const {data: job, error} = await supabase
      .from("offers")
      .select(
        `
        *,
        company:companies(*),
        category:categories(*),
        created_by_profile:profiles!offers_created_by_fkey(*)
      `
      )
      .eq("id", id)
      .eq("type", "job")
      .single()

    if (error) {
      // PGRST116 = no rows returned (not found)
      // 22P02 = invalid input syntax for UUID (also treat as not found)
      if (
        error.code === "PGRST116" ||
        error.code === "22P02" ||
        error.message?.includes("invalid input")
      ) {
        return NextResponse.json({error: "Job not found"}, {status: 404})
      }
      console.error("Error fetching job:", error)
      return NextResponse.json({error: "Failed to fetch job"}, {status: 500})
    }

    // Increment view count
    await supabase
      .from("offers")
      .update({views_count: (job.views_count || 0) + 1})
      .eq("id", id)

    // Track impression for analytics
    const {
      data: {user},
    } = await supabase.auth.getUser()
    await supabase.from("impressions").insert({
      offer_id: id,
      user_id: user?.id || null,
      event_type: "view",
      ip_address:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
      referrer: request.headers.get("referer"),
      page_url: request.url,
    })

    // Apply translation if locale is not English
    let translatedJob = job
    if (locale !== "en" && ["de", "fr", "it"].includes(locale)) {
      try {
        const source = job.source || "db"
        const contentId = `job-${source}-${id}`

        // Try to get stored translation
        let translation = await getStoredTranslation(
          contentId,
          locale,
          "job" as ContentType
        )

        // If no translation exists, create one NOW (wait for it)
        if (!translation) {
          try {
            const titleResult = await translateText(
              job.title || "",
              locale as SupportedLanguage,
              "en"
            )
            const descResult = await translateText(
              (job.description || "").substring(0, 2000),
              locale as SupportedLanguage,
              "en"
            )

            const newTranslation = {
              title: titleResult.translation || job.title,
              description: descResult.translation || job.description,
            }

            // Store for future use
            await storeTranslation(contentId, locale, "job", newTranslation)
            console.log(`[Jobs API] Translated job ${id} to ${locale}`)

            // Apply the new translation
            translatedJob = {
              ...job,
              title: newTranslation.title,
              description: newTranslation.description,
            }
          } catch (err) {
            console.error(`[Jobs API] Failed to translate job ${id}:`, err)
          }
        } else {
          // Apply existing translation
          translatedJob = {
            ...job,
            title: translation.title || job.title,
            description: translation.description || job.description,
          }
        }
      } catch (err) {
        console.error(
          `[Jobs API] Error applying translation for job ${id}:`,
          err
        )
      }
    }

    return NextResponse.json({job: translatedJob})
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({error: "Internal server error"}, {status: 500})
  }
}

// PUT /api/jobs/[id] - Update a job
export async function PUT(
  request: NextRequest,
  context: {params: Promise<{id: string}>}
) {
  try {
    const supabase = await createClient()
    const {id} = await context.params

    // Check authentication
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    // Get user profile
    const {data: profile} = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({error: "Profile not found"}, {status: 404})
    }

    // Get existing job to check ownership
    const {data: existingJob, error: fetchError} = await supabase
      .from("offers")
      .select("created_by, status")
      .eq("id", id)
      .eq("type", "job")
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({error: "Job not found"}, {status: 404})
      }
      return NextResponse.json({error: "Failed to fetch job"}, {status: 500})
    }

    // Check permissions (owner or moderator+)
    const canEdit =
      existingJob.created_by === profile.id ||
      ["supervisor", "admin", "moderator"].includes(profile.role)

    if (!canEdit) {
      return NextResponse.json(
        {error: "Insufficient permissions"},
        {status: 403}
      )
    }

    const body = await request.json()

    // Update slug if title changed
    if (body.title) {
      const slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      body.slug = `${slug}-${Date.now()}`
    }

    // Handle status changes
    if (body.status === "active" && existingJob.status !== "active") {
      // Publishing the job
      body.published_at = new Date().toISOString()
    }

    const updateData: OfferUpdate = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    const {data: job, error} = await supabase
      .from("offers")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        company:companies(*),
        category:categories(*)
      `
      )
      .single()

    if (error) {
      console.error("Error updating job:", error)
      return NextResponse.json({error: "Failed to update job"}, {status: 500})
    }

    return NextResponse.json({job})
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({error: "Internal server error"}, {status: 500})
  }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(
  request: NextRequest,
  context: {params: Promise<{id: string}>}
) {
  try {
    const supabase = await createClient()
    const {id} = await context.params

    // Check authentication
    const {
      data: {user},
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    // Get user profile
    const {data: profile} = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({error: "Profile not found"}, {status: 404})
    }

    // Only admins can delete jobs (others can archive)
    if (!["supervisor", "admin"].includes(profile.role)) {
      return NextResponse.json(
        {error: "Insufficient permissions"},
        {status: 403}
      )
    }

    const {error} = await supabase
      .from("offers")
      .delete()
      .eq("id", id)
      .eq("type", "job")

    if (error) {
      console.error("Error deleting job:", error)
      return NextResponse.json({error: "Failed to delete job"}, {status: 500})
    }

    return NextResponse.json({message: "Job deleted successfully"})
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({error: "Internal server error"}, {status: 500})
  }
}
