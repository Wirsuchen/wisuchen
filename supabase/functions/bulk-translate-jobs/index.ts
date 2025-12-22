import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import {createClient} from "https://esm.sh/@supabase/supabase-js@2"

const LANGUAGES = ["de", "fr", "it"]
const BATCH_SIZE = 50
const LINGVA_BASE_URL = "https://lingva.ml/api/v1"

// Helper to add delay
const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// Translate text using Lingva API with retry logic
async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = "en",
  retries: number = 3
): Promise<string> {
  if (!text || text.trim().length === 0) return text

  // Truncate very long text
  const truncatedText = text.substring(0, 1500)
  const encodedText = encodeURIComponent(truncatedText)

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Add delay before request (increases with each retry)
      if (attempt > 0) {
        await delay(1000 * attempt) // 1s, 2s, 3s backoff
      }

      const response = await fetch(
        `${LINGVA_BASE_URL}/${sourceLang}/${targetLang}/${encodedText}`
      )

      if (response.status === 429) {
        console.log(`Rate limited, waiting ${(attempt + 1) * 2}s...`)
        await delay(2000 * (attempt + 1))
        continue
      }

      if (!response.ok) {
        console.error(`Lingva API error: ${response.status}`)
        if (attempt < retries - 1) continue
        return text
      }

      const data = await response.json()
      return data.translation || text
    } catch (error) {
      console.error("Translation error:", error)
      if (attempt < retries - 1) {
        await delay(1000 * (attempt + 1))
        continue
      }
      return text
    }
  }
  return text
}

// Translate job fields SEQUENTIALLY (not parallel) to avoid rate limits
async function translateJob(
  title: string,
  description: string,
  lang: string
): Promise<{title: string; description: string}> {
  // Translate title first
  const translatedTitle = await translateText(title, lang)

  // Wait 500ms between title and description
  await delay(500)

  // Then translate description
  const translatedDesc = await translateText(
    description.substring(0, 1000),
    lang
  )

  return {
    title: translatedTitle,
    description: translatedDesc,
  }
}

Deno.serve(async (req: Request) => {
  try {
    // CORS headers
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body for optional parameters
    let batchSize = BATCH_SIZE
    let targetLanguages = LANGUAGES
    let offset = 0

    try {
      const body = await req.json()
      if (body.batchSize) batchSize = Math.min(body.batchSize, 100)
      if (body.languages) targetLanguages = body.languages
      if (body.offset) offset = body.offset
    } catch {
      // Use defaults if no body
    }

    console.log(
      `🚀 Starting bulk translation: batch=${batchSize}, offset=${offset}, languages=${targetLanguages.join(
        ","
      )}`
    )

    // Fetch more jobs to find untranslated ones
    const fetchLimit = 500
    const {data: jobs, error: jobError} = await supabase
      .from("offers")
      .select("id, title, description, source")
      .eq("type", "job")
      .eq("status", "active")
      .range(offset, offset + fetchLimit - 1)

    if (jobError) {
      throw new Error(`Failed to fetch jobs: ${jobError.message}`)
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No jobs to translate",
          translated: 0,
        }),
        {
          headers: {"Content-Type": "application/json"},
        }
      )
    }

    // Filter to only untranslated jobs
    const contentIds = jobs.map(j => `job-${j.source || "db"}-${j.id}`)

    const {data: existingTranslations} = await supabase
      .from("translations")
      .select("content_id")
      .in("content_id", contentIds)
      .eq("language", "de")
      .eq("type", "job")

    const existingIds = new Set(
      (existingTranslations || []).map(t => t.content_id)
    )
    const untranslatedJobs = jobs
      .filter(j => !existingIds.has(`job-${j.source || "db"}-${j.id}`))
      .slice(0, batchSize) // Only process batchSize jobs

    if (untranslatedJobs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message:
            "No untranslated jobs found in this range. Try a higher offset.",
          translated: 0,
          nextOffset: offset + fetchLimit,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    console.log(
      `📝 Found ${untranslatedJobs.length} untranslated jobs out of ${jobs.length}`
    )

    let translatedCount = 0
    let errorCount = 0

    // Process each untranslated job
    for (const job of untranslatedJobs) {
      const contentId = `job-${job.source || "db"}-${job.id}`

      for (const lang of targetLanguages) {
        try {
          const translations = await translateJob(
            job.title || "",
            job.description || "",
            lang
          )

          const {error: insertError} = await supabase
            .from("translations")
            .upsert(
              {
                content_id: contentId,
                language: lang,
                type: "job",
                translations: translations,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {onConflict: "content_id,language,type"}
            )

          if (insertError) {
            console.error(
              `Error saving translation for ${contentId}/${lang}:`,
              insertError
            )
            errorCount++
          } else {
            console.log(`✅ Translated: ${job.title} -> ${lang}`)
            translatedCount++
          }

          // Longer delay to avoid rate limiting (1.5 seconds between each translation)
          await delay(1500)
        } catch (error) {
          console.error(`Translation failed for ${contentId}/${lang}:`, error)
          errorCount++
        }
      }

      // Extra delay between jobs (2 seconds)
      await delay(2000)
    }

    // Get updated stats
    const {data: stats} = await supabase
      .from("translations")
      .select("language")
      .eq("type", "job")

    const statsByLang: Record<string, number> = {}
    ;(stats || []).forEach(s => {
      statsByLang[s.language] = (statsByLang[s.language] || 0) + 1
    })

    const {count: totalJobs} = await supabase
      .from("offers")
      .select("*", {count: "exact", head: true})
      .eq("type", "job")
      .eq("status", "active")

    const remaining = (totalJobs || 0) - (statsByLang["de"] || 0)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Translated ${translatedCount} job-language pairs`,
        stats: {
          processedJobs: untranslatedJobs.length,
          translationsCreated: translatedCount,
          errors: errorCount,
          totalJobs: totalJobs,
          translationsByLanguage: statsByLang,
          remainingUntranslated: remaining,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error: any) {
    console.error("Edge function error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
})
