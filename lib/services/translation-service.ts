/**
 * Translation Service - Supabase Only
 *
 * Fetches translations from the Supabase translations table.
 * No external APIs - all translations are pre-stored in the database.
 * 
 * Translation Table Structure:
 * - content_id: Unique identifier (e.g., "job-rapidapi-jsearch-{id}", "deal-db-{id}", "blog-{uuid}")
 * - language: Language code (en, de, fr, it)
 * - type: Content type (job, deal, blog, category, page)
 * - translations: JSONB with translated fields (title, description, content, etc.)
 */

import {createClient} from "@/lib/supabase/server"

export type SupportedLanguage = "en" | "de" | "fr" | "it"
export type ContentType = "job" | "deal" | "blog" | "category" | "page"

export interface TranslationFields {
  title?: string
  description?: string
  excerpt?: string
  content?: string
  name?: string // For categories
  location?: string // For jobs
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

/**
 * Get stored translation from Supabase for a single item
 */
export async function getStoredTranslation(
  contentId: string,
  language: string,
  type: ContentType
): Promise<TranslationFields | null> {
  try {
    const supabase = await createClient()

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
 * Get translations for multiple content items at once (batch)
 */
export async function getStoredTranslationsBatch(
  contentIds: string[],
  language: string,
  type: ContentType
): Promise<Map<string, TranslationFields>> {
  const result = new Map<string, TranslationFields>()

  if (contentIds.length === 0) {
    return result
  }

  try {
    const supabase = await createClient()

    const {data, error} = await (supabase as any)
      .from("translations")
      .select("content_id, translations")
      .in("content_id", contentIds)
      .eq("language", language)
      .eq("type", type)

    if (error || !data) {
      console.error("Error fetching batch translations:", error)
      return result
    }

    for (const row of data as any[]) {
      result.set(row.content_id, row.translations as TranslationFields)
    }

    console.log(`[Translation] Fetched ${result.size}/${contentIds.length} translations for ${language}`)
    return result
  } catch (error) {
    console.error("Error getting batch translations:", error)
    return result
  }
}

/**
 * Store translation in Supabase (for admin/cron jobs)
 */
export async function storeTranslation(
  contentId: string,
  language: string,
  type: ContentType,
  translations: TranslationFields
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const {error} = await (supabase as any).from("translations").upsert(
      {
        content_id: contentId,
        language,
        type,
        translations,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "content_id,language",
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
 * Build content ID for different content types
 * Note: Different sources use different ID formats:
 *   - adzuna: uses offer.id (UUID)
 *   - rapidapi-*: uses offer.external_id
 *   - db (user-posted): uses offer.id (UUID)
 */
export function buildContentId(type: ContentType, id: string, source?: string): string {
  if (type === "blog" || type === "page") {
    return `${type}-${id}`
  }
  // For jobs and deals, include source
  return `${type}-${source || "db"}-${id}`
}

export function buildContentIdCandidates(
  type: ContentType,
  source: string | undefined,
  ids: unknown[]
): string[] {
  const out: string[] = []
  const seen = new Set<string>()

  for (const raw of ids) {
    const id =
      typeof raw === "string" ? raw : typeof raw === "number" ? String(raw) : ""
    if (!id) continue

    const primary = buildContentId(type, id, source)
    if (!seen.has(primary)) {
      seen.add(primary)
      out.push(primary)
    }

    if (type === "job") {
      const legacy = `${type}-${id}`
      if (!seen.has(legacy)) {
        seen.add(legacy)
        out.push(legacy)
      }
    }
  }

  return out
}

/**
 * Apply stored translations to items from Supabase database
 * Falls back to original content if translation is not available
 */
export async function applyStoredTranslations<T extends {id: string}>(
  items: T[],
  type: ContentType,
  language: string,
  fields: (keyof T & keyof TranslationFields)[]
): Promise<T[]> {
  if (items.length === 0 || !language) {
    return items
  }

  // Build content IDs based on source type:
  // - adzuna: uses offer.id (UUID)
  // - rapidapi-*: uses external_id
  // - db (user-posted): uses offer.id (UUID)
  const contentIds = items.map((item, index) => {
    const source = (item as any).source || "db"
    // For adzuna and db jobs, use the database id (UUID)
    // For rapidapi-* jobs, use the external_id
    let itemId: string
    if (source === "adzuna" || source === "db" || !source) {
      itemId = item.id
    } else {
      // For rapidapi sources, prefer externalId/external_id
      itemId = (item as any).externalId || (item as any).external_id || item.id
    }
    const contentId = buildContentId(type, itemId, source)
    if (index < 3) {
      console.log(`[Translation Debug] Item ${index}: source=${source}, id=${item.id}, externalId=${(item as any).externalId}, contentId=${contentId}`)
    }
    return contentId
  })

  // Fetch all translations in one batch query
  const storedTranslations = await getStoredTranslationsBatch(
    contentIds,
    language,
    type
  )

  // Apply translations, falling back to original content
  return items.map((item, index) => {
    const contentId = contentIds[index]
    const translation = storedTranslations.get(contentId)

    if (!translation) {
      return item
    }

    const newItem = {...item}
    fields.forEach(field => {
      const translatedValue = translation[field as keyof TranslationFields]
      if (translatedValue) {
        ;(newItem as any)[field] = translatedValue
      }
    })

    return newItem
  })
}

/**
 * Legacy compatibility - translationService object
 * Used by existing API routes
 */
export const translationService = {
  /**
   * Translate jobs using Supabase translations only
   */
  async translateJobs(jobs: any[], targetLanguage: string): Promise<any[]> {
    if (!targetLanguage || jobs.length === 0) return jobs

    return applyStoredTranslations(
      jobs,
      "job",
      targetLanguage,
      ["title", "description"]
    )
  },

  /**
   * Translate deals using Supabase translations only
   */
  async translateDeals(deals: any[], targetLanguage: string): Promise<any[]> {
    if (!targetLanguage || deals.length === 0) return deals

    return applyStoredTranslations(
      deals,
      "deal",
      targetLanguage,
      ["title", "description"]
    )
  },

  /**
   * Translate blogs using Supabase translations only
   */
  async translateBlogs(blogs: any[], targetLanguage: string): Promise<any[]> {
    if (!targetLanguage || blogs.length === 0) return blogs

    return applyStoredTranslations(
      blogs,
      "blog",
      targetLanguage,
      ["title", "description", "excerpt", "content"]
    )
  },

  /**
   * Translate categories using Supabase translations only
   */
  async translateCategories(categories: any[], targetLanguage: string): Promise<any[]> {
    if (!targetLanguage || categories.length === 0) return categories

    // Categories use 'name' instead of 'title'
    const contentIds = categories.map(cat => buildContentId("category", cat.id))
    const translations = await getStoredTranslationsBatch(contentIds, targetLanguage, "category")

    return categories.map((cat, index) => {
      const translation = translations.get(contentIds[index])
      if (!translation) return cat

      return {
        ...cat,
        name: translation.name || cat.name,
        description: translation.description || cat.description,
      }
    })
  },

  /**
   * Translate a single item (job, deal, blog)
   */
  async translateSingle(
    item: any,
    type: ContentType,
    targetLanguage: string
  ): Promise<any> {
    if (!targetLanguage || !item) return item

    const contentId = buildContentId(type, item.id, item.source)
    const translation = await getStoredTranslation(contentId, targetLanguage, type)

    if (!translation) {
      return item
    }

    // Apply translation fields based on type
    const result = {...item}
    
    if (translation.title) result.title = translation.title
    if (translation.description) result.description = translation.description
    if (translation.content) result.content = translation.content
    if (translation.excerpt) result.excerpt = translation.excerpt
    if (translation.name) result.name = translation.name
    if (translation.location) result.location = translation.location

    return result
  },
}

// Re-export for backwards compatibility
export {
  ALL_LANGUAGES,
}
