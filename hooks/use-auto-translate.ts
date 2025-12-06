'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useI18n } from '@/contexts/i18n-context'

interface TranslatedContent {
  [key: string]: string // key is contentId, value is translated text
}

interface UseAutoTranslateOptions {
  enabled?: boolean
  sourceLanguage?: string
}

/**
 * Hook to automatically translate content when locale changes
 * Uses Lingva Translate API (FREE)
 */
export function useAutoTranslate(options: UseAutoTranslateOptions = {}) {
  const { enabled = true, sourceLanguage = 'en' } = options
  const { locale } = useI18n()
  const [translations, setTranslations] = useState<TranslatedContent>({})
  const [isTranslating, setIsTranslating] = useState(false)
  const pendingTranslations = useRef<Map<string, string>>(new Map())
  const translationCache = useRef<Map<string, string>>(new Map())

  // Generate cache key
  const getCacheKey = (text: string, targetLang: string) => 
    `${text.slice(0, 50)}:${targetLang}`

  // Translate a single text
  const translateText = useCallback(async (
    text: string, 
    targetLang: string
  ): Promise<string> => {
    if (!text || text.trim().length === 0) return text
    if (targetLang === sourceLanguage) return text

    // Check cache first
    const cacheKey = getCacheKey(text, targetLang)
    const cached = translationCache.current.get(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          toLanguage: targetLang,
          fromLanguage: sourceLanguage
        })
      })

      if (!response.ok) {
        console.warn('Translation API error:', response.status)
        return text
      }

      const data = await response.json()
      const translated = data.translation || text

      // Cache the result
      translationCache.current.set(cacheKey, translated)
      
      return translated
    } catch (error) {
      console.error('Translation error:', error)
      return text
    }
  }, [sourceLanguage])

  // Translate multiple texts at once
  const translateBatch = useCallback(async (
    items: Array<{ id: string; text: string }>,
    targetLang: string
  ): Promise<TranslatedContent> => {
    if (!items.length || targetLang === sourceLanguage) {
      return Object.fromEntries(items.map(i => [i.id, i.text]))
    }

    setIsTranslating(true)
    const results: TranslatedContent = {}

    try {
      // Check cache and separate cached vs uncached
      const uncached: Array<{ id: string; text: string }> = []
      
      for (const item of items) {
        const cacheKey = getCacheKey(item.text, targetLang)
        const cached = translationCache.current.get(cacheKey)
        if (cached) {
          results[item.id] = cached
        } else {
          uncached.push(item)
        }
      }

      // Translate uncached items in batches
      if (uncached.length > 0) {
        const texts = uncached.map(i => i.text)
        
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts,
            toLanguage: targetLang,
            fromLanguage: sourceLanguage
          })
        })

        if (response.ok) {
          const data = await response.json()
          const translatedTexts = data.translations || texts

          uncached.forEach((item, index) => {
            const translated = translatedTexts[index] || item.text
            results[item.id] = translated
            
            // Cache the result
            const cacheKey = getCacheKey(item.text, targetLang)
            translationCache.current.set(cacheKey, translated)
          })
        } else {
          // On error, use original texts
          uncached.forEach(item => {
            results[item.id] = item.text
          })
        }
      }
    } catch (error) {
      console.error('Batch translation error:', error)
      // On error, use original texts
      items.forEach(item => {
        if (!results[item.id]) {
          results[item.id] = item.text
        }
      })
    } finally {
      setIsTranslating(false)
    }

    return results
  }, [sourceLanguage])

  // Register content for translation
  const registerContent = useCallback((id: string, text: string) => {
    pendingTranslations.current.set(id, text)
  }, [])

  // Get translated content by ID
  const getTranslated = useCallback((id: string, original: string): string => {
    if (locale === sourceLanguage) return original
    return translations[id] || original
  }, [locale, translations, sourceLanguage])

  // Translate all registered content when locale changes
  useEffect(() => {
    if (!enabled) return
    if (locale === sourceLanguage) {
      setTranslations({})
      return
    }

    const items = Array.from(pendingTranslations.current.entries()).map(([id, text]) => ({
      id,
      text
    }))

    if (items.length > 0) {
      translateBatch(items, locale).then(setTranslations)
    }
  }, [locale, enabled, sourceLanguage, translateBatch])

  return {
    locale,
    isTranslating,
    translateText,
    translateBatch,
    registerContent,
    getTranslated,
    translations
  }
}

