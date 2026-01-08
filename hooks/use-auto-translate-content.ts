/**
 * Auto-translate hook for dynamic content
 *
 * Detects if content is in a different language than the current locale
 * and automatically translates it using Google Cloud Translate API.
 *
 * This provides a flexible fallback when:
 * - Cached data has wrong language content
 * - Database translations are missing or incorrect
 * - Content from external sources isn't pre-translated
 */

import {useState, useEffect, useCallback, useRef} from "react"
import {useLocale} from "@/contexts/i18n-context"

// Language detection patterns - improved for better accuracy
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  de: [
    // Common German words
    /\b(und|für|mit|bei|wir|sie|der|die|das|ist|ihre|unser|werden|haben|nicht|auch|auf|nach|über|oder|kann|wenn|diese|einer|sein|zur|zum|einen|einem|unseres|unsere|suchen|arbeiten|moderner|modernen|technologien)\b/gi,
    // German special characters (strong indicator)
    /[äöüß]/gi,
    // German compound words and work-related terms
    /\b(Ausbildung|Arbeit|Unternehmen|Stelle|Beruf|GmbH|Entwickler|Verstärkung|Projekten|Vollzeit|Teilzeit|Anwendung|Anforderung|Aufgaben|Verantwortlich|Informationen)\b/gi,
    // German gender notation (very strong indicator)
    /\(m\/w\/d\)|\(w\/m\/d\)|\(m\/w\/x\)|\(all[e]?\s*geschlechter\)/gi,
  ],
  fr: [
    /\b(pour|avec|dans|nous|vous|les|des|une|sont|cette|notre|votre|être|avoir|faire|plus|tout|sans|mais|comme|sur|par|qui|que|aux|ses|nos|vos)\b/gi,
    /[éèêëàâçîïôùûœ]/gi,
    /\b(entreprise|travail|poste|emploi|société|équipe|expérience|responsable|développement)\b/gi,
  ],
  it: [
    /\b(per|con|che|sono|della|nella|questo|questa|nostro|vostro|essere|avere|fare|tutto|anche|molto|così|quando|gli|del|dei|delle|alla|allo)\b/gi,
    /[àèéìíòóùú]/gi,
    /\b(azienda|lavoro|posizione|impiego|sviluppo|responsabile)\b/gi,
  ],
}

// Local storage cache for translations
const TRANSLATION_CACHE_KEY = "auto_translate_cache"
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface CacheEntry {
  translation: string
  timestamp: number
}

function getTranslationCache(): Record<string, CacheEntry> {
  if (typeof window === "undefined") return {}
  try {
    const cached = localStorage.getItem(TRANSLATION_CACHE_KEY)
    if (!cached) return {}
    const data = JSON.parse(cached)
    // Clean expired entries
    const now = Date.now()
    const cleaned: Record<string, CacheEntry> = {}
    for (const [key, entry] of Object.entries(
      data as Record<string, CacheEntry>
    )) {
      if (now - entry.timestamp < CACHE_TTL) {
        cleaned[key] = entry
      }
    }
    return cleaned
  } catch {
    return {}
  }
}

function setTranslationCache(key: string, translation: string): void {
  if (typeof window === "undefined") return
  try {
    const cache = getTranslationCache()
    cache[key] = {translation, timestamp: Date.now()}
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.warn("[AutoTranslate] Failed to cache translation:", error)
  }
}

function getCacheKey(text: string, targetLang: string): string {
  // Simple hash for cache key
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `${hash.toString(36)}:${targetLang}`
}

/**
 * Detect the language of a text based on common patterns
 */
export function detectLanguage(text: string): "en" | "de" | "fr" | "it" {
  if (!text || text.length < 10) return "en"

  // Quick check for very strong German indicators (job gender notation)
  if (
    /\(m\/w\/d\)|\(w\/m\/d\)|\(m\/w\/x\)|\(all[e]?\s*geschlechter\)/i.test(text)
  ) {
    return "de"
  }

  const lowerText = text.toLowerCase()
  const scores: Record<string, number> = {de: 0, fr: 0, it: 0}

  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = lowerText.match(pattern)
      if (matches) {
        // Special characters are weighted more heavily
        const isSpecialChars =
          pattern.source.includes("[äöüß]") ||
          pattern.source.includes("[éèêë") ||
          pattern.source.includes("[àèéì")
        scores[lang] += isSpecialChars ? matches.length * 2 : matches.length
      }
    }
  }

  // Find language with highest score
  let maxLang = "en"
  let maxScore = 0

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      maxLang = lang
    }
  }

  // Require minimum score threshold to detect non-English (lowered to 2 for better detection)
  return maxScore >= 2 ? (maxLang as "de" | "fr" | "it") : "en"
}

