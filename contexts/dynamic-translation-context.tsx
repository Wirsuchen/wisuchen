'use client'

/**
 * Dynamic Translation Context
 * 
 * This context provides automatic translation of dynamic content (jobs, deals, blogs)
 * when the user changes the language from the header language switcher.
 * 
 * Usage:
 * 1. Wrap your content with DynamicTranslationProvider (already in layout.tsx)
 * 2. Use useAutoTranslatedContent hook in your components to register content for auto-translation
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { useI18n } from '@/contexts/i18n-context'

// Simple language detection based on common words - improved patterns
function detectLanguage(text: string): 'en' | 'de' | 'fr' | 'it' {
    if (!text || text.length < 10) return 'en'

    // Quick check for very strong German indicators (job gender notation)
    if (/\(m\/w\/d\)|\(w\/m\/d\)|\(m\/w\/x\)|\(all[e]?\s*geschlechter\)/i.test(text)) {
        return 'de'
    }

    const lower = text.toLowerCase()

    // Enhanced German patterns
    const germanWords = ['und', 'für', 'mit', 'bei', 'wir', 'sie', 'der', 'die', 'das', 'ist', 'werden', 'haben', 'zur', 'zum', 'einen', 'einem', 'unseres', 'unsere', 'suchen', 'arbeiten', 'wichtigsten', 'arbeitsmarkt', 'deutschland', 'bewerber', 'unternehmen', 'wissen', 'digitaler', 'flexibler']
    const frenchWords = ['pour', 'avec', 'dans', 'nous', 'vous', 'les', 'des', 'une', 'sont', 'cette', 'sur', 'par', 'qui', 'que', 'aux', 'ses', 'nos', 'vos']
    const italianWords = ['per', 'con', 'che', 'sono', 'della', 'nella', 'questo', 'questa', 'gli', 'del', 'dei', 'delle', 'alla', 'allo']

    // Count word matches
    const deCount = germanWords.filter(w => lower.includes(` ${w} `) || lower.startsWith(`${w} `) || lower.endsWith(` ${w}`) || lower === w).length
    const frCount = frenchWords.filter(w => lower.includes(` ${w} `) || lower.startsWith(`${w} `) || lower.endsWith(` ${w}`) || lower === w).length
    const itCount = italianWords.filter(w => lower.includes(` ${w} `) || lower.startsWith(`${w} `) || lower.endsWith(` ${w}`) || lower === w).length

    // Check for German special characters (strong indicator)
    const germanChars = (lower.match(/[äöüß]/g) || []).length
    const frenchChars = (lower.match(/[éèêëàâçîïôùûœ]/g) || []).length
    const italianChars = (lower.match(/[àèéìíòóùú]/g) || []).length

    // Add character scores (weighted more heavily)
    const deScore = deCount + germanChars * 2
    const frScore = frCount + frenchChars * 2
    const itScore = itCount + italianChars * 2

    // Find highest score
    if (deScore >= 2 && deScore >= frScore && deScore >= itScore) return 'de'
    if (frScore >= 2 && frScore >= deScore && frScore >= itScore) return 'fr'
    if (itScore >= 2 && itScore >= deScore && itScore >= frScore) return 'it'

    return 'en'
}

interface TranslationCache {
    [key: string]: {
        [targetLang: string]: string
    }
}

interface ContentItem {
    id: string
    type: 'job' | 'deal' | 'blog'
    fields: {
        [fieldName: string]: string // e.g., { title: "...", description: "..." }
    }
}

interface TranslatedContent {
    [contentId: string]: {
        [fieldName: string]: string
    }
}

interface DynamicTranslationContextType {
    // Register content for automatic translation
    registerContent: (items: ContentItem[]) => void
    // Unregister content (cleanup)
    unregisterContent: (ids: string[]) => void
    // Get translated content by ID and field
    getTranslated: (id: string, field: string, original: string) => string
    // Check if content is being translated
    isTranslating: boolean
    // Get translation progress
    progress: { current: number; total: number }
    // Force re-translate all registered content
    retranslateAll: () => Promise<void>
    // Current locale
    currentLocale: string
}

const DynamicTranslationContext = createContext<DynamicTranslationContextType | undefined>(undefined)

// Global in-memory cache for translations
const globalTranslationCache: TranslationCache = {}

interface DynamicTranslationProviderProps {
    children: ReactNode
}

export function DynamicTranslationProvider({ children }: DynamicTranslationProviderProps) {
    const { locale } = useI18n()
    const [isTranslating, setIsTranslating] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [translatedContent, setTranslatedContent] = useState<TranslatedContent>({})

    // Use refs to track state without causing re-renders
    const registeredContentRef = useRef<Map<string, ContentItem>>(new Map())
    const lastTranslatedLocaleRef = useRef<string>('en')
    const isTranslatingRef = useRef<boolean>(false)
    const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Generate cache key for a piece of content
    const getCacheKey = useCallback((text: string): string => {
        let hash = 0
        for (let i = 0; i < Math.min(text.length, 100); i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i)
            hash |= 0
        }
        return `t_${hash}`
    }, [])

    // Check if translation is cached
    const getCachedTranslation = useCallback((text: string, targetLang: string): string | null => {
        const key = getCacheKey(text)
        return globalTranslationCache[key]?.[targetLang] || null
    }, [getCacheKey])

    // Cache a translation
    const cacheTranslation = useCallback((text: string, targetLang: string, translation: string) => {
        const key = getCacheKey(text)
        if (!globalTranslationCache[key]) {
            globalTranslationCache[key] = {}
        }
        globalTranslationCache[key][targetLang] = translation
    }, [getCacheKey])

    // Translate content using the API
    // Now supports translating TO English when source is in another language
    // Also skips translation when source and target are the same
    const translateTexts = useCallback(async (texts: string[], targetLang: string): Promise<string[]> => {
        if (texts.length === 0) {
            return texts
        }

        const results: string[] = []
        const textsToTranslate: { index: number; text: string; sourceLang?: string }[] = []

        texts.forEach((text, index) => {
            // Detect the source language of each text
            const detectedLang = detectLanguage(text)

            // Skip translation if source and target are the same
            if (detectedLang === targetLang) {
                results[index] = text
                return
            }

            // Check cache first
            const cached = getCachedTranslation(text, targetLang)
            if (cached) {
                results[index] = cached
            } else {
                textsToTranslate.push({ index, text, sourceLang: detectedLang })
            }
        })

        if (textsToTranslate.length === 0) {
            return results
        }

        try {
            // Group by source language for better translation accuracy
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    texts: textsToTranslate.map(t => t.text),
                    toLanguage: targetLang,
                    fromLanguage: textsToTranslate[0]?.sourceLang, // Use first item's detected language
                }),
            })

            const data = await response.json()

            if (response.ok && data.translations) {
                textsToTranslate.forEach((item, i) => {
                    const translation = data.translations[i] || item.text
                    results[item.index] = translation
                    cacheTranslation(item.text, targetLang, translation)
                })
            } else {
                textsToTranslate.forEach(item => {
                    results[item.index] = item.text
                })
            }
        } catch (error) {
            console.error('Translation error:', error)
            textsToTranslate.forEach(item => {
                results[item.index] = item.text
            })
        }

        return results
    }, [getCachedTranslation, cacheTranslation])

    // Translate all registered content
    const translateAllContent = useCallback(async (targetLang: string) => {
        // Prevent concurrent translations
        if (isTranslatingRef.current) return

        const items = Array.from(registeredContentRef.current.values())

        if (items.length === 0) {
            setTranslatedContent({})
            return
        }

        // For English locale, check if any content needs translation (is in wrong language)
        if (targetLang === 'en') {
            const hasNonEnglishContent = items.some(item =>
                Object.values(item.fields).some(text =>
                    text && detectLanguage(text) !== 'en'
                )
            )
            if (!hasNonEnglishContent) {
                setTranslatedContent({})
                return
            }
        }

        isTranslatingRef.current = true
        setIsTranslating(true)

        // Group items by content type for proper API calls with DB storage
        const blogItems = items.filter(item => item.type === 'blog')
        const jobItems = items.filter(item => item.type === 'job')
        const dealItems = items.filter(item => item.type === 'deal')

        setProgress({ current: 0, total: items.length })

        const newTranslations: TranslatedContent = {}
        let completed = 0

        // Helper function to translate and store a single content item
        const translateContentItem = async (item: ContentItem) => {
            const detectedLang = detectLanguage(Object.values(item.fields).join(' '))

            // Skip if source and target are the same
            if (detectedLang === targetLang) {
                return null
            }

            // Check cache first
            const cachedTitle = getCachedTranslation(item.fields.title || '', targetLang)
            const cachedExcerpt = getCachedTranslation(item.fields.excerpt || item.fields.description || '', targetLang)

            if (cachedTitle && cachedExcerpt) {
                return {
                    id: item.id,
                    title: cachedTitle,
                    excerpt: cachedExcerpt,
                    description: cachedExcerpt
                }
            }

            try {
                const response = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contentType: item.type,
                        title: item.fields.title || '',
                        description: item.fields.excerpt || item.fields.description || '',
                        toLanguage: targetLang,
                        fromLanguage: detectedLang,
                        contentId: item.id, // This triggers DB storage
                    }),
                })

                if (response.ok) {
                    const data = await response.json()
                    // Cache the translations
                    if (data.title) cacheTranslation(item.fields.title || '', targetLang, data.title)
                    if (data.description) cacheTranslation(item.fields.excerpt || item.fields.description || '', targetLang, data.description)

                    // Log database storage status
                    if (data.stored) {
                        console.log(`[Translation] ✅ Saved to database: ${item.id} (${detectedLang} → ${targetLang})`)
                    } else {
                        console.log(`[Translation] 📝 Translated: ${item.id} (${detectedLang} → ${targetLang}) - cached locally`)
                    }

                    return {
                        id: item.id,
                        title: data.title || item.fields.title,
                        excerpt: data.description || item.fields.excerpt,
                        description: data.description || item.fields.description,
                        stored: data.stored
                    }
                }
            } catch (error) {
                console.error(`Translation error for ${item.id}:`, error)
            }
            return null
        }

        // Process items in batches of 5 to avoid overwhelming the API
        const allItems = [...blogItems, ...jobItems, ...dealItems]
        const batchSize = 5
        let storedCount = 0
        let translatedCount = 0

        for (let i = 0; i < allItems.length; i += batchSize) {
            const batch = allItems.slice(i, i + batchSize)
            const results = await Promise.all(batch.map(translateContentItem))

            results.forEach((result, idx) => {
                const item = batch[idx]
                if (result) {
                    newTranslations[item.id] = {
                        title: result.title,
                        excerpt: result.excerpt || result.description,
                        description: result.description || result.excerpt
                    }
                    translatedCount++
                    if (result.stored) storedCount++
                }
            })

            completed += batch.length
            setProgress({ current: completed, total: allItems.length })
        }

        // Log summary
        if (translatedCount > 0) {
            console.log(`[Translation] 🎉 Complete: ${translatedCount} items translated to ${targetLang}, ${storedCount} saved to database`)
        }

        setTranslatedContent(newTranslations)
        isTranslatingRef.current = false
        setIsTranslating(false)
    }, [getCachedTranslation, cacheTranslation])

    // Auto-translate when locale changes (debounced)
    useEffect(() => {
        // Only translate if locale actually changed
        if (lastTranslatedLocaleRef.current === locale) return

        // Clear any pending translation
        if (translationTimeoutRef.current) {
            clearTimeout(translationTimeoutRef.current)
        }

        // Update the ref immediately
        lastTranslatedLocaleRef.current = locale

        // Debounce the translation to prevent multiple rapid calls
        translationTimeoutRef.current = setTimeout(() => {
            translateAllContent(locale)
        }, 100)

        return () => {
            if (translationTimeoutRef.current) {
                clearTimeout(translationTimeoutRef.current)
            }
        }
    }, [locale, translateAllContent])

    // Register content for translation (does NOT trigger immediate translation)
    const registerContent = useCallback((items: ContentItem[]) => {
        let hasNewItems = false

        items.forEach(item => {
            if (!registeredContentRef.current.has(item.id)) {
                registeredContentRef.current.set(item.id, item)
                hasNewItems = true
            }
        })

        // Translate new items if we're not already translating
        // Also translate when in English if content might be in another language
        if (hasNewItems && !isTranslatingRef.current) {
            // Use a small delay to batch multiple registrations
            if (translationTimeoutRef.current) {
                clearTimeout(translationTimeoutRef.current)
            }
            translationTimeoutRef.current = setTimeout(() => {
                translateAllContent(lastTranslatedLocaleRef.current)
            }, 200)
        }
    }, [translateAllContent])

    // Unregister content
    const unregisterContent = useCallback((ids: string[]) => {
        ids.forEach(id => {
            registeredContentRef.current.delete(id)
        })

        setTranslatedContent(prev => {
            const next = { ...prev }
            ids.forEach(id => delete next[id])
            return next
        })
    }, [])

    // Get translated content
    const getTranslated = useCallback((id: string, field: string, original: string): string => {
        // Check if we have a translation for this content
        const translation = translatedContent[id]?.[field]
        if (translation) {
            return translation
        }
        return original
    }, [translatedContent])

    // Force re-translate all content
    const retranslateAll = useCallback(async () => {
        isTranslatingRef.current = false // Reset the flag
        await translateAllContent(locale)
    }, [locale, translateAllContent])

    const value: DynamicTranslationContextType = {
        registerContent,
        unregisterContent,
        getTranslated,
        isTranslating,
        progress,
        retranslateAll,
        currentLocale: locale,
    }

    return (
        <DynamicTranslationContext.Provider value={value}>
            {children}
        </DynamicTranslationContext.Provider>
    )
}

export function useDynamicTranslation() {
    const context = useContext(DynamicTranslationContext)
    if (!context) {
        throw new Error('useDynamicTranslation must be used within a DynamicTranslationProvider')
    }
    return context
}

/**
 * Hook for automatically translating content when language changes
 * 
 * Usage:
 * const { getTranslated, isTranslating } = useAutoTranslatedContent(items)
 * // Then use: getTranslated(item.id, 'title', item.title)
 */
