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
}

export function TranslateButton({ text, onTranslate, className, contentType = 'general' }: TranslateButtonProps) {
    const [loading, setLoading] = useState(false)
    const { locale, t } = useI18n()
    const { toast } = useToast()

    const handleTranslate = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!text) return

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
                    fromLanguage: 'en', // Assuming source is English for now, ideally dynamic
                    contentType
                }),
            })

            const data = await response.json()

            if (response.ok && data.translation) {
                onTranslate(data.translation)
                toast({
                    title: t('common.success'),
                    description: t('common.translationSuccess'),
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
            <span className="sr-only">{t('common.translate')}</span>
        </Button>
    )
}
