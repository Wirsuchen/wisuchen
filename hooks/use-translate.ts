import { useState, useCallback } from 'react'
import { useI18n } from '@/contexts/i18n-context'
import { useToast } from '@/hooks/use-toast'

type ContentType = 'job_description' | 'blog_article' | 'general'

interface TranslateOptions {
  contentType?: ContentType
  showToast?: boolean
}

export function useTranslate() {
  const [loading, setLoading] = useState(false)
  const { locale, t } = useI18n()
  const { toast } = useToast()

  /**
   * Translate a single text
   */
  const translate = useCallback(async (
    text: string, 
    options: TranslateOptions = {}
  ): Promise<string> => {
    const { contentType = 'general', showToast = false } = options

    if (!text) return text
    if (locale === 'en') return text // Source language

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
        if (showToast) {
          toast({
            title: t('common.success'),
            description: t('common.translationSuccess'),
          })
        }
        return data.translation
      } else {
        throw new Error(data.error || 'Translation failed')
      }
    } catch (error) {
      console.error('Translation error:', error)
      if (showToast) {
        toast({
          title: t('common.error'),
          description: t('common.translationError'),
          variant: 'destructive',
        })
      }
      throw error
    } finally {
      setLoading(false)
    }
  }, [locale, t, toast])

  /**
   * Translate multiple texts in batch (more efficient)
   */
  const translateBatch = useCallback(async (
    texts: string[],
    options: { showToast?: boolean } = {}
  ): Promise<string[]> => {
    const { showToast = false } = options

    if (!texts || texts.length === 0) return []
    if (locale === 'en') return texts // Source language

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
        if (showToast) {
          toast({
            title: t('common.success'),
            description: t('common.batchTranslationSuccess') || `Translated ${texts.length} items`,
          })
        }
        return data.translations
      } else {
        throw new Error(data.error || 'Batch translation failed')
      }
    } catch (error) {
      console.error('Batch translation error:', error)
      if (showToast) {
        toast({
          title: t('common.error'),
          description: t('common.translationError'),
          variant: 'destructive',
        })
      }
      throw error
    } finally {
      setLoading(false)
    }
  }, [locale, t, toast])

  /**
   * Translate job title and description
   */
  const translateJob = useCallback(async (job: {
    title: string
    description?: string
    [key: string]: any
  }): Promise<{
    title: string
    description?: string
    [key: string]: any
  }> => {
    if (locale === 'en') return job

    const textsToTranslate = [job.title]
    if (job.description) {
      textsToTranslate.push(job.description)
    }

    try {
      const translations = await translateBatch(textsToTranslate)
      return {
        ...job,
        title: translations[0] || job.title,
        description: job.description ? (translations[1] || job.description) : undefined,
      }
    } catch {
      return job
    }
  }, [locale, translateBatch])

  /**
   * Translate multiple jobs
   */
  const translateJobs = useCallback(async (jobs: Array<{
    title: string
    description?: string
    [key: string]: any
  }>): Promise<Array<{
    title: string
    description?: string
    [key: string]: any
  }>> => {
    if (locale === 'en' || jobs.length === 0) return jobs

    // Collect all texts
    const textsToTranslate: string[] = []
    const mapping: { jobIndex: number; field: 'title' | 'description' }[] = []

    jobs.forEach((job, jobIndex) => {
      textsToTranslate.push(job.title)
      mapping.push({ jobIndex, field: 'title' })
      
      if (job.description) {
        textsToTranslate.push(job.description)
        mapping.push({ jobIndex, field: 'description' })
      }
    })

    try {
      const translations = await translateBatch(textsToTranslate)
      const translatedJobs = jobs.map(job => ({ ...job }))

      translations.forEach((translation, i) => {
        const { jobIndex, field } = mapping[i]
        translatedJobs[jobIndex][field] = translation
      })

      return translatedJobs
    } catch {
      return jobs
    }
  }, [locale, translateBatch])

  return { 
    translate, 
    translateBatch,
    translateJob,
    translateJobs,
    loading,
    currentLocale: locale 
  }
}
