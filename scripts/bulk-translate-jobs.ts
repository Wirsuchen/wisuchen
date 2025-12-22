#!/usr/bin/env ts-node
/**
 * Bulk Job Translation Script
 * Translates all untranslated jobs and saves to Supabase
 */

import {createClient} from "@supabase/supabase-js"
import {translateText} from "@/lib/services/lingva-translate"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const LANGUAGES = ["de", "fr", "it"]
const BATCH_SIZE = 50
const DELAY_MS = 500

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function translateJob(
  title: string,
  description: string,
  lang: string
): Promise<{title: string; description: string}> {
  try {
    const titleResult = await translateText(title, lang as any, "en")
    const descResult = await translateText(
      (description || "").substring(0, 1500),
      lang as any,
      "en"
    )

    return {
      title: titleResult.translation || title,
      description: descResult.translation || description,
    }
  } catch (error) {
    console.error(`Translation error for lang ${lang}:`, error)
    return {title, description}
  }
}

async function main() {
  try {
    console.log("🚀 Starting bulk job translation...")

    // Get all untranslated jobs
    const {data: jobs, error: jobError} = await supabase
      .from("offers")
      .select("id, title, description, source")
      .eq("type", "job")
      .eq("status", "active")
      .limit(1500)

    if (jobError || !jobs) {
      console.error("Error fetching jobs:", jobError)
      return
    }

    console.log(`📝 Found ${jobs.length} jobs to translate`)

    // Process in batches
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE)
      console.log(
        `\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
          jobs.length / BATCH_SIZE
        )}`
      )

      for (const job of batch) {
        const contentId = `job-${job.source || "db"}-${job.id}`

        // Translate to each language
        for (const lang of LANGUAGES) {
          try {
            const translations = await translateJob(
              job.title || "",
              job.description || "",
              lang
            )

            // Save to database
            const {error: insertError} = await supabase
              .from("translations")
              .upsert(
                {
                  content_id: contentId,
                  language: lang,
                  type: "job",
                  translations,
                  updated_at: new Date().toISOString(),
                },
                {onConflict: "content_id,language,type"}
              )

            if (insertError) {
              console.error(
                `Error saving translation for ${contentId}/${lang}:`,
                insertError
              )
            } else {
              console.log(`✅ Translated ${job.title} to ${lang}`)
            }

            await sleep(DELAY_MS)
          } catch (error) {
            console.error(`Error processing job ${job.id}:`, error)
          }
        }
      }

      console.log(
        `✓ Batch complete. Processed ${Math.min(i + BATCH_SIZE, jobs.length)}/${
          jobs.length
        }`
      )
    }

    console.log("\n✅ Translation complete!")
  } catch (error) {
    console.error("Fatal error:", error)
  }
}

main()
