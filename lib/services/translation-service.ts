/**
 * Backend Translation Service with Supabase Storage
 *
 * Stores translations in database for instant retrieval.
 * Uses Gemini AI for translations with structured JSON output.
 */

import {createClient} from "@/lib/supabase/server"
import {translateText} from "@/lib/services/lingva-translate"
import {
  translateToAllLanguages,
  MultiLanguageTranslation,
} from "@/lib/services/ai/gemini"

export type SupportedLanguage = "en" | "de" | "fr" | "it"
export type ContentType = "job" | "deal" | "blog"

export interface TranslationFields {
  title?: string
  description?: string
  excerpt?: string
  content?: string
}

interface StoredTranslation {
  id: string
  content_id: string
  language: string
  type: string
  translations: TranslationFields
  created_at: string
  updated_at: string
}

// All supported languages
const ALL_LANGUAGES: SupportedLanguage[] = ["en", "de", "fr", "it"]

// Languages to translate to (excluding English which is the source)
const TARGET_LANGUAGES: SupportedLanguage[] = ["de", "fr", "it"]

/**
 * Detect the source language of text based on common word patterns
 */
export function detectLanguage(text: string): SupportedLanguage {
  const lowerText = text.toLowerCase()

  const germanIndicators = [
    "und",
    "für",
    "mit",
    "bei",
    "wir",
    "sie",
    "der",
    "die",
    "das",
    "ist",
    "ä",
    "ö",
    "ü",
    "ihre",
    "unser",
    "werden",
  ]
  const frenchIndicators = [
    "pour",
    "avec",
    "dans",
    "nous",
    "vous",
    "les",
    "des",
    "une",
    "sont",
    "cette",
    "é",
    "è",
    "ê",
    "notre",
    "votre",
  ]
  const italianIndicators = [
    "per",
    "con",
    "che",
    "sono",
    "della",
    "nella",
    "questo",
    "questa",
    "è",
    "ò",
    "ù",
    "nostro",
    "vostro",
  ]

  const hasGerman = germanIndicators.filter(ind =>
    lowerText.includes(ind)
  ).length
  const hasFrench = frenchIndicators.filter(ind =>
    lowerText.includes(ind)
  ).length
  const hasItalian = italianIndicators.filter(ind =>
    lowerText.includes(ind)
  ).length

  // Return language with most matches, default to English
  const max = Math.max(hasGerman, hasFrench, hasItalian)
  if (max === 0) return "en"
  if (hasGerman === max && hasGerman > hasFrench && hasGerman > hasItalian)
    return "de"
  if (hasFrench === max && hasFrench > hasGerman && hasFrench > hasItalian)
    return "fr"
  if (hasItalian === max && hasItalian > hasGerman && hasItalian > hasFrench)
    return "it"

  return "en" // Default
}

/**
 * Auto-translate content to all 4 languages
 * Detects source language and translates to all others
 * Returns content_id for the translations
 */
