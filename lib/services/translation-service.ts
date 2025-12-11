/**
 * Backend Translation Service with Supabase Storage
 * 
 * Stores translations in database for instant retrieval.
 * Uses Gemini AI for translations with structured JSON output.
 */

import { createClient } from '@/lib/supabase/server'
import { translateText } from '@/lib/services/lingva-translate'
import { translateToAllLanguages, MultiLanguageTranslation } from '@/lib/services/ai/gemini'

export type SupportedLanguage = 'en' | 'de' | 'fr' | 'it'
export type ContentType = 'job' | 'deal' | 'blog'

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

// Languages to translate to (excluding English which is the source)
const TARGET_LANGUAGES: SupportedLanguage[] = ['de', 'fr', 'it']

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
    const { data, error } = await (supabase as any)
      .from('translations')
      .select('translations')
      .eq('content_id', contentId)
      .eq('language', language)
      .eq('type', type)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data.translations as TranslationFields
  } catch (error) {
    console.error('Error getting stored translation:', error)
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
  
  if (contentIds.length === 0 || language === 'en') {
    return result
  }
  
  try {
    const supabase = await createClient()
    
    // Use type assertion since translations table isn't in generated types yet
    const { data, error } = await (supabase as any)
      .from('translations')
      .select('content_id, translations')
      .in('content_id', contentIds)
      .eq('language', language)
      .eq('type', type)
    
    if (error || !data) {
      return result
    }
    
    for (const row of data as any[]) {
      result.set(row.content_id, row.translations as TranslationFields)
    }
    
    return result
  } catch (error) {
    console.error('Error getting batch translations:', error)
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
    const { error } = await (supabase as any)
      .from('translations')
      .upsert({
        content_id: contentId,
        language,
        type,
        translations,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'content_id,language,type'
      })
    
    if (error) {
      console.error('Error storing translation:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error storing translation:', error)
    return false
  }
}

/**
 * Translate fields using Lingva (FREE)
 */
async function translateFields(
  fields: TranslationFields,
  targetLanguage: SupportedLanguage
): Promise<TranslationFields> {
  const result: TranslationFields = {}
  
  for (const [key, value] of Object.entries(fields)) {
    if (value && typeof value === 'string' && value.trim().length > 0) {
      const translated = await translateText(value, targetLanguage, 'en')
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
  languages: SupportedLanguage[] = TARGET_LANGUAGES
): Promise<void> {
  for (const lang of languages) {
    if (lang === 'en') continue
    
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
  items: Array<{ id: string; fields: TranslationFields }>,
  type: ContentType,
  languages: SupportedLanguage[] = TARGET_LANGUAGES,
  delayMs: number = 500,
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0
  const total = items.length * languages.filter(l => l !== 'en').length
  let completed = 0
  
  for (const item of items) {
    for (const lang of languages) {
      if (lang === 'en') continue
      
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
  
  return { success, failed }
}

/**
 * Translate items to ALL languages using Gemini AI with structured output
 * Optimized for 20 RPM rate limit (3500ms delay between calls)
 * Each API call translates to EN/DE/FR/IT simultaneously
 * 
 * SMART TRANSLATION: Checks if translations already exist and skips fully translated items
 */
export async function translateBatchWithGemini(
  items: Array<{ id: string; title: string; description: string }>,
  type: ContentType,
  delayMs: number = 3500, // 20 RPM = 3 seconds + buffer
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number; skipped: number }> {
  let success = 0
  let failed = 0
  let skipped = 0
  const total = items.length
  const targetLanguages: SupportedLanguage[] = ['de', 'fr', 'it']
  
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
        console.log(`⏭ Skipped ${i + 1}/${total} (already translated): ${item.title.substring(0, 40)}...`)
        onProgress?.(i + 1, total)
        continue
      }
      
      // Translate to all 4 languages in one API call
      const result = await translateToAllLanguages({
        title: item.title,
        description: item.description?.substring(0, 1500) || '', // Limit description length
        contentType: type,
      })
      
      if (result.success && result.translations) {
        // Store all 4 translations
        const languages: (keyof MultiLanguageTranslation)[] = ['en', 'de', 'fr', 'it']
        
        for (const lang of languages) {
          const translation = result.translations[lang]
          await storeTranslation(item.id, lang, type, {
            title: translation.title,
            description: translation.description,
          })
        }
        
        success++
        console.log(`✓ Translated ${i + 1}/${total}: ${item.title.substring(0, 40)}...`)
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
  
  console.log(`\n📊 Translation Summary: ${success} translated, ${skipped} skipped, ${failed} failed`)
  return { success, failed, skipped }
}

/**
 * Apply stored translations to a list of items
 * Falls back to original content if translation missing
 */
export async function applyTranslations<T extends { id: string }>(
  items: T[],
  type: ContentType,
  language: string,
  fieldMappings: { source: keyof T; target: keyof T }[]
): Promise<T[]> {
  if (language === 'en' || items.length === 0) {
    return items
  }
  
  // Get all translations in one query
  const contentIds = items.map(item => `${type}-${item.id}`)
  const translations = await getStoredTranslationsBatch(contentIds, language, type)
  
  // Apply translations, falling back to original
  return items.map(item => {
    const translation = translations.get(`${type}-${item.id}`)
    if (!translation) {
      return item
    }
    
    const result = { ...item }
    for (const mapping of fieldMappings) {
      const translatedValue = translation[mapping.source as keyof TranslationFields]
      if (translatedValue) {
        (result as any)[mapping.target] = translatedValue
      }
    }
    
    return result
  })
}

// Legacy compatibility - keeping old translationService object
export const translationService = {
  async translateBatch(texts: string[], targetLanguage: 'de' | 'en' | 'fr' | 'it'): Promise<string[]> {
    if (targetLanguage === 'en') return texts
    
    const results: string[] = []
    for (const text of texts) {
      const translated = await translateText(text, targetLanguage, 'en')
      results.push(translated.translation || text)
    }
    return results
  },
  
  async translateJobs(jobs: any[], targetLanguage: string): Promise<any[]> {
    if (!targetLanguage || targetLanguage === 'en') return jobs
    return applyTranslations(jobs, 'job', targetLanguage, [
      { source: 'title' as any, target: 'title' as any },
      { source: 'description' as any, target: 'description' as any }
    ])
  },
  
  async translateDeals(deals: any[], targetLanguage: string): Promise<any[]> {
    if (!targetLanguage || targetLanguage === 'en') return deals
    return applyTranslations(deals, 'deal', targetLanguage, [
      { source: 'title' as any, target: 'title' as any },
      { source: 'description' as any, target: 'description' as any }
    ])
  }
}
