/**
 * Lingva Translate Service - 100% FREE Translation
 * 
 * Lingva is a free, open-source alternative frontend to Google Translate.
 * It provides Google-quality translations with NO API key and NO limits.
 * 
 * Public Instances (updated for better reliability):
 * - https://lingva.ml (default)
 * - https://translate.plausibility.cloud
 * - https://lingva.garuber.eu
 * 
 * Fallback: LibreTranslate instances
 * 
 * Used for: Blog titles/descriptions, Job titles/descriptions, Deal titles/descriptions
 */

// List of public Lingva instances for fallback (most reliable first)
const LINGVA_INSTANCES = [
  'https://lingva.thedaviddelta.com',
  'https://lingva.ml',
  'https://translate.plausibility.cloud',
  'https://lingva.lunar.icu',
]

// LibreTranslate instances as backup
const LIBRE_INSTANCES = [
  'https://libretranslate.de',
  'https://translate.argosopentech.com',
  'https://translate.terraprint.co',
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
  source?: 'lingva' | 'libre' | 'fallback'
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
        'User-Agent': 'Mozilla/5.0 (compatible; WIRsuchen/1.0)',
      },
      // Increase timeout for serverless environment
      signal: AbortSignal.timeout(15000), // 15 second timeout
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
 * Translate text using LibreTranslate API (FREE fallback)
 */
async function translateWithLibre(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'en',
  instanceIndex: number = 0
): Promise<string | null> {
  if (instanceIndex >= LIBRE_INSTANCES.length) {
    return null
  }

  const instance = LIBRE_INSTANCES[instanceIndex]
  
  try {
    const response = await fetch(`${instance}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLanguage === 'auto' ? 'en' : sourceLanguage,
        target: targetLanguage,
        format: 'text',
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      console.warn(`LibreTranslate instance ${instance} returned ${response.status}, trying next...`)
      return translateWithLibre(text, targetLanguage, sourceLanguage, instanceIndex + 1)
    }

    const data = await response.json()
    
    if (data.translatedText) {
      return data.translatedText
    }
    
    return translateWithLibre(text, targetLanguage, sourceLanguage, instanceIndex + 1)
  } catch (error) {
    console.warn(`LibreTranslate instance ${instance} failed:`, error)
    return translateWithLibre(text, targetLanguage, sourceLanguage, instanceIndex + 1)
  }
}

/**
 * Translate a single text using Lingva (FREE), with LibreTranslate fallback
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
    // Try Lingva first
    let translation = await translateWithLingva(
      text,
      targetLanguage,
      sourceLanguage || 'auto'
    )

    if (translation) {
      // Cache the result
      translationCache.set(cacheKey, translation)
      return { success: true, translation, source: 'lingva' }
    }

    // Fallback to LibreTranslate
    console.log('Lingva failed, trying LibreTranslate fallback...')
    translation = await translateWithLibre(
      text,
      targetLanguage,
      sourceLanguage || 'en'
    )

    if (translation) {
      translationCache.set(cacheKey, translation)
      return { success: true, translation, source: 'libre' }
    }

    // If all fail, return original text as fallback
    console.warn('All translation services failed, returning original text')
    return {
      success: true,
      translation: text,
      source: 'fallback'
    }
  } catch (error: any) {
    console.error('Translation error:', error)
    // Return original text on error instead of failing
    return {
      success: true,
      translation: text,
      source: 'fallback'
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
 * Check if translation services are available
 */
export async function checkLingvaHealth(): Promise<{ lingva: boolean; libre: boolean; available: boolean }> {
  const results = { lingva: false, libre: false, available: false }
  
  // Test Lingva
  try {
    const lingvaResponse = await fetch(`${LINGVA_INSTANCES[0]}/api/v1/en/de/hello`, {
      signal: AbortSignal.timeout(5000)
    })
    results.lingva = lingvaResponse.ok
  } catch {
    results.lingva = false
  }

  // Test LibreTranslate
  try {
    const libreResponse = await fetch(`${LIBRE_INSTANCES[0]}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: 'hello', source: 'en', target: 'de' }),
      signal: AbortSignal.timeout(5000)
    })
    results.libre = libreResponse.ok
  } catch {
    results.libre = false
  }

  results.available = results.lingva || results.libre
  return results
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
