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
const TRANSLATION_CACHE_KEY = "auto_translate_cache_v4"
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface CacheEntry {
  translation: string
  timestamp: number
}

// Language detection patterns - improved for better accuracy
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  de: [
    // Common German words and particles
    /\b(und|für|mit|bei|wir|sie|der|die|das|dem|den|des|ein|eine|einer|einen|einem|ist|sind|war|wäre|ihre|ihr|wir|euch|unser|werden|haben|hat|nicht|auch|auf|nach|über|oder|kann|können|wenn|diese|dieser|dieses|sein|zur|zum|aus|von|bis|am|im|bzw|inkl|ggf)\b/gi,
    // German special characters (strong indicator)
    /[äöüß]/gi,
    // German compound words and work-related terms
    /\b(Ausbildung|Arbeit|Unternehmen|Stelle|Beruf|GmbH|Entwickler|Verstärkung|Projekten|Vollzeit|Teilzeit|Anwendung|Anforderung|Aufgaben|Verantwortlich|Informationen|Erfahrung|Kenntnisse|Bewerbung|Mitarbeiter|Team)\b/gi,
    // German gender notation (strong indicator but common in English titles in DACH)
    // We treat this as a weighted pattern now, not an early exit
    /\(m\/w\/d\)|\(w\/m\/d\)|\(m\/w\/x\)|\(all[e]?\s*geschlechter\)|\([mdw]\/[mdw]\/[mdw]\)/gi,
  ],
  en: [
    // Common English words
    /\b(and|for|with|at|we|they|the|is|their|our|will|have|not|also|on|after|about|or|can|if|this|one|be|to|an|searching|working|modern|technologies)\b/gi,
    // IT/Tech specific English terms
    /\b(developer|software|engineer|full|stack|frontend|backend|data|scientist|manager|senior|junior|lead|product|owner|scrum|master|consultant|architect|analyst|deployment|cloud|service|services|web)\b/gi,
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

// Local storage cache functions
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
  if (!text || text.length < 2) return "en"

  const lowerText = text.toLowerCase()
  const scores: Record<string, number> = {de: 0, fr: 0, it: 0, en: 0}

  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = lowerText.match(pattern)
      if (matches) {
        // Special weighting logic:
        // - German gender notation: +2 points (indicates DACH context but not necessarily German language content)
        // - German/French/Italian special chars: +2 points (strong indicator)
        // - English IT terms: +1.5 points (to override gender notation in "Senior Developer (m/w/d)")
        
        const patternStr = pattern.source;
        let weight = 1;

        if (patternStr.includes("(m\\/w\\/d)")) {
            weight = 2; 
        } else if (patternStr.includes("[äöüß]") || patternStr.includes("[éèêë") || patternStr.includes("[àèéì")) {
            weight = 2;
        } else if (lang === 'en' && patternStr.includes("developer")) {
             // IT terms list
             weight = 1.5;
        }

        scores[lang] += matches.length * weight;
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

  // If we have a tie between DE and EN, and EN has a decent score, prefer EN
  // This helps with "Senior Developer (m/w/d)" where scores might be close
  if (maxLang === 'de' && scores.en > 0 && scores.en >= scores.de - 1) {
      return 'en';
  }

  // If no languages detected significantly, default to English
  if (maxLang === "en" && scores.en > 0) return "en"

  // Require minimum score threshold from non-english languages to switch away from default
  return maxScore >= 1 ? (maxLang as "de" | "fr" | "it" | "en") : "en"
}

/**
 * Check if text needs translation (is in different language than target)
 */
export function needsTranslation(text: string, targetLang: string): boolean {
  if (!text || text.length < 2) return false
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
      if (!text || text.length < 2) {
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
              fromLanguage: undefined, // Let Google detect source language for better accuracy
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
              fromLanguage: undefined, // Let Google detect source language for better accuracy
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
  contentType: "job" | "deal" | "blog" | "general" = "general",
  contentId?: string
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
    if (!text || text.length < 2) {
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
        contentId,
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
  }, [text, locale, contentType, contentId])

  return {translatedText, isTranslating, wasTranslated}
}

/**
 * Hook to auto-translate a whole job (title + description) at once
 */
export function useTranslatedJob(job: {
  id: string
  source: string
  externalId?: string
  title: string
  description?: string
}) {
  const locale = useLocale()
  const [translatedJob, setTranslatedJob] = useState({
    title: job.title,
    description: job.description || "",
  })
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    const titleNeeds = needsTranslation(job.title, locale)
    const descNeeds = job.description
      ? needsTranslation(job.description, locale)
      : false

    if (!titleNeeds && !descNeeds) {
      setTranslatedJob({
        title: job.title,
        description: job.description || "",
      })
      return
    }

    const cacheKeyTitle = getCacheKey(job.title, locale)
    const cacheKeyDesc = job.description
      ? getCacheKey(job.description, locale)
      : ""
    const cache = getTranslationCache()

    // If both are cached coverage is good
    if (
      cache[cacheKeyTitle] &&
      (!job.description || cache[cacheKeyDesc])
    ) {
      setTranslatedJob({
        title: cache[cacheKeyTitle].translation,
        description: job.description
          ? cache[cacheKeyDesc].translation
          : "",
      })
      return
    }

    // Translate both at once
    setIsTranslating(true)
    const contentId = `job-${job.source}-${job.externalId || job.id}`

    fetch("/api/translate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        contentType: "job",
        title: job.title,
        description: job.description || "",
        toLanguage: locale,
        fromLanguage: detectLanguage(job.title), // hint from title
        contentId,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Cache results
          setTranslationCache(cacheKeyTitle, data.title)
          if (job.description && data.description) {
            setTranslationCache(cacheKeyDesc, data.description)
          }

          setTranslatedJob({
            title: data.title,
            description: data.description || "",
          })
        }
      })
      .catch(err => {
        console.error("[useTranslatedJob] Error:", err)
      })
      .finally(() => {
        setIsTranslating(false)
      })
  }, [job.title, job.description, job.id, job.source, job.externalId, locale])

  return {translatedJob, isTranslating}
}
