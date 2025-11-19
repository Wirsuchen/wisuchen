'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Languages, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/contexts/i18n-context'

interface TranslateButtonProps {
  content: string
  currentLanguage: 'de' | 'en' | 'fr' | 'it'
  onTranslated: (translation: string, language: 'de' | 'en' | 'fr' | 'it') => void
  contentType?: 'job_description' | 'blog_article' | 'general'
}

export function TranslateButton({ content, currentLanguage, onTranslated, contentType = 'general' }: TranslateButtonProps) {
  const [targetLanguage, setTargetLanguage] = useState<'de' | 'en' | 'fr' | 'it'>('en')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleTranslate = async () => {
    if (!content.trim()) {
      toast({
        title: t('ai.translateButton.noContentTitle', 'No Content'),
        description: t('ai.translateButton.noContentDescription', 'There is no content to translate'),
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          fromLanguage: currentLanguage,
          toLanguage: targetLanguage,
          contentType,
        }),
      })

      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let full = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''
        for (const msg of parts) {
          const line = msg.split('\n').find((l) => l.startsWith('data: ')) || ''
          if (line) {
            try {
              const payload = JSON.parse(line.replace('data: ', ''))
              if (payload?.text) {
                full += payload.text
              }
            } catch {}
          }
        }
      }
      if (full) {
        onTranslated(full, targetLanguage)
        setOpen(false)
        toast({
          title: t('ai.translateButton.translatedTitle', '✨ Translated!'),
          description: t(
            'ai.translateButton.translatedDescription',
            `Content translated to ${getLanguageName(targetLanguage)}`
          ),
        })
      }
    } catch (error) {
      console.error('Error translating:', error)
      toast({
        title: t('common.error', 'Error'),
        description: t('ai.translateButton.errorConnecting', 'Failed to connect to translation service'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      de: t('common.languages.de', 'German'),
      en: t('common.languages.en', 'English'),
      fr: t('common.languages.fr', 'French'),
      it: t('common.languages.it', 'Italian'),
    }
    return names[code] || code
  }

  const languages = [
    { code: 'en', flag: '🇬🇧', name: t('common.languages.en', 'English') },
    { code: 'de', flag: '🇩🇪', name: t('common.languages.deNative', 'Deutsch') },
    { code: 'fr', flag: '🇫🇷', name: t('common.languages.frNative', 'Français') },
    { code: 'it', flag: '🇮🇹', name: t('common.languages.itNative', 'Italiano') },
  ].filter((lang) => lang.code !== currentLanguage)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Languages className="h-4 w-4 mr-2" />
          {t('ai.translateButton.buttonLabel', 'Translate')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">
              {t('ai.translateButton.heading', 'Translate Content')}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t('ai.translateButton.currentLanguage', 'Current language:')}{' '}
              {getLanguageName(currentLanguage)}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('ai.translateButton.translateTo', 'Translate to:')}
            </label>
            <Select value={targetLanguage} onValueChange={(v) => setTargetLanguage(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleTranslate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('ai.translateButton.translating', 'Translating...')}
              </>
            ) : (
              <>
                <Languages className="h-4 w-4 mr-2" />
                {t('ai.translateButton.buttonLabel', 'Translate')}
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
