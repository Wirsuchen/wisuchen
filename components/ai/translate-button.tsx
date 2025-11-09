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

  const handleTranslate = async () => {
    if (!content.trim()) {
      toast({
        title: 'No Content',
        description: 'There is no content to translate',
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
        toast({ title: '✨ Translated!', description: `Content translated to ${getLanguageName(targetLanguage)}` })
      }
    } catch (error) {
      console.error('Error translating:', error)
      toast({ title: 'Error', description: 'Failed to connect to translation service', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      de: 'German',
      en: 'English',
      fr: 'French',
      it: 'Italian',
    }
    return names[code] || code
  }

  const languages = [
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'fr', flag: '🇫🇷', name: 'Français' },
    { code: 'it', flag: '🇮🇹', name: 'Italiano' },
  ].filter((lang) => lang.code !== currentLanguage)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Languages className="h-4 w-4 mr-2" />
          Translate
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Translate Content</h4>
            <p className="text-sm text-muted-foreground">
              Current language: {getLanguageName(currentLanguage)}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Translate to:</label>
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
                Translating...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4 mr-2" />
                Translate
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
