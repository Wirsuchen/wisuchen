/**
 * Google Cloud Translation API Service
 * 
 * This service handles translation of dynamic content (jobs, deals, blogs)
 * using the Google Cloud Translation API v2.
 * 
 * For static UI text, use the i18n system instead.
 */

// In-memory cache for translations to minimize API calls
// Key format: "hash:targetLang", Value: translated text
const translationCache = new Map<string, string>()

// Simple hash function for cache keys
function hashText(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

export type SupportedLanguage = 'en' | 'de' | 'fr' | 'it'

interface TranslationResult {
  success: boolean
  translation?: string
  error?: string
  fromCache?: boolean
}

interface BatchTranslationResult {
  success: boolean
  translations?: string[]
  error?: string
}

/**
 * Translate a single text using Google Cloud Translation API
 */
export async function translateText(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return { success: true, translation: text }
  }

  // Don't translate if source and target are the same
  if (sourceLanguage === targetLanguage) {
    return { success: true, translation: text }
  }

  // Check cache first
  const cacheKey = `${hashText(text)}:${targetLanguage}`
  const cached = translationCache.get(cacheKey)
  if (cached) {
    return { success: true, translation: cached, fromCache: true }
  }

  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY

  if (!apiKey) {
    console.warn('⚠️ GOOGLE_CLOUD_TRANSLATE_API_KEY not found, falling back to Gemini translation')
    // Fallback to Gemini translation
    return fallbackToGemini(text, targetLanguage, sourceLanguage)
  }

  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        source: sourceLanguage,
        format: 'text',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Google Translate API error:', errorData)
      return { 
        success: false, 
        error: errorData?.error?.message || `API error: ${response.status}` 
      }
    }

    const data = await response.json()
    const translatedText = data?.data?.translations?.[0]?.translatedText

    if (!translatedText) {
      return { success: false, error: 'No translation returned' }
    }

    // Cache the result
    translationCache.set(cacheKey, translatedText)

    return { success: true, translation: translatedText }
  } catch (error: any) {
    console.error('Translation error:', error)
    return { success: false, error: error.message || 'Translation failed' }
  }
}

/**
 * Translate multiple texts in a single API call (more efficient)
 */
