import { useState } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { useToast } from '@/hooks/use-toast'

export function useTranslate() {
  const [loading, setLoading] = useState(false)
  const { locale } = useI18n()
  const { toast } = useToast()

  const translate = async (text: string, contentType: 'job_description' | 'blog_article' | 'general' = 'general') => {
    if (!text) return text

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text,
          toLanguage: locale,
          fromLanguage: 'en', // Assuming source is English
          contentType
        }),
      })

      const data = await response.json()

      if (response.ok && data.translation) {
        return data.translation
      } else {
        throw new Error(data.error || 'Translation failed')
      }
    } catch (error) {
      console.error('Translation error:', error)
      throw error
    }
  }

  return { translate }
}
