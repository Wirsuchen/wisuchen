/**
 * Smart Background Translation Service for Jobs
 *
 * Features:
 * - Respects Gemini/Lingva free API limits
 * - Handles 429 (rate limit) errors gracefully
 * - Uses exponential backoff
 * - Tracks daily usage to stay within limits
 * - Proper timing gaps between requests
 *
 * Gemini Free Tier Limits:
 * - 15 requests per minute
 * - 1500 requests per day
 * - 32,000 tokens per minute
 *
 * Usage: GET /api/cron/translate-jobs?secret=YOUR_CRON_SECRET
 */

import {createClient} from "@/lib/supabase/server"
import {NextRequest, NextResponse} from "next/server"
import {
  storeTranslation,
  getStoredTranslation,
  ContentType,
  SupportedLanguage,
} from "@/lib/services/translation-service"
import {translateText} from "@/lib/services/lingva-translate"

// Target languages for translation
const TARGET_LANGUAGES: SupportedLanguage[] = ["de", "fr", "it"]

// Conservative limits to stay well within free tier
const CONFIG = {
  // Max translations per cron run (each job = 2 API calls per language)
  MAX_TRANSLATIONS_PER_RUN: 10,

  // Delay between each translation (ms) - 4 seconds = max 15/min
  BASE_DELAY_MS: 4000,

  // Max delay after rate limit hit
  MAX_DELAY_MS: 60000,

  // Max retries on rate limit
  MAX_RETRIES: 3,

  // Stop if we hit this many consecutive errors
  MAX_CONSECUTIVE_ERRORS: 3,

  // Daily limit tracking (reset at midnight UTC)
  DAILY_LIMIT: 100, // Very conservative - actual limit is 1500
}

// Simple in-memory rate limit tracker (resets on deploy/restart)
// For production, use Redis or database
let dailyUsage = {
  count: 0,
  date: new Date().toISOString().split("T")[0],
}

function resetDailyUsageIfNeeded() {
  const today = new Date().toISOString().split("T")[0]
  if (dailyUsage.date !== today) {
    console.log(
      `[Cron] Resetting daily usage counter. Previous: ${dailyUsage.count}`
    )
    dailyUsage = {count: 0, date: today}
  }
}

function canMakeRequest(): boolean {
  resetDailyUsageIfNeeded()
  return dailyUsage.count < CONFIG.DAILY_LIMIT
}

function incrementUsage() {
  dailyUsage.count++
}

// Smart delay with exponential backoff
async function smartDelay(attempt: number, baseDelay: number): Promise<void> {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), CONFIG.MAX_DELAY_MS)
  console.log(`[Cron] Waiting ${delay}ms before next request...`)
  await new Promise(resolve => setTimeout(resolve, delay))
}