export function useAutoTranslatedContent(items: ContentItem[]) {
    const { registerContent, unregisterContent, getTranslated, isTranslating, progress, currentLocale } = useDynamicTranslation()
    const itemIdsRef = useRef<string[]>([])
    const lastItemsKeyRef = useRef<string>('')

    useEffect(() => {
        if (items.length === 0) return

        // Generate a stable key from item IDs
        const itemsKey = items.map(item => item.id).join(',')

        // Skip if items haven't changed
        if (lastItemsKeyRef.current === itemsKey) return

        lastItemsKeyRef.current = itemsKey

        // Register new items
        registerContent(items)

        // Track registered IDs for cleanup
        const newIds = items.map(item => item.id)
        itemIdsRef.current = newIds

        return () => {
            // Cleanup on unmount
            if (itemIdsRef.current.length > 0) {
                unregisterContent(itemIdsRef.current)
            }
        }
    }, [items, registerContent, unregisterContent])

    return { getTranslated, isTranslating, progress, currentLocale }
}

/**
 * Simple hook for a single translatable text
 */
export function useTranslatedText(id: string, field: string, originalText: string) {
    const { getTranslated, isTranslating, currentLocale } = useDynamicTranslation()

    useEffect(() => {
        // This effect is just for re-rendering when locale changes
    }, [currentLocale])

    return {
        text: getTranslated(id, field, originalText),
        isTranslating,
    }
}
