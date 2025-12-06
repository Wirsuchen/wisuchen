/**
 * Lingva Translate Service - 100% FREE Translation
 * 
 * Lingva is a free, open-source alternative frontend to Google Translate.
 * It provides Google-quality translations with NO API key and NO limits.
 * 
 * Public Instances:
 * - https://lingva.ml (default)
 * - https://translate.plausibility.cloud
 * - https://lingva.garuber.eu
 * 
 * Used for: Blog titles/descriptions, Job titles/descriptions, Deal titles/descriptions
 */

// List of public Lingva instances for fallback
const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://translate.plausibility.cloud',
  'https://lingva.garuber.eu',
  'https://lingva.pussthecat.org',
]

// In-memory cache for translations
const translationCache = new Map<string, string>()

// Simple hash function for cache keys
function hashText(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

export type SupportedLanguage = 'en' | 'de' | 'fr' | 'it'

export interface TranslationResult {
  success: boolean
  translation?: string
  error?: string
  fromCache?: boolean
  source?: 'lingva' | 'fallback'
}

export interface BatchTranslationResult {
  success: boolean
  translations?: string[]
  error?: string
}

/**
 * Translate text using Lingva API (FREE)
 */
async function translateWithLingva(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'auto',
  instanceIndex: number = 0
): Promise<string | null> {
  if (instanceIndex >= LINGVA_INSTANCES.length) {
    return null // All instances failed
  }

  const instance = LINGVA_INSTANCES[instanceIndex]
  
  try {
    const encodedText = encodeURIComponent(text)
    const url = `${instance}/api/v1/${sourceLanguage}/${targetLanguage}/${encodedText}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      console.warn(`Lingva instance ${instance} returned ${response.status}, trying next...`)
      return translateWithLingva(text, targetLanguage, sourceLanguage, instanceIndex + 1)
    }

    const data = await response.json()
    
    if (data.translation) {
      return data.translation
    }
    
    // Try next instance if no translation
    return translateWithLingva(text, targetLanguage, sourceLanguage, instanceIndex + 1)
  } catch (error) {
    console.warn(`Lingva instance ${instance} failed:`, error)
    // Try next instance
    return translateWithLingva(text, targetLanguage, sourceLanguage, instanceIndex + 1)
  }
}

/**
 * Translate a single text using Lingva (FREE)
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
    return { success: true, translation: cached, fromCache: true, source: 'lingva' }
  }

  try {
    const translation = await translateWithLingva(
      text,
      targetLanguage,
      sourceLanguage || 'auto'
    )

    if (translation) {
      // Cache the result
      translationCache.set(cacheKey, translation)
      return { success: true, translation, source: 'lingva' }
    }

    return {
      success: false,
      error: 'All Lingva instances failed to translate'
    }
  } catch (error: any) {
    console.error('Lingva translation error:', error)
    return {
      success: false,
      error: error.message || 'Translation failed'
    }
  }
}

/**
 * Translate multiple texts in batch using Lingva (FREE)
 */
export async function translateBatch(
  texts: string[],
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<BatchTranslationResult> {
  if (!texts || texts.length === 0) {
    return { success: true, translations: [] }
  }

  try {
    // Translate all texts in parallel
    const results = await Promise.all(
      texts.map(text => translateText(text, targetLanguage, sourceLanguage))
    )

    const translations = results.map((r, index) => 
      r.success ? (r.translation || texts[index]) : texts[index]
    )

    const failedCount = results.filter(r => !r.success).length
    if (failedCount > 0) {
      console.warn(`${failedCount}/${texts.length} translations failed, using original text`)
    }

    return { success: true, translations }
  } catch (error: any) {
    console.error('Batch translation error:', error)
    return {
      success: false,
      error: error.message || 'Batch translation failed'
    }
  }
}

/**
 * Translate job content (title + description)
 */
export async function translateJob(
  title: string,
  description: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<{ title: string; description: string }> {
  const [titleResult, descResult] = await Promise.all([
    translateText(title, targetLanguage, sourceLanguage),
    translateText(description, targetLanguage, sourceLanguage)
  ])

  return {
    title: titleResult.translation || title,
    description: descResult.translation || description
  }
}

/**
 * Translate deal content (title + description)
 */
export async function translateDeal(
  title: string,
  description: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<{ title: string; description: string }> {
  const [titleResult, descResult] = await Promise.all([
    translateText(title, targetLanguage, sourceLanguage),
    translateText(description, targetLanguage, sourceLanguage)
  ])

  return {
    title: titleResult.translation || title,
    description: descResult.translation || description
  }
}

/**
 * Translate blog content (title + description/excerpt + content)
 */
export async function translateBlog(
  title: string,
  description: string,
  content: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<{ title: string; description: string; content: string }> {
  const [titleResult, descResult, contentResult] = await Promise.all([
    translateText(title, targetLanguage, sourceLanguage),
    translateText(description, targetLanguage, sourceLanguage),
    translateText(content, targetLanguage, sourceLanguage)
  ])

  return {
    title: titleResult.translation || title,
    description: descResult.translation || description,
    content: contentResult.translation || content
  }
}

/**
 * Check if Lingva is available
 */
export async function checkLingvaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${LINGVA_INSTANCES[0]}/api/v1/en/de/hello`, {
      signal: AbortSignal.timeout(5000)
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Clear translation cache
 */
export function clearCache(): void {
  translationCache.clear()
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: translationCache.size,
    keys: Array.from(translationCache.keys())
  }
}
