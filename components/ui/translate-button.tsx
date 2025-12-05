"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Languages, Loader2 } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import { useToast } from "@/hooks/use-toast"

interface TranslateButtonProps {
    text: string
    onTranslate: (translatedText: string) => void
    className?: string
    contentType?: 'job_description' | 'blog_article' | 'general'
    /** If true, shows text label alongside the icon */
    showLabel?: boolean
}

export function TranslateButton({
    text,
    onTranslate,
    className,
    contentType = 'general',
    showLabel = false
}: TranslateButtonProps) {
    const [loading, setLoading] = useState(false)
    const { locale, t } = useI18n()
    const { toast } = useToast()

    const handleTranslate = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!text) return

        // Don't translate if already in English (source language)
        if (locale === 'en') {
            toast({
                title: t('common.info'),
                description: t('common.alreadyInSourceLanguage') || 'Content is already in the source language',
            })
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: text,
                    toLanguage: locale,
                    contentType
                }),
            })

            const data = await response.json()

            if (response.ok && data.translation) {
                onTranslate(data.translation)
                toast({
                    title: t('common.success'),
                    description: data.fromCache
                        ? t('common.translationFromCache') || 'Translation loaded from cache'
                        : t('common.translationSuccess'),
                })
            } else {
                throw new Error(data.error || 'Translation failed')
            }
        } catch (error) {
            console.error('Translation error:', error)
            toast({
                title: t('common.error'),
                description: t('common.translationError'),
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className={className}
            onClick={handleTranslate}
            disabled={loading}
            title={t('common.translate')}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Languages className="h-4 w-4" />
            )}
            {showLabel && (
                <span className="ml-1">{t('common.translate')}</span>
            )}
            <span className="sr-only">{t('common.translate')}</span>
        </Button>
    )
}

/**
 * Batch translate button for translating multiple texts at once
 */
interface BatchTranslateButtonProps {
    texts: string[]
    onTranslate: (translatedTexts: string[]) => void
    className?: string
    showLabel?: boolean
}

export function BatchTranslateButton({
    texts,
    onTranslate,
    className,
    showLabel = false
}: BatchTranslateButtonProps) {
    const [loading, setLoading] = useState(false)
    const { locale, t } = useI18n()
    const { toast } = useToast()

    const handleTranslate = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!texts || texts.length === 0) return

        if (locale === 'en') {
            toast({
                title: t('common.info'),
                description: t('common.alreadyInSourceLanguage') || 'Content is already in the source language',
            })
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    texts,
                    toLanguage: locale,
                }),
            })

            const data = await response.json()

            if (response.ok && data.translations) {
                onTranslate(data.translations)
                toast({
                    title: t('common.success'),
                    description: t('common.batchTranslationSuccess') || `Translated ${texts.length} items`,
                })
            } else {
                throw new Error(data.error || 'Batch translation failed')
            }
        } catch (error) {
            console.error('Batch translation error:', error)
            toast({
                title: t('common.error'),
                description: t('common.translationError'),
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className={className}
            onClick={handleTranslate}
            disabled={loading}
            title={t('common.translateAll') || 'Translate all'}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Languages className="h-4 w-4" />
            )}
            {showLabel && (
                <span className="ml-1">{t('common.translateAll') || 'Translate all'}</span>
            )}
            <span className="sr-only">{t('common.translateAll') || 'Translate all'}</span>
        </Button>
    )
}