export async function autoTranslateToAllLanguages(
  contentId: string,
  type: ContentType,
  fields: TranslationFields
): Promise<{
  success: boolean
  sourceLanguage: SupportedLanguage
  translatedLanguages: SupportedLanguage[]
}> {
  const translatedLanguages: SupportedLanguage[] = []

  try {
    // Combine all text fields for language detection
    const combinedText = Object.values(fields)
      .filter(v => typeof v === "string")
      .join(" ")
    const sourceLanguage = detectLanguage(combinedText)

    console.log(
      `[Translation] Detected source language: ${sourceLanguage} for ${contentId}`
    )

    // Store original content for source language
    await storeTranslation(contentId, sourceLanguage, type, fields)
    translatedLanguages.push(sourceLanguage)
    console.log(
      `[Translation] Stored original ${sourceLanguage} content for ${contentId}`
    )

    // Translate to all other languages
    const targetLanguages = ALL_LANGUAGES.filter(
      lang => lang !== sourceLanguage
    )

    for (const targetLang of targetLanguages) {
      try {
        const translated: TranslationFields = {}

        for (const [key, value] of Object.entries(fields)) {
          if (value && typeof value === "string" && value.trim().length > 0) {
            // Truncate very long content for translation
            const textToTranslate = value.substring(0, 3000)
            const result = await translateText(
              textToTranslate,
              targetLang,
              sourceLanguage
            )
            translated[key as keyof TranslationFields] =
              result.translation || value
          }
        }

        await storeTranslation(contentId, targetLang, type, translated)
        translatedLanguages.push(targetLang)
        console.log(
          `[Translation] Created ${targetLang} translation for ${contentId}`
        )

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (err) {
        console.error(
          `[Translation] Failed to translate ${contentId} to ${targetLang}:`,
          err
        )
      }
    }

    console.log(
      `[Translation] ✓ Completed ${translatedLanguages.length}/4 translations for ${contentId}`
    )
    return {success: true, sourceLanguage, translatedLanguages}
  } catch (error) {
    console.error(
      `[Translation] Auto-translate failed for ${contentId}:`,
      error
    )
    return {success: false, sourceLanguage: "en", translatedLanguages}
  }
}

/**
 * Get stored translations from Supabase
 */
export async function getStoredTranslation(
  contentId: string,
  language: string,
  type: ContentType
): Promise<TranslationFields | null> {
  try {
    const supabase = await createClient()

    // Use type assertion since translations table isn't in generated types yet
    const {data, error} = await (supabase as any)
      .from("translations")
      .select("translations")
      .eq("content_id", contentId)
      .eq("language", language)
      .eq("type", type)
      .single()

    if (error || !data) {
      return null
    }

    return data.translations as TranslationFields
  } catch (error) {
    console.error("Error getting stored translation:", error)
    return null
  }
}

/**
 * Get translations for multiple content items at once
 */
export async function getStoredTranslationsBatch(
  contentIds: string[],
  language: string,
  type: ContentType
): Promise<Map<string, TranslationFields>> {
  const result = new Map<string, TranslationFields>()

  if (contentIds.length === 0 || language === "en") {
    return result
  }

  try {
    const supabase = await createClient()

    // Use type assertion since translations table isn't in generated types yet
    const {data, error} = await (supabase as any)
      .from("translations")
      .select("content_id, translations")
      .in("content_id", contentIds)
      .eq("language", language)
      .eq("type", type)

    if (error || !data) {
      return result
    }

    for (const row of data as any[]) {
      result.set(row.content_id, row.translations as TranslationFields)
    }

    return result
  } catch (error) {
    console.error("Error getting batch translations:", error)
    return result
  }
}

/**
 * Store translation in Supabase
 */
export async function storeTranslation(
  contentId: string,
  language: string,
  type: ContentType,
  translations: TranslationFields
): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Use type assertion since translations table isn't in generated types yet
    const {error} = await (supabase as any).from("translations").upsert(
      {
        content_id: contentId,
        language,
        type,
        translations,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "content_id,language,type",
      }
    )

    if (error) {
      console.error("Error storing translation:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error storing translation:", error)
    return false
  }
}

/**
 * Translate fields using Lingva (FREE)
 * Now supports auto-detection of source language when translating TO English
 */
async function translateFields(
  fields: TranslationFields,
  targetLanguage: SupportedLanguage
): Promise<TranslationFields> {
  const result: TranslationFields = {}

  for (const [key, value] of Object.entries(fields)) {
    if (value && typeof value === "string" && value.trim().length > 0) {
      // When translating TO English, auto-detect source language
      // When translating FROM English, use "en" as source
      const sourceLang = targetLanguage === "en" ? "auto" : "en"
      const translated = await translateText(
        value,
        targetLanguage,
        sourceLang as any
      )
      result[key as keyof TranslationFields] = translated.translation || value
    }
  }

  return result
}

/**
 * Ensure content is translated to all languages and stored in DB
 * Returns immediately if translations exist, otherwise translates and stores
 */
export async function ensureTranslated(
  contentId: string,
  type: ContentType,
  fields: TranslationFields,
  languages: SupportedLanguage[] = ALL_LANGUAGES // Use ALL_LANGUAGES to include English
): Promise<void> {
  for (const lang of languages) {
    // Check if translation exists
    const existing = await getStoredTranslation(contentId, lang, type)
    if (existing) continue

    // Translate and store
    try {
      const translated = await translateFields(fields, lang)
      await storeTranslation(contentId, lang, type, translated)

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.error(`Error translating ${contentId} to ${lang}:`, error)
    }
  }
}

/**
 * Translate a batch of content items with small delays
 * Used for bulk translation jobs
 */