export async function translateBatch(
  texts: string[],
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<BatchTranslationResult> {
  if (!texts || texts.length === 0) {
    return { success: true, translations: [] }
  }

  // Filter out empty texts and track their positions
  const validTexts: { index: number; text: string }[] = []
  const results: string[] = new Array(texts.length).fill('')

  texts.forEach((text, index) => {
    if (text && text.trim().length > 0) {
      // Check cache first
      const cacheKey = `${hashText(text)}:${targetLanguage}`
      const cached = translationCache.get(cacheKey)
      if (cached) {
        results[index] = cached
      } else {
        validTexts.push({ index, text })
      }
    } else {
      results[index] = text || ''
    }
  })

  // If all texts were cached, return early
  if (validTexts.length === 0) {
    return { success: true, translations: results }
  }

  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY

  if (!apiKey) {
    console.warn('⚠️ GOOGLE_CLOUD_TRANSLATE_API_KEY not found, falling back to Gemini translation')
    // Fallback: translate each individually with Gemini
    for (const { index, text } of validTexts) {
      const result = await fallbackToGemini(text, targetLanguage, sourceLanguage)
      results[index] = result.translation || text
    }
    return { success: true, translations: results }
  }

  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`
    
    // Google Translate API accepts an array of texts
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: validTexts.map(v => v.text),
        target: targetLanguage,
        source: sourceLanguage,
        format: 'text',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Google Translate API batch error:', errorData)
      return { 
        success: false, 
        error: errorData?.error?.message || `API error: ${response.status}` 
      }
    }

    const data = await response.json()
    const translations = data?.data?.translations

    if (!translations || !Array.isArray(translations)) {
      return { success: false, error: 'No translations returned' }
    }

    // Map translations back to results and cache them
    translations.forEach((t: { translatedText: string }, i: number) => {
      const { index, text } = validTexts[i]
      const translatedText = t.translatedText || text
      results[index] = translatedText
      
      // Cache the result
      const cacheKey = `${hashText(text)}:${targetLanguage}`
      translationCache.set(cacheKey, translatedText)
    })

    return { success: true, translations: results }
  } catch (error: any) {
    console.error('Batch translation error:', error)
    return { success: false, error: error.message || 'Batch translation failed' }
  }
}

/**
 * Fallback to Gemini translation when Google Cloud API key is not available
 */
async function fallbackToGemini(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<TranslationResult> {
  try {
    const { translateContent } = await import('@/lib/services/ai/gemini')
    
    const result = await translateContent({
      content: text,
      fromLanguage: sourceLanguage || 'en',
      toLanguage: targetLanguage,
      contentType: 'general',
    })

    if (result.success && result.translation) {
      // Cache the result
      const cacheKey = `${hashText(text)}:${targetLanguage}`
      translationCache.set(cacheKey, result.translation)
      return { success: true, translation: result.translation }
    }

    return { success: false, error: result.error || 'Gemini translation failed' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Fallback translation failed' }
  }
}

/**
 * Translate job data (title and description)
 */
export async function translateJob(
  job: { title: string; description?: string; [key: string]: any },
  targetLanguage: SupportedLanguage
): Promise<{ title: string; description?: string; [key: string]: any }> {
  if (targetLanguage === 'en') return job

  const textsToTranslate = [job.title]
  if (job.description) {
    textsToTranslate.push(job.description)
  }

  const result = await translateBatch(textsToTranslate, targetLanguage)
  
  if (!result.success || !result.translations) {
    return job
  }

  return {
    ...job,
    title: result.translations[0] || job.title,
    description: job.description ? (result.translations[1] || job.description) : undefined,
  }
}

/**
 * Translate multiple jobs
 */
export async function translateJobs(
  jobs: Array<{ title: string; description?: string; [key: string]: any }>,
  targetLanguage: SupportedLanguage
): Promise<Array<{ title: string; description?: string; [key: string]: any }>> {
  if (targetLanguage === 'en' || jobs.length === 0) return jobs

  // Collect all texts to translate
  const textsToTranslate: string[] = []
  const jobMapping: { jobIndex: number; field: 'title' | 'description' }[] = []

  jobs.forEach((job, jobIndex) => {
    textsToTranslate.push(job.title)
    jobMapping.push({ jobIndex, field: 'title' })
    
    if (job.description) {
      textsToTranslate.push(job.description)
      jobMapping.push({ jobIndex, field: 'description' })
    }
  })

  const result = await translateBatch(textsToTranslate, targetLanguage)
  
  if (!result.success || !result.translations) {
    return jobs
  }

  // Create translated jobs
  const translatedJobs = jobs.map(job => ({ ...job }))
  
  result.translations.forEach((translation, i) => {
    const { jobIndex, field } = jobMapping[i]
    translatedJobs[jobIndex][field] = translation
  })

  return translatedJobs
}

/**
 * Translate deal data
 */
export async function translateDeal(
  deal: { title: string; description?: string; [key: string]: any },
  targetLanguage: SupportedLanguage
): Promise<{ title: string; description?: string; [key: string]: any }> {
  if (targetLanguage === 'en') return deal

  const textsToTranslate = [deal.title]
  if (deal.description) {
    textsToTranslate.push(deal.description)
  }

  const result = await translateBatch(textsToTranslate, targetLanguage)
  
  if (!result.success || !result.translations) {
    return deal
  }

  return {
    ...deal,
    title: result.translations[0] || deal.title,
    description: deal.description ? (result.translations[1] || deal.description) : undefined,
  }
}

/**
 * Translate multiple deals
 */
export async function translateDeals(
  deals: Array<{ title: string; description?: string; [key: string]: any }>,
  targetLanguage: SupportedLanguage
): Promise<Array<{ title: string; description?: string; [key: string]: any }>> {
  if (targetLanguage === 'en' || deals.length === 0) return deals

  const textsToTranslate: string[] = []
  const dealMapping: { dealIndex: number; field: 'title' | 'description' }[] = []

  deals.forEach((deal, dealIndex) => {
    textsToTranslate.push(deal.title)
    dealMapping.push({ dealIndex, field: 'title' })
    
    if (deal.description) {
      textsToTranslate.push(deal.description)
      dealMapping.push({ dealIndex, field: 'description' })
    }
  })

  const result = await translateBatch(textsToTranslate, targetLanguage)
  
  if (!result.success || !result.translations) {
    return deals
  }

  const translatedDeals = deals.map(deal => ({ ...deal }))
  
  result.translations.forEach((translation, i) => {
    const { dealIndex, field } = dealMapping[i]
    translatedDeals[dealIndex][field] = translation
  })

  return translatedDeals
}

/**
 * Translate blog data
 */
export async function translateBlog(
  blog: { title: string; content?: string; excerpt?: string; [key: string]: any },
  targetLanguage: SupportedLanguage
): Promise<{ title: string; content?: string; excerpt?: string; [key: string]: any }> {
  if (targetLanguage === 'en') return blog

  const textsToTranslate = [blog.title]
  const fields: ('title' | 'content' | 'excerpt')[] = ['title']
  
  if (blog.excerpt) {
    textsToTranslate.push(blog.excerpt)
    fields.push('excerpt')
  }
  if (blog.content) {
    textsToTranslate.push(blog.content)
    fields.push('content')
  }

  const result = await translateBatch(textsToTranslate, targetLanguage)
  
  if (!result.success || !result.translations) {
    return blog
  }

  const translatedBlog: { title: string; content?: string; excerpt?: string; [key: string]: any } = { ...blog }
  fields.forEach((field, i) => {
    const translation = result.translations?.[i]
    if (translation !== undefined) {
      translatedBlog[field] = translation
    }
  })

  return translatedBlog
}

/**
 * Clear translation cache (useful for testing or memory management)
 */
export function clearTranslationCache(): void {
  translationCache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: translationCache.size,
    keys: Array.from(translationCache.keys()),
  }
}
