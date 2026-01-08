'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { Locale, defaultLocale, isValidLocale } from '@/i18n/config'
import { getTranslation, tr } from '@/i18n/utils'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, fallback?: string) => string
  tr: (key: string, variables?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
}

// Get locale from localStorage or cookie
function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale

  // Try localStorage first
  const stored = localStorage.getItem('preferredLocale')
  if (stored && isValidLocale(stored)) {
    return stored as Locale
  }

  // Try cookie
  if (typeof document !== 'undefined') {
    const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/)
    if (cookieMatch && isValidLocale(cookieMatch[1])) {
      return cookieMatch[1] as Locale
    }
  }

  return defaultLocale
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, string>>({})
  const translationQueue = useContext(TranslationQueueContext) || new Set<string>()
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)

  // Load stored locale and dynamic translations on mount
  useEffect(() => {
    const storedLocale = getStoredLocale()
    console.log('🌐 [I18nProvider] Mounting, stored locale:', storedLocale)
    setLocale(storedLocale)

    // Load cached dynamic translations
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`dynamic_translations_${storedLocale}`)
        if (cached) {
          setDynamicTranslations(JSON.parse(cached))
        }
      }
    } catch (e) {
      console.error('Failed to load dynamic translations', e)
    }
  }, [])

  // Save dynamic translations when they change
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(dynamicTranslations).length > 0) {
      localStorage.setItem(`dynamic_translations_${locale}`, JSON.stringify(dynamicTranslations))
    }
  }, [dynamicTranslations, locale])

  // Reload dynamic translations when locale changes
  useEffect(() => {
    console.log('🌐 [I18nProvider] Locale state changed to:', locale)
    setDynamicTranslations({})
    const queue = new Set<string>() // Reset queue for new locale

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`dynamic_translations_${locale}`)
      if (cached) {
        setDynamicTranslations(JSON.parse(cached))
      }
    }
  }, [locale])

  const setLocaleHandler = (newLocale: Locale) => {
    console.log('🌐 [I18nProvider] setLocale called with:', newLocale)
    setLocale(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLocale', newLocale)
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
      console.log('🌐 [I18nProvider] Saved to localStorage and cookie:', newLocale)
    }
  }

  // Queue processing logic
  const processQueue = async () => {
    if (translationQueue.size === 0 || isProcessingQueue) return

    setIsProcessingQueue(true)
    const batch = Array.from(translationQueue).slice(0, 20) // Batch of 20
    // Remove from queue immediately to prevent double processing
    batch.forEach(k => translationQueue.delete(k))

    console.log(`🔄 [AutoTranslate] Processing batch of ${batch.length} keys for ${locale}`)

    try {
      // We need the English text for these keys to translate
      const textsToTranslate = batch.map(key => {
        return getTranslation('en', key)
      }).filter(text => text && text.length > 0 && !text.includes('{')) // Skip empty or variable-heavy strings

      if (textsToTranslate.length === 0) {
        setIsProcessingQueue(false)
        return
      }

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: textsToTranslate,
          toLanguage: locale,
          fromLanguage: "en"
        }),
      })

      const data = await response.json()

      if (data.translations && Array.isArray(data.translations)) {
        setDynamicTranslations(prev => {
          const next = { ...prev }
          batch.forEach((key, index) => {
            // Map back: key -> translated text
            // We must match the index of textsToTranslate carefully? 
            // Actually batch indices match textsToTranslate indices if we didn't filter.
            // Let's redo this safer.

            const originalText = getTranslation('en', key)
            // Find the translation corresponding to this text
            const textIndex = textsToTranslate.indexOf(originalText)
            if (textIndex !== -1 && data.translations[textIndex]) {
              next[key] = data.translations[textIndex]
            }
          })
          return next
        })
      }

    } catch (err) {
      console.error("Translation batch failed", err)
      // Put back in queue? Nah, retry next reload.
    } finally {
      setIsProcessingQueue(false)
      // If items remain, trigger next batch
      if (translationQueue.size > 0) {
        setTimeout(processQueue, 1000)
      }
    }
  }

  // Debounced queue processor
  useEffect(() => {
    const interval = setInterval(() => {
      if (translationQueue.size > 0 && !isProcessingQueue) {
        processQueue()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [translationQueue, isProcessingQueue, locale])


  const value: I18nContextType = {
    locale,
    setLocale: setLocaleHandler,
    t: (key: string, fallback?: string) => {
      // 1. Check Dynamic Cache first (fastest, overrides static)
      if (locale !== 'en' && dynamicTranslations[key]) {
        return dynamicTranslations[key]
      }

      // 2. Check Static JSON
      const staticTranslation = getTranslation(locale, key, fallback)

      // 3. Auto-Translate Logic
      // If we are NOT in English, AND the result is basically the English text (fallback kicked in)
      if (locale !== 'en') {
        const englishText = getTranslation('en', key)
        // If static translation matches english text (meaning it's missing or untranslated in the json file)
        // OR if the static file just doesn't have it.
        // Warning: This assumes English text is unique. 

        const isMissing = staticTranslation === key || staticTranslation === englishText

        if (isMissing && englishText && englishText !== key) {
          // Queue for translation if not already done
          if (!dynamicTranslations[key] && !translationQueue.has(key)) {
            translationQueue.add(key)
          }
          // Return english as placeholder while loading
          return englishText
        }
      }

      return staticTranslation
    },
    tr: (key: string, variables?: Record<string, string | number>) => tr(locale, key, variables),
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// Simple context to hold the singleton queue, avoiding re-render loops
const TranslationQueueContext = createContext<Set<string> | undefined>(undefined)

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    // Fallback if provider is missing
    return {
      locale: defaultLocale,
      setLocale: () => { },
      t: (key: string, fallback?: string) => getTranslation(defaultLocale, key, fallback),
      tr: (key: string, variables?: Record<string, string | number>) => tr(defaultLocale, key, variables),
    }
  }
  return context
}

// Convenience hook for just the translation function
export function useTranslation() {
  const { t, tr } = useI18n()
  return { t, tr }
}

// Convenience hook for just the locale
export function useLocale() {
  const { locale } = useI18n()
  return locale
}