export async function translateBatchWithDelay(
  items: Array<{id: string; fields: TranslationFields}>,
  type: ContentType,
  languages: SupportedLanguage[] = TARGET_LANGUAGES,
  delayMs: number = 500,
  onProgress?: (completed: number, total: number) => void
): Promise<{success: number; failed: number}> {
  let success = 0
  let failed = 0
  const total = items.length * languages.filter(l => l !== "en").length
  let completed = 0

  for (const item of items) {
    for (const lang of languages) {
      if (lang === "en") continue

      try {
        // Check if already exists
        const existing = await getStoredTranslation(item.id, lang, type)
        if (existing) {
          success++
          completed++
          continue
        }

        // Translate
        const translated = await translateFields(item.fields, lang)
        const stored = await storeTranslation(item.id, lang, type, translated)

        if (stored) {
          success++
        } else {
          failed++
        }

        completed++
        onProgress?.(completed, total)

        // Delay between translations
        await new Promise(resolve => setTimeout(resolve, delayMs))
      } catch (error) {
        console.error(`Error translating ${item.id} to ${lang}:`, error)
        failed++
        completed++
      }
    }
  }

  return {success, failed}
}

/**
 * Translate items to ALL languages using Gemini AI with structured output
 * Optimized for 20 RPM rate limit (3500ms delay between calls)
 * Each API call translates to EN/DE/FR/IT simultaneously
 *
 * SMART TRANSLATION: Checks if translations already exist and skips fully translated items
 */
export async function translateBatchWithGemini(
  items: Array<{id: string; title: string; description: string}>,
  type: ContentType,
  delayMs: number = 3500, // 20 RPM = 3 seconds + buffer
  onProgress?: (completed: number, total: number) => void
): Promise<{success: number; failed: number; skipped: number}> {
  let success = 0
  let failed = 0
  let skipped = 0
  const total = items.length
  const targetLanguages: SupportedLanguage[] = ["de", "fr", "it"]

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    try {
      // Check if all translations already exist for this item
      let allTranslationsExist = true
      for (const lang of targetLanguages) {
        const existing = await getStoredTranslation(item.id, lang, type)
        if (!existing || !existing.title) {
          allTranslationsExist = false
          break
        }
      }

      // Skip if already fully translated
      if (allTranslationsExist) {
        skipped++
        console.log(
          `⏭ Skipped ${
            i + 1
          }/${total} (already translated): ${item.title.substring(0, 40)}...`
        )
        onProgress?.(i + 1, total)
        continue
      }

      // Translate to all 4 languages in one API call
      const result = await translateToAllLanguages({
        title: item.title,
        description: item.description?.substring(0, 1500) || "", // Limit description length
        contentType: type,
      })

      if (result.success && result.translations) {
        // Store all 4 translations
        const languages: (keyof MultiLanguageTranslation)[] = [
          "en",
          "de",
          "fr",
          "it",
        ]

        for (const lang of languages) {
          const translation = result.translations[lang]
          await storeTranslation(item.id, lang, type, {
            title: translation.title,
            description: translation.description,
          })
        }

        success++
        console.log(
          `✓ Translated ${i + 1}/${total}: ${item.title.substring(0, 40)}...`
        )
      } else {
        failed++
        console.error(`✗ Failed ${i + 1}/${total}: ${result.error}`)
      }

      // Delay to stay under 60 RPM rate limit (only after actual API call)
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      console.error(`✗ Error translating ${item.id}:`, error)
      failed++
    }

    onProgress?.(i + 1, total)
  }

  console.log(
    `\n📊 Translation Summary: ${success} translated, ${skipped} skipped, ${failed} failed`
  )
  return {success, failed, skipped}
}

/**
 * Fast path: Apply stored translations only (no API calls)
 * Used for pagination where jobs are already filtered to those with translations
 */
async function applyStoredTranslationsOnly<T extends {id: string}>(
  items: T[],
  type: ContentType,
  language: string,
  fields: (keyof T & keyof TranslationFields)[]
): Promise<T[]> {
  if (items.length === 0) {
    return items
  }

  // Build content IDs
  const contentIds = items.map(item => {
    const source = (item as any).source || "db"
    return `${type}-${source}-${item.id}`
  })

  // Single batch query to get all translations
  const storedTranslations = await getStoredTranslationsBatch(
    contentIds,
    language,
    type
  )

  // Apply translations, falling back to original content
  return items.map((item, index) => {
    const contentId = contentIds[index]
    const translation = storedTranslations.get(contentId)

    if (!translation) return item

    const newItem = {...item}
    fields.forEach(field => {
      const translatedValue = translation[field]
      if (translatedValue) {
        ;(newItem as any)[field] = translatedValue
      }
    })

    return newItem
  })
}

/**
 * Apply stored translations to a list of items
 * Falls back to original content if translation missing
 */