/**
 * Check if text needs translation (is in different language than target)
 */
export function needsTranslation(text: string, targetLang: string): boolean {
  if (!text || text.length < 10) return false
  const detectedLang = detectLanguage(text)
  return detectedLang !== targetLang
}

interface TranslateResult {
  translatedText: string
  wasTranslated: boolean
  fromLanguage?: string
}

/**
 * Hook to auto-translate content on the client side
 */
export function useAutoTranslateContent() {
  const locale = useLocale()
  const [isTranslating, setIsTranslating] = useState(false)
  const pendingTranslations = useRef<Map<string, Promise<string>>>(new Map())

  /**
   * Translate a single text if it's in a different language
   */
  const translateText = useCallback(
    async (
      text: string,
      contentType: "job" | "deal" | "blog" | "general" = "general"
    ): Promise<TranslateResult> => {
      if (!text || text.length < 10) {
        return {translatedText: text, wasTranslated: false}
      }

      const detectedLang = detectLanguage(text)

      // Already in target language
      if (detectedLang === locale) {
        return {translatedText: text, wasTranslated: false}
      }

      // Check local cache first
      const cacheKey = getCacheKey(text, locale)
      const cache = getTranslationCache()
      if (cache[cacheKey]) {
        return {
          translatedText: cache[cacheKey].translation,
          wasTranslated: true,
          fromLanguage: detectedLang,
        }
      }

      // Check if already translating this text
      if (pendingTranslations.current.has(cacheKey)) {
        const translation = await pendingTranslations.current.get(cacheKey)!
        return {
          translatedText: translation,
          wasTranslated: true,
          fromLanguage: detectedLang,
        }
      }

      // Call translation API
      const translationPromise = (async () => {
        try {
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
              contentType,
              title: contentType !== "blog" ? text : undefined,
              description: contentType === "blog" ? undefined : "",
              content: contentType === "blog" ? text : undefined,
              toLanguage: locale,
              fromLanguage: detectedLang,
            }),
          })

          if (!response.ok) {
            console.warn("[AutoTranslate] API error:", response.status)
            return text
          }

          const data = await response.json()
          const translated = data.title || data.content || text

          // Cache the result
          setTranslationCache(cacheKey, translated)

          return translated
        } catch (error) {
          console.error("[AutoTranslate] Translation failed:", error)
          return text
        } finally {
          pendingTranslations.current.delete(cacheKey)
        }
      })()

      pendingTranslations.current.set(cacheKey, translationPromise)
      const translation = await translationPromise

      return {
        translatedText: translation,
        wasTranslated: true,
        fromLanguage: detectedLang,
      }
    },
    [locale]
  )

  /**
   * Translate multiple texts in batch
   */
  const translateBatch = useCallback(
    async (
      texts: string[],
      contentType: "job" | "deal" | "blog" | "general" = "general"
    ): Promise<TranslateResult[]> => {
      setIsTranslating(true)
      try {
        const results = await Promise.all(
          texts.map(text => translateText(text, contentType))
        )
        return results
      } finally {
        setIsTranslating(false)
      }
    },
    [translateText]
  )

  /**
   * Translate job content (title and description)
   * Optionally stores translation in database if id and source are provided
   */
  const translateJob = useCallback(
    async (job: {
      id?: string
      source?: string
      title: string
      description: string
      company?: string
      location?: string
    }): Promise<{
      title: string
      description: string
      company?: string
      location?: string
      wasTranslated: boolean
    }> => {
      const titleNeedsTranslation = needsTranslation(job.title, locale)
      const descNeedsTranslation = needsTranslation(job.description, locale)

      if (!titleNeedsTranslation && !descNeedsTranslation) {
        return {...job, wasTranslated: false}
      }

      // Build content ID for database storage
      const contentId =
        job.id && job.source ? `job-${job.source}-${job.id}` : undefined
      const detectedLang = detectLanguage(job.title + " " + job.description)

      // Use single API call to translate and store
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            contentType: "job",
            title: job.title,
            description: job.description,
            toLanguage: locale,
            fromLanguage: detectedLang,
            contentId, // Will store in DB if provided
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Also cache locally
            if (data.title) {
              setTranslationCache(getCacheKey(job.title, locale), data.title)
            }
            if (data.description) {
              setTranslationCache(
                getCacheKey(job.description, locale),
                data.description
              )
            }

            return {
              ...job,
              title: data.title || job.title,
              description: data.description || job.description,
              wasTranslated: true,
            }
          }
        }
      } catch (error) {
        console.error("[AutoTranslate] Job translation failed:", error)
      }

      // Fallback to individual translations if API call fails
      const [titleResult, descResult] = await Promise.all([
        titleNeedsTranslation
          ? translateText(job.title, "job")
          : Promise.resolve({translatedText: job.title, wasTranslated: false}),
        descNeedsTranslation
          ? translateText(job.description, "job")
          : Promise.resolve({
              translatedText: job.description,
              wasTranslated: false,
            }),
      ])

      return {
        ...job,
        title: titleResult.translatedText,
        description: descResult.translatedText,
        wasTranslated: titleResult.wasTranslated || descResult.wasTranslated,
      }
    },
    [locale, translateText]
  )

  /**
   * Translate an array of jobs
   */
  const translateJobs = useCallback(
    async <
      T extends {
        id?: string
        source?: string
        title: string
        description: string
      }
    >(
      jobs: T[]
    ): Promise<T[]> => {
      if (jobs.length === 0) return jobs

      setIsTranslating(true)
      try {
        // Check which jobs need translation
        const jobsToTranslate: {index: number; job: T}[] = []

        jobs.forEach((job, index) => {
          if (
            needsTranslation(job.title, locale) ||
            needsTranslation(job.description, locale)
          ) {
            jobsToTranslate.push({index, job})
          }
        })

        if (jobsToTranslate.length === 0) {
          return jobs
        }

        console.log(
          `[AutoTranslate] Translating ${jobsToTranslate.length} jobs to ${locale}`
        )

        // Batch translate
        const translatedJobs = await Promise.all(
          jobsToTranslate.map(({job}) => translateJob(job))
        )

        // Merge translations back
        const result = [...jobs]
        jobsToTranslate.forEach(({index}, i) => {
          result[index] = {
            ...result[index],
            title: translatedJobs[i].title,
            description: translatedJobs[i].description,
          }
        })

        return result
      } finally {
        setIsTranslating(false)
      }
    },
    [locale, translateJob]
  )

  return {
    translateText,
    translateBatch,
    translateJob,
    translateJobs,
    detectLanguage,
    needsTranslation: (text: string) => needsTranslation(text, locale),
    isTranslating,
    currentLocale: locale,
  }
}

