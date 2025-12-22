import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import {createClient} from "https://esm.sh/@supabase/supabase-js@2"
import {GoogleGenAI} from "https://esm.sh/@google/genai@0.14.0"

const LANGUAGES = ["en", "de", "fr", "it"] as const // Include English for non-English source content
const BATCH_SIZE = 10 // Gemini is fast - can handle 10 jobs per run
const TRANSLATION_MODEL = "gemini-2.5-flash-lite" // Free tier: 60 RPM

// Helper to add delay
const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// JSON Schema for structured translation output
const translationSchema = {
  type: "object",
  properties: {
    en: {
      type: "object",
      properties: {
        title: {type: "string"},
        description: {type: "string"},
      },
      required: ["title", "description"],
    },
    de: {
      type: "object",
      properties: {
        title: {type: "string"},
        description: {type: "string"},
      },
      required: ["title", "description"],
    },
    fr: {
      type: "object",
      properties: {
        title: {type: "string"},
        description: {type: "string"},
      },
      required: ["title", "description"],
    },
    it: {
      type: "object",
      properties: {
        title: {type: "string"},
        description: {type: "string"},
      },
      required: ["title", "description"],
    },
  },
  required: ["en", "de", "fr", "it"],
}

interface MultiLanguageTranslation {
  en: {title: string; description: string}
  de: {title: string; description: string}
  fr: {title: string; description: string}
  it: {title: string; description: string}
}

/**
 * Translate title and description to all 4 languages in a single Gemini API call
 */
async function translateToAllLanguages(
  ai: GoogleGenAI,
  title: string,
  description: string,
  maxRetries = 3
): Promise<{
  success: boolean
  translations?: MultiLanguageTranslation
  error?: string
}> {
  if (!title && !description) {
    return {success: false, error: "No content to translate"}
  }

  // Truncate description to avoid token limits
  const truncatedDesc = description?.substring(0, 1500) || ""

  const prompt = `Translate this job posting to English, German, French, and Italian.
Keep translations professional and accurate.

Title: ${title || "N/A"}
Description: ${truncatedDesc || "N/A"}`

  let lastError: any = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: TRANSLATION_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: translationSchema,
          temperature: 0.2,
          maxOutputTokens: 2000,
        },
      })

      const text = response.text || ""
      const translations = JSON.parse(text) as MultiLanguageTranslation

      return {success: true, translations}
    } catch (error: any) {
      lastError = error

      // Check if it's a rate limit error (429)
      const errorMessage = error?.message || ""
      const is429 =
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        error?.status === 429

      if (is429 && attempt < maxRetries) {
        // Parse retry delay from error message
        let waitSeconds = 30 // Default wait time
        const retryMatch = errorMessage.match(/retry in (\d+\.?\d*)s/i)
        if (retryMatch) {
          waitSeconds = Math.ceil(parseFloat(retryMatch[1])) + 2
        }

        console.log(
          `⏳ Rate limited. Waiting ${waitSeconds}s before retry ${
            attempt + 1
          }/${maxRetries}...`
        )
        await delay(waitSeconds * 1000)
        continue
      }

      console.error("Gemini translation error:", error)
      break
    }
  }

  return {
    success: false,
    error: lastError?.message || "Translation failed after retries",
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

    // Initialize Gemini AI
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY not configured in Edge Function secrets")
    }
    const ai = new GoogleGenAI({apiKey: geminiApiKey})

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body for optional parameters
    let batchSize = BATCH_SIZE
    let offset = 0

    try {
      const body = await req.json()
      if (body.batchSize) batchSize = Math.min(body.batchSize, 20) // Max 20 to avoid timeout
      if (body.offset) offset = body.offset
    } catch {
      // Use defaults if no body
    }

    console.log(
      `🚀 Starting Gemini bulk translation: batch=${batchSize}, offset=${offset}`
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

    // Filter to only untranslated jobs (check for German translation as indicator)
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
      .slice(0, batchSize)

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

    // Process each untranslated job with Gemini (all languages in one call!)
    for (const job of untranslatedJobs) {
      const contentId = `job-${job.source || "db"}-${job.id}`

      try {
        // One Gemini call translates to ALL languages at once!
        const result = await translateToAllLanguages(
          ai,
          job.title || "",
          job.description || ""
        )

        if (!result.success || !result.translations) {
          console.error(`Translation failed for ${contentId}:`, result.error)
          errorCount++
          continue
        }

        // Save translations for each language
        for (const lang of LANGUAGES) {
          const translation = result.translations[lang]
          if (!translation) continue

          const {error: insertError} = await supabase
            .from("translations")
            .upsert(
              {
                content_id: contentId,
                language: lang,
                type: "job",
                translations: translation,
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
            translatedCount++
          }
        }

        console.log(`✅ Translated: ${job.title} -> en, de, fr, it`)

        // Small delay between jobs to be safe with rate limits (1 second)
        await delay(1000)
      } catch (error) {
        console.error(`Translation failed for ${contentId}:`, error)
        errorCount++
      }
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
        message: `Translated ${untranslatedJobs.length} jobs (${translatedCount} translations saved)`,
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