// Translate with retry logic for 429 errors
async function translateWithRetry(
  text: string,
  targetLang: SupportedLanguage,
  sourceLang: string = "en"
): Promise<{translation: string | null; rateLimited: boolean}> {
  for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
    try {
      if (!canMakeRequest()) {
        console.log(
          `[Cron] Daily limit reached (${dailyUsage.count}/${CONFIG.DAILY_LIMIT})`
        )
        return {translation: null, rateLimited: true}
      }

      const result = await translateText(text, targetLang, sourceLang)
      incrementUsage()

      return {translation: result.translation, rateLimited: false}
    } catch (error: any) {
      const statusCode = error?.status || error?.response?.status || 0
      const errorMessage = error?.message || ""

      // Check for rate limit error (429)
      if (
        statusCode === 429 ||
        errorMessage.includes("429") ||
        errorMessage.toLowerCase().includes("rate limit")
      ) {
        console.log(
          `[Cron] Rate limit hit (429). Attempt ${attempt + 1}/${
            CONFIG.MAX_RETRIES
          }`
        )

        if (attempt < CONFIG.MAX_RETRIES - 1) {
          // Wait with exponential backoff
          await smartDelay(attempt + 1, CONFIG.BASE_DELAY_MS * 2)
          continue
        }

        return {translation: null, rateLimited: true}
      }

      // Other errors - don't retry
      console.error(`[Cron] Translation error:`, error)
      throw error
    }
  }

  return {translation: null, rateLimited: false}
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify cron secret for security
    const url = new URL(request.url)
    const secret = url.searchParams.get("secret")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    // Check daily limit before starting
    resetDailyUsageIfNeeded()
    if (!canMakeRequest()) {
      return NextResponse.json({
        message: "Daily limit reached, try again tomorrow",
        dailyUsage: dailyUsage.count,
        dailyLimit: CONFIG.DAILY_LIMIT,
        resetsAt: "Midnight UTC",
      })
    }

    const supabase = await createClient()

    // Get jobs that need translation
    const {data: jobs, error} = await supabase
      .from("offers")
      .select("id, title, description, source, created_at")
      .eq("type", "job")
      .in("status", ["active", "pending"])
      .order("created_at", {ascending: false})
      .limit(CONFIG.MAX_TRANSLATIONS_PER_RUN * 3)

    if (error) {
      console.error("[Cron] Error fetching jobs:", error)
      return NextResponse.json({error: "Failed to fetch jobs"}, {status: 500})
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        message: "No jobs found",
        processed: 0,
      })
    }

    console.log(
      `[Cron] Checking ${jobs.length} jobs for missing translations...`
    )

    let translated = 0
    let skipped = 0
    let failed = 0
    let rateLimited = false
    let consecutiveErrors = 0

    // Process each job
    for (const job of jobs) {
      // Stop if we've hit rate limit or too many errors
      if (rateLimited) {
        console.log("[Cron] Stopping due to rate limit")
        break
      }

      if (consecutiveErrors >= CONFIG.MAX_CONSECUTIVE_ERRORS) {
        console.log("[Cron] Stopping due to consecutive errors")
        break
      }

      if (translated >= CONFIG.MAX_TRANSLATIONS_PER_RUN) {
        console.log(
          `[Cron] Reached max translations per run (${CONFIG.MAX_TRANSLATIONS_PER_RUN})`
        )
        break
      }

      if (!canMakeRequest()) {
        console.log("[Cron] Daily limit reached during processing")
        break
      }

      const source = job.source || "db"
      const contentId = `job-${source}-${job.id}`

      // Check each target language
      for (const lang of TARGET_LANGUAGES) {
        if (rateLimited || !canMakeRequest()) break

        try {
          // Check if translation already exists
          const existingTranslation = await getStoredTranslation(
            contentId,
            lang,
            "job" as ContentType
          )

          if (existingTranslation) {
            skipped++
            continue
          }

          console.log(`[Cron] Translating job ${job.id} to ${lang}...`)

          // Translate title
          const titleResult = await translateWithRetry(
            job.title || "",
            lang,
            "en"
          )
          if (titleResult.rateLimited) {
            rateLimited = true
            break
          }

          // Wait between requests
          await smartDelay(0, CONFIG.BASE_DELAY_MS)

          // Translate description (truncated to save tokens)
          const descResult = await translateWithRetry(
            (job.description || "").substring(0, 1500),
            lang,
            "en"
          )
          if (descResult.rateLimited) {
            rateLimited = true
            break
          }

          // Store translation
          const translationData = {
            title: titleResult.translation || job.title,
            description: descResult.translation || job.description,
          }

          const stored = await storeTranslation(
            contentId,
            lang,
            "job",
            translationData
          )

          if (stored) {
            translated++
            consecutiveErrors = 0
            console.log(`[Cron] ✓ Translated job ${job.id} to ${lang}`)
          } else {
            failed++
            consecutiveErrors++
          }

          // Wait before next translation
          await smartDelay(0, CONFIG.BASE_DELAY_MS)
        } catch (err) {
          failed++
          consecutiveErrors++
          console.error(`[Cron] ✗ Failed job ${job.id} to ${lang}:`, err)
        }
      }
    }

    const duration = Date.now() - startTime

    const summary = {
      message: rateLimited
        ? "Stopped early due to rate limit"
        : "Translation job completed",
      duration: `${(duration / 1000).toFixed(1)}s`,
      translated,
      skipped,
      failed,
      rateLimited,
      dailyUsage: dailyUsage.count,
      dailyLimit: CONFIG.DAILY_LIMIT,
      remainingToday: CONFIG.DAILY_LIMIT - dailyUsage.count,
    }

    console.log(`[Cron] Summary:`, summary)

    return NextResponse.json(summary)
  } catch (error) {
    console.error("[Cron] Translation service error:", error)
    return NextResponse.json({error: "Internal server error"}, {status: 500})
  }
}

// POST method for manual trigger from admin panel
export async function POST(request: NextRequest) {
  return GET(request)
}