export async function applyTranslations<T extends {id: string}>(
  items: T[],
  type: ContentType,
  language: string,
  fieldMappings: {source: keyof T; target: keyof T}[]
): Promise<T[]> {
  if (language === "en" || items.length === 0) {
    return items
  }

  // Get all translations in one query
  const contentIds = items.map(item => {
    const source = (item as any).source || "db"
    return `${type}-${source}-${item.id}`
  })
  const translations = await getStoredTranslationsBatch(
    contentIds,
    language,
    type
  )

  // Apply translations, falling back to original
  return items.map(item => {
    const source = (item as any).source || "db"
    const translation = translations.get(`${type}-${source}-${item.id}`)
    if (!translation) {
      return item
    }

    const result = {...item}
    for (const mapping of fieldMappings) {
      const translatedValue =
        translation[mapping.source as keyof TranslationFields]
      if (translatedValue) {
        ;(result as any)[mapping.target] = translatedValue
      }
    }

    return result
  })
}

/**
 * Apply translations to items, generating them if missing
 * Now supports translating TO English (from German/French sources)
 */
async function translateAndApply<T extends {id: string}>(
  items: T[],
  type: ContentType,
  language: string,
  fields: (keyof T & keyof TranslationFields)[]
): Promise<T[]> {
  if (items.length === 0) {
    return items
  }

  // 1. Get existing translations
  const contentIds = items.map(item => {
    const source = (item as any).source || "db"
    return `${type}-${source}-${item.id}`
  })

  const storedTranslations = await getStoredTranslationsBatch(
    contentIds,
    language,
    type
  )

  // 2. Translate missing items
  const itemsToTranslate: {index: number; contentId: string; item: T}[] = []

  items.forEach((item, index) => {
    const contentId = contentIds[index]
    if (!storedTranslations.has(contentId)) {
      itemsToTranslate.push({index, contentId, item})
    }
  })

  if (itemsToTranslate.length > 0) {
    // Translate in parallel chunks to avoid overwhelming the API
    const chunkSize = 5
    for (let i = 0; i < itemsToTranslate.length; i += chunkSize) {
      const chunk = itemsToTranslate.slice(i, i + chunkSize)
      await Promise.all(
        chunk.map(async ({contentId, item}) => {
          const fieldsToTranslate: TranslationFields = {}
          let hasContent = false

          fields.forEach(field => {
            const value = (item as any)[field]
            if (typeof value === "string" && value.trim().length > 0) {
              fieldsToTranslate[field] = value
              hasContent = true
            }
          })

          if (hasContent) {
            try {
              const translated = await translateFields(
                fieldsToTranslate,
                language as SupportedLanguage
              )
              await storeTranslation(contentId, language, type, translated)
              storedTranslations.set(contentId, translated)
            } catch (error) {
              console.error(`Failed to translate ${contentId}:`, error)
            }
          }
        })
      )
    }
  }

  // 3. Apply translations
  return items.map((item, index) => {
    const contentId = contentIds[index]
    const translation = storedTranslations.get(contentId)

    if (!translation) return item

    const newItem = {...item}
    fields.forEach(field => {
      const translatedValue = translation[field]
      if (translatedValue) {
        ;(newItem as any)[field] = translatedValue
      }
    })

    return newItem
  })
}

// Legacy compatibility - keeping old translationService object
export const translationService = {
  async translateBatch(
    texts: string[],
    targetLanguage: "de" | "en" | "fr" | "it"
  ): Promise<string[]> {
    if (targetLanguage === "en") return texts

    const results: string[] = []
    for (const text of texts) {
      const translated = await translateText(text, targetLanguage, "en")
      results.push(translated.translation || text)
    }
    return results
  },

  async translateJobs(jobs: any[], targetLanguage: string): Promise<any[]> {
    // Always attempt translation - source content may be in German/French
    // and need translation to English or any other language
    if (!targetLanguage || jobs.length === 0) return jobs

    // Use fast path: only apply stored translations, don't generate new ones
    // This is much faster for pagination since jobs are already filtered to
    // only those with translations
    return applyStoredTranslationsOnly(jobs, "job", targetLanguage, [
      "title",
      "description",
    ])
  },

  async translateDeals(deals: any[], targetLanguage: string): Promise<any[]> {
    // Always attempt translation - source content may be in any language
    if (!targetLanguage || deals.length === 0) return deals

    // Use fast path: only apply stored translations, don't generate new ones
    return applyStoredTranslationsOnly(deals, "deal", targetLanguage, [
      "title",
      "description",
    ])
  },
}
