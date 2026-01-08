/**
 * Google Cloud Translation API Service
 *
 * This service handles translation of dynamic content (jobs, deals, blogs)
 * using the Google Cloud Translation API v2.
 *
 * Supports two authentication methods:
 * 1. Service Account JSON key (recommended) - set GOOGLE_APPLICATION_CREDENTIALS
 * 2. API Key - set GOOGLE_CLOUD_TRANSLATE_API_KEY
 *
 * For static UI text, use the i18n system instead.
 */

import {GoogleAuth} from "google-auth-library"
import * as path from "path"
import * as fs from "fs"

// In-memory cache for translations to minimize API calls
// Key format: "hash:targetLang", Value: translated text
const translationCache = new Map<string, string>()

// Cached auth client
let authClient: any = null

// Simple hash function for cache keys
function hashText(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

/**
 * Get access token from service account credentials
 */
async function getAccessToken(): Promise<string | null> {
  try {
    // Check for service account JSON file
    const credentialsPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      path.join(
        process.cwd(),
        "credentials",
        "google-translate-service-account.json"
      )

    if (!fs.existsSync(credentialsPath)) {
      return null
    }

    if (!authClient) {
      const auth = new GoogleAuth({
        keyFile: credentialsPath,
        scopes: ["https://www.googleapis.com/auth/cloud-translation"],
      })
      authClient = await auth.getClient()
    }

    const accessToken = await authClient.getAccessToken()
    return accessToken?.token || null
  } catch (error) {
    console.error("[GoogleTranslate] Failed to get access token:", error)
    return null
  }
}

export type SupportedLanguage = "en" | "de" | "fr" | "it"

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
 * Supports both API Key and Service Account authentication
 */
export async function translateText(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return {success: true, translation: text}
  }

  // Don't translate if source and target are the same
  if (sourceLanguage === targetLanguage) {
    return {success: true, translation: text}
  }

  // Check cache first
  const cacheKey = `${hashText(text)}:${targetLanguage}`
  const cached = translationCache.get(cacheKey)
  if (cached) {
    return {success: true, translation: cached, fromCache: true}
  }

  // Try service account first, then API key
  const accessToken = await getAccessToken()
  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY

  if (!accessToken && !apiKey) {
    console.warn(
      "⚠️ No Google Translate credentials found, falling back to Gemini translation"
    )
    // Fallback to Gemini translation
    return fallbackToGemini(text, targetLanguage, sourceLanguage)
  }

  try {
    // Build URL and headers based on authentication method
    let url: string
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (accessToken) {
      // Use service account with Bearer token
      url = "https://translation.googleapis.com/language/translate/v2"
      headers["Authorization"] = `Bearer ${accessToken}`
    } else {
      // Use API key
      url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        source: sourceLanguage,
        format: "text",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Google Translate API error:", errorData)
      return {
        success: false,
        error: errorData?.error?.message || `API error: ${response.status}`,
      }
    }

    const data = await response.json()
    const translatedText = data?.data?.translations?.[0]?.translatedText

    if (!translatedText) {
      return {success: false, error: "No translation returned"}
    }

    // Cache the result
    translationCache.set(cacheKey, translatedText)

    return {success: true, translation: translatedText}
  } catch (error: any) {
    console.error("Translation error:", error)
    return {success: false, error: error.message || "Translation failed"}
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
    return {success: true, translations: []}
  }

  // Don't translate if source and target are the same
  if (sourceLanguage === targetLanguage) {
    return {success: true, translations: texts}
  }

  // Filter out empty texts and track their positions
  const validTexts: {index: number; text: string}[] = []
  const results: string[] = new Array(texts.length).fill("")

  texts.forEach((text, index) => {
    if (text && text.trim().length > 0) {
      // Check cache first
      const cacheKey = `${hashText(text)}:${targetLanguage}`
      const cached = translationCache.get(cacheKey)
      if (cached) {
        results[index] = cached
      } else {
        validTexts.push({index, text})
      }
    } else {
      results[index] = text || ""
    }
  })

  // If all texts were cached, return early
  if (validTexts.length === 0) {
    return {success: true, translations: results}
  }

  // Try service account first, then API key
  const accessToken = await getAccessToken()
  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY

  if (!accessToken && !apiKey) {
    console.warn(
      "⚠️ No Google Translate credentials found, falling back to Gemini translation"
    )
    // Fallback: translate each individually with Gemini
    for (const {index, text} of validTexts) {
      const result = await fallbackToGemini(
        text,
        targetLanguage,
        sourceLanguage
      )
      results[index] = result.translation || text
    }
    return {success: true, translations: results}
  }

  try {
    // Build URL and headers based on authentication method
    let url: string
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (accessToken) {
      // Use service account with Bearer token
      url = "https://translation.googleapis.com/language/translate/v2"
      headers["Authorization"] = `Bearer ${accessToken}`
    } else {
      // Use API key
      url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`
    }

    // Google Translate API accepts an array of texts
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        q: validTexts.map(v => v.text),
        target: targetLanguage,
        source: sourceLanguage,
        format: "text",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Google Translate API batch error:", errorData)
      return {
        success: false,
        error: errorData?.error?.message || `API error: ${response.status}`,
      }
    }

    const data = await response.json()
    const translations = data?.data?.translations

    if (!translations || !Array.isArray(translations)) {
      return {success: false, error: "No translations returned"}
    }

    // Map translations back to results and cache them
    translations.forEach((t: {translatedText: string}, i: number) => {
      const {index, text} = validTexts[i]
      const translatedText = t.translatedText || text
      results[index] = translatedText

      // Cache the result
      const cacheKey = `${hashText(text)}:${targetLanguage}`
      translationCache.set(cacheKey, translatedText)
    })

    return {success: true, translations: results}
  } catch (error: any) {
    console.error("Batch translation error:", error)
    return {success: false, error: error.message || "Batch translation failed"}
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
    const {translateContent} = await import("@/lib/services/ai/gemini")

    const result = await translateContent({
      content: text,
      fromLanguage: sourceLanguage || "en",
      toLanguage: targetLanguage,
      contentType: "general",
    })

    if (result.success && result.translation) {
      // Cache the result
      const cacheKey = `${hashText(text)}:${targetLanguage}`
      translationCache.set(cacheKey, result.translation)
      return {success: true, translation: result.translation}
    }

    return {success: false, error: result.error || "Gemini translation failed"}
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Fallback translation failed",
    }
  }
}

/**
 * Translate job data (title and description)
 * API-compatible signature matching lingva-translate
 */
export async function translateJob(
  title: string,
  description: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<{title: string; description: string}> {
  if (targetLanguage === "en" && sourceLanguage === "en") {
    return {title, description}
  }

  const textsToTranslate = [title]
  if (description) {
    textsToTranslate.push(description)
  }

  const result = await translateBatch(
    textsToTranslate,
    targetLanguage,
    sourceLanguage
  )

  if (!result.success || !result.translations) {
    return {title, description}
  }

  return {
    title: result.translations[0] || title,
    description: description
      ? result.translations[1] || description
      : description,
  }
}

/**
 * Translate multiple jobs
 */
export async function translateJobs(
  jobs: Array<{title: string; description?: string; [key: string]: any}>,
  targetLanguage: SupportedLanguage
): Promise<Array<{title: string; description?: string; [key: string]: any}>> {
  if (targetLanguage === "en" || jobs.length === 0) return jobs

  // Collect all texts to translate
  const textsToTranslate: string[] = []
  const jobMapping: {jobIndex: number; field: "title" | "description"}[] = []

  jobs.forEach((job, jobIndex) => {
    textsToTranslate.push(job.title)
    jobMapping.push({jobIndex, field: "title"})

    if (job.description) {
      textsToTranslate.push(job.description)
      jobMapping.push({jobIndex, field: "description"})
    }
  })

  const result = await translateBatch(textsToTranslate, targetLanguage)

  if (!result.success || !result.translations) {
    return jobs
  }

  // Create translated jobs
  const translatedJobs = jobs.map(job => ({...job}))

  result.translations.forEach((translation, i) => {
    const {jobIndex, field} = jobMapping[i]
    translatedJobs[jobIndex][field] = translation
  })

  return translatedJobs
}

/**
 * Translate deal data
 * API-compatible signature matching lingva-translate
 */
export async function translateDeal(
  title: string,
  description: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<{title: string; description: string}> {
  if (targetLanguage === "en" && sourceLanguage === "en") {
    return {title, description}
  }

  const textsToTranslate = [title]
  if (description) {
    textsToTranslate.push(description)
  }

  const result = await translateBatch(
    textsToTranslate,
    targetLanguage,
    sourceLanguage
  )

  if (!result.success || !result.translations) {
    return {title, description}
  }

  return {
    title: result.translations[0] || title,
    description: description
      ? result.translations[1] || description
      : description,
  }
}

/**
 * Translate multiple deals
 */
export async function translateDeals(
  deals: Array<{title: string; description?: string; [key: string]: any}>,
  targetLanguage: SupportedLanguage
): Promise<Array<{title: string; description?: string; [key: string]: any}>> {
  if (targetLanguage === "en" || deals.length === 0) return deals

  const textsToTranslate: string[] = []
  const dealMapping: {dealIndex: number; field: "title" | "description"}[] = []

  deals.forEach((deal, dealIndex) => {
    textsToTranslate.push(deal.title)
    dealMapping.push({dealIndex, field: "title"})

    if (deal.description) {
      textsToTranslate.push(deal.description)
      dealMapping.push({dealIndex, field: "description"})
    }
  })

  const result = await translateBatch(textsToTranslate, targetLanguage)

  if (!result.success || !result.translations) {
    return deals
  }

  const translatedDeals = deals.map(deal => ({...deal}))

  result.translations.forEach((translation, i) => {
    const {dealIndex, field} = dealMapping[i]
    translatedDeals[dealIndex][field] = translation
  })

  return translatedDeals
}

/**
 * Translate blog data
 * API-compatible signature matching lingva-translate
 */
export async function translateBlog(
  title: string,
  description: string,
  content: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<{title: string; description: string; content: string}> {
  if (targetLanguage === "en" && sourceLanguage === "en") {
    return {title, description, content}
  }

  const textsToTranslate: string[] = []
  const fields: ("title" | "description" | "content")[] = []

  if (title) {
    textsToTranslate.push(title)
    fields.push("title")
  }
  if (description) {
    textsToTranslate.push(description)
    fields.push("description")
  }
  if (content) {
    textsToTranslate.push(content)
    fields.push("content")
  }

  if (textsToTranslate.length === 0) {
    return {title, description, content}
  }

  const result = await translateBatch(
    textsToTranslate,
    targetLanguage,
    sourceLanguage
  )

  if (!result.success || !result.translations) {
    return {title, description, content}
  }

  const translatedResult: {
    title: string
    description: string
    content: string
  } = {
    title,
    description,
    content,
  }

  fields.forEach((field, i) => {
    const translation = result.translations?.[i]
    if (translation !== undefined) {
      translatedResult[field] = translation
    }
  })

  return translatedResult
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
export function getCacheStats(): {size: number; keys: string[]} {
  return {
    size: translationCache.size,
    keys: Array.from(translationCache.keys()),
  }
}
