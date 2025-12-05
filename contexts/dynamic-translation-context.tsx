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

// In-memory cache for translations across components
const translationCache: TranslationCache = {}

interface DynamicTranslationProviderProps {
    children: ReactNode
}

export function DynamicTranslationProvider({ children }: DynamicTranslationProviderProps) {
    const { locale } = useI18n()
    const [isTranslating, setIsTranslating] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [translatedContent, setTranslatedContent] = useState<TranslatedContent>({})
    const registeredContentRef = useRef<Map<string, ContentItem>>(new Map())
    const previousLocaleRef = useRef<string>(locale)
    const isInitialMountRef = useRef(true)

    // Generate cache key for a piece of content
    const getCacheKey = useCallback((text: string): string => {
        // Simple hash for cache key
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
        return translationCache[key]?.[targetLang] || null
    }, [getCacheKey])

    // Cache a translation
    const cacheTranslation = useCallback((text: string, targetLang: string, translation: string) => {
        const key = getCacheKey(text)
        if (!translationCache[key]) {
            translationCache[key] = {}
        }
        translationCache[key][targetLang] = translation
    }, [getCacheKey])

    // Translate content using the API
    const translateTexts = useCallback(async (texts: string[], targetLang: string): Promise<string[]> => {
        if (targetLang === 'en' || texts.length === 0) {
            return texts // English is source, no translation needed
        }

        // Check cache first
        const results: string[] = []
        const textsToTranslate: { index: number; text: string }[] = []

        texts.forEach((text, index) => {
            const cached = getCachedTranslation(text, targetLang)
            if (cached) {
                results[index] = cached
            } else {
                textsToTranslate.push({ index, text })
            }
        })

        // If all cached, return immediately
        if (textsToTranslate.length === 0) {
            return results
        }

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    texts: textsToTranslate.map(t => t.text),
                    toLanguage: targetLang,
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
                // On error, use original texts
                textsToTranslate.forEach(item => {
                    results[item.index] = item.text
                })
            }
        } catch (error) {
            console.error('Translation error:', error)
            // On error, use original texts
            textsToTranslate.forEach(item => {
                results[item.index] = item.text
            })
        }

        return results
    }, [getCachedTranslation, cacheTranslation])

    // Translate all registered content
    const translateAllContent = useCallback(async (targetLang: string) => {
        const items = Array.from(registeredContentRef.current.values())

        if (items.length === 0 || targetLang === 'en') {
            // English is source language, clear translations to show originals
            setTranslatedContent({})
            return
        }

        setIsTranslating(true)

        // Collect all texts to translate
        const allTexts: { contentId: string; field: string; text: string }[] = []

        items.forEach(item => {
            Object.entries(item.fields).forEach(([field, text]) => {
                if (text && text.trim()) {
                    allTexts.push({ contentId: item.id, field, text })
                }
            })
        })

        setProgress({ current: 0, total: allTexts.length })

        if (allTexts.length === 0) {
            setIsTranslating(false)
            return
        }

        // Translate in batches of 20 for efficiency
        const batchSize = 20
        const newTranslations: TranslatedContent = {}

        for (let i = 0; i < allTexts.length; i += batchSize) {
            const batch = allTexts.slice(i, i + batchSize)
            const textsToTranslate = batch.map(item => item.text)

            try {
                const translations = await translateTexts(textsToTranslate, targetLang)

                batch.forEach((item, index) => {
                    if (!newTranslations[item.contentId]) {
                        newTranslations[item.contentId] = {}
                    }
                    newTranslations[item.contentId][item.field] = translations[index] || item.text
                })

                setProgress({ current: Math.min(i + batchSize, allTexts.length), total: allTexts.length })
            } catch (error) {
                console.error('Batch translation error:', error)
                // On error, keep original text
                batch.forEach(item => {
                    if (!newTranslations[item.contentId]) {
                        newTranslations[item.contentId] = {}
                    }
                    newTranslations[item.contentId][item.field] = item.text
                })
            }
        }

        setTranslatedContent(newTranslations)
        setIsTranslating(false)
    }, [translateTexts])

    // Auto-translate when locale changes
    useEffect(() => {
        // Skip on initial mount
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false
            previousLocaleRef.current = locale
            return
        }

        // Only translate if locale actually changed
        if (previousLocaleRef.current !== locale) {
            previousLocaleRef.current = locale
            translateAllContent(locale)
        }
    }, [locale, translateAllContent])

    // Register content for translation
    const registerContent = useCallback((items: ContentItem[]) => {
        let hasNewItems = false

        items.forEach(item => {
            if (!registeredContentRef.current.has(item.id)) {
                registeredContentRef.current.set(item.id, item)
                hasNewItems = true
            }
        })

        // If we have new items and locale is not English, translate them
        if (hasNewItems && locale !== 'en') {
            translateAllContent(locale)
        }
    }, [locale, translateAllContent])

    // Unregister content
    const unregisterContent = useCallback((ids: string[]) => {
        ids.forEach(id => {
            registeredContentRef.current.delete(id)
        })

        // Clean up translations for unregistered content
        setTranslatedContent(prev => {
            const next = { ...prev }
            ids.forEach(id => delete next[id])
            return next
        })
    }, [])

    // Get translated content
    const getTranslated = useCallback((id: string, field: string, original: string): string => {
        if (locale === 'en') {
            return original // English is source language
        }
        return translatedContent[id]?.[field] || original
    }, [locale, translatedContent])

    // Force re-translate all content
    const retranslateAll = useCallback(async () => {
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

    useEffect(() => {
        if (items.length > 0) {
            // Register new items
            registerContent(items)

            // Track registered IDs for cleanup
            const newIds = items.map(item => item.id)
            itemIdsRef.current = newIds
        }

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