/**
 * Hook for translating a list of jobs
 */
export function useTranslatedJobs<T extends { id: string; title: string; description?: string }>(
  jobs: T[],
  options: UseAutoTranslateOptions = {}
) {
  const { locale } = useI18n()
  const { sourceLanguage = 'en' } = options
  const [translatedJobs, setTranslatedJobs] = useState<T[]>(jobs)
  const [isTranslating, setIsTranslating] = useState(false)
  const cacheRef = useRef<Map<string, { title: string; description?: string }>>(new Map())

  useEffect(() => {
    // If same language or no jobs, return original
    if (locale === sourceLanguage || jobs.length === 0) {
      setTranslatedJobs(jobs)
      return
    }

    const translateJobs = async () => {
      setIsTranslating(true)
      
      try {
        const translated = await Promise.all(
          jobs.map(async (job) => {
            const cacheKey = `${job.id}:${locale}`
            const cached = cacheRef.current.get(cacheKey)
            
            if (cached) {
              return { ...job, title: cached.title, description: cached.description }
            }

            // Translate title and description together
            const response = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contentType: 'job',
                title: job.title,
                description: job.description || '',
                toLanguage: locale,
                fromLanguage: sourceLanguage
              })
            })

            if (response.ok) {
              const data = await response.json()
              const result = {
                title: data.title || job.title,
                description: data.description || job.description
              }
              cacheRef.current.set(cacheKey, result)
              return { ...job, ...result }
            }

            return job
          })
        )

        setTranslatedJobs(translated)
      } catch (error) {
        console.error('Job translation error:', error)
        setTranslatedJobs(jobs)
      } finally {
        setIsTranslating(false)
      }
    }

    translateJobs()
  }, [jobs, locale, sourceLanguage])

  return { jobs: translatedJobs, isTranslating }
}

/**
 * Hook for translating a list of deals
 */
export function useTranslatedDeals<T extends { id: string; title: string; description?: string }>(
  deals: T[],
  options: UseAutoTranslateOptions = {}
) {
  const { locale } = useI18n()
  const { sourceLanguage = 'en' } = options
  const [translatedDeals, setTranslatedDeals] = useState<T[]>(deals)
  const [isTranslating, setIsTranslating] = useState(false)
  const cacheRef = useRef<Map<string, { title: string; description?: string }>>(new Map())

  useEffect(() => {
    // If same language or no deals, return original
    if (locale === sourceLanguage || deals.length === 0) {
      setTranslatedDeals(deals)
      return
    }

    const translateDeals = async () => {
      setIsTranslating(true)
      
      try {
        const translated = await Promise.all(
          deals.map(async (deal) => {
            const cacheKey = `${deal.id}:${locale}`
            const cached = cacheRef.current.get(cacheKey)
            
            if (cached) {
              return { ...deal, title: cached.title, description: cached.description }
            }

            // Translate title and description together
            const response = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contentType: 'deal',
                title: deal.title,
                description: deal.description || '',
                toLanguage: locale,
                fromLanguage: sourceLanguage
              })
            })

            if (response.ok) {
              const data = await response.json()
              const result = {
                title: data.title || deal.title,
                description: data.description || deal.description
              }
              cacheRef.current.set(cacheKey, result)
              return { ...deal, ...result }
            }

            return deal
          })
        )

        setTranslatedDeals(translated)
      } catch (error) {
        console.error('Deal translation error:', error)
        setTranslatedDeals(deals)
      } finally {
        setIsTranslating(false)
      }
    }

    translateDeals()
  }, [deals, locale, sourceLanguage])

  return { deals: translatedDeals, isTranslating }
}
