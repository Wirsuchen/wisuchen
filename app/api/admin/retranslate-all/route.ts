import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { translateJob, SupportedLanguage } from "@/lib/services/google-translate"
import { storeTranslation, getStoredTranslation, ContentType } from "@/lib/services/translation-service"

export const maxDuration = 300 // 5 minutes timeout for long running process

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      if (error?.message?.includes('Rate Limit') || error?.code === 403) {
        const waitTime = baseDelay * Math.pow(2, attempt) // 2s, 4s, 8s
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`)
        await delay(waitTime)
      } else {
        throw error
      }
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if force retranslate is requested
    const url = new URL(req.url)
    const forceRetranslate = url.searchParams.get('force') === 'true'
    
    // 1. Fetch all jobs
    const { data: jobs, error } = await supabase
      .from("offers")
      .select("*")
      .eq("type", "job")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ message: "No jobs found" })
    }

    const languages: SupportedLanguage[] = ["en", "de", "fr", "it"]
    const results = {
      total: jobs.length,
      processed: 0,
      skipped: 0,
      errors: 0,
      details: [] as string[]
    }

    // Process ONE job at a time to avoid rate limits
    for (let i = 0; i < jobs.length; i++) {
      const job: any = jobs[i]
      const contentId = `job-${job.source || 'db'}-${job.external_id || job.id}`

      console.log(`Processing job ${i + 1}/${jobs.length}: ${job.title?.substring(0, 40)}...`)

      try {
        // Check if all translations already exist (unless force retranslate)
        if (!forceRetranslate) {
          let allExist = true
          for (const lang of languages) {
            const existing = await getStoredTranslation(contentId, lang, "job" as ContentType)
            if (!existing || !existing.title) {
              allExist = false
              break
            }
          }
          
          if (allExist) {
            console.log(`⏭ Skipped job ${i + 1}/${jobs.length} (already translated)`)
            results.skipped++
            continue
          }
        }

        // Translate to all languages sequentially
        for (const lang of languages) {
          // Check if this specific language translation exists
          if (!forceRetranslate) {
            const existing = await getStoredTranslation(contentId, lang, "job" as ContentType)
            if (existing && existing.title) {
              console.log(`  ⏭ Skipped ${lang} (already exists)`)
              continue
            }
          }

          const translated = await retryWithBackoff(async () => {
            return await translateJob(
              job.title,
              job.description || "",
              lang,
              undefined // Allow auto-detection of source
            )
          })

          if (translated && translated.title) {
            await storeTranslation(contentId, lang, "job" as ContentType, {
              title: translated.title,
              description: translated.description
            })
            console.log(`  ✓ Translated to ${lang}`)
          }

          // Wait 500ms between each language translation
          await delay(500)
        }

        results.processed++
        console.log(`✓ Completed job ${i + 1}/${jobs.length}`)
      } catch (err: any) {
        console.error(`Error processing job ${job.id}:`, err)
        results.errors++
        results.details.push(`Job ${job.id}: ${err.message}`)
      }

      // Wait 2 seconds between jobs to stay under rate limits
      await delay(2000)
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Processed ${results.processed} jobs, skipped ${results.skipped} already translated, ${results.errors} errors`
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