/**
 * Hook to auto-translate a single text value
 * Returns the translated text reactively
 */
export function useTranslatedText(
  text: string,
  contentType: "job" | "deal" | "blog" | "general" = "general"
): {
  translatedText: string
  isTranslating: boolean
  wasTranslated: boolean
} {
  const locale = useLocale()
  const [translatedText, setTranslatedText] = useState(text)
  const [isTranslating, setIsTranslating] = useState(false)
  const [wasTranslated, setWasTranslated] = useState(false)

  useEffect(() => {
    if (!text || text.length < 10) {
      setTranslatedText(text)
      setWasTranslated(false)
      return
    }

    const detected = detectLanguage(text)
    if (detected === locale) {
      setTranslatedText(text)
      setWasTranslated(false)
      return
    }

    // Check cache first
    const cacheKey = getCacheKey(text, locale)
    const cache = getTranslationCache()
    if (cache[cacheKey]) {
      setTranslatedText(cache[cacheKey].translation)
      setWasTranslated(true)
      return
    }

    // Translate
    setIsTranslating(true)
    fetch("/api/translate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        contentType,
        title: text,
        description: "",
        toLanguage: locale,
        fromLanguage: detected,
      }),
    })
      .then(res => res.json())
      .then(data => {
        const translated = data.title || text
        setTranslationCache(cacheKey, translated)
        setTranslatedText(translated)
        setWasTranslated(true)
      })
      .catch(err => {
        console.error("[AutoTranslate] Error:", err)
        setTranslatedText(text)
      })
      .finally(() => {
        setIsTranslating(false)
      })
  }, [text, locale, contentType])

  return {translatedText, isTranslating, wasTranslated}
}
