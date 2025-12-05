import { NextRequest, NextResponse } from 'next/server'
import { translateText, translateBatch, SupportedLanguage } from '@/lib/services/google-translate'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, texts, toLanguage, fromLanguage, contentType = 'general' } = body

    // Validate target language
    const validLanguages: SupportedLanguage[] = ['en', 'de', 'fr', 'it']
    if (!toLanguage || !validLanguages.includes(toLanguage)) {
      return NextResponse.json(
        { error: 'Valid toLanguage is required (en, de, fr, it)' },
        { status: 400 }
      )
    }

    // Handle batch translation
    if (texts && Array.isArray(texts)) {
      const result = await translateBatch(
        texts,
        toLanguage as SupportedLanguage,
        fromLanguage as SupportedLanguage | undefined
      )

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      return NextResponse.json({ translations: result.translations })
    }

    // Handle single text translation
    if (!content) {
      return NextResponse.json(
        { error: 'Content or texts array is required' },
        { status: 400 }
      )
    }

    const result = await translateText(
      content,
      toLanguage as SupportedLanguage,
      fromLanguage as SupportedLanguage | undefined
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ 
      translation: result.translation,
      fromCache: result.fromCache 
    })
  } catch (error: any) {
    console.error('Error in translate API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
