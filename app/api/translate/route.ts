import { NextRequest, NextResponse } from 'next/server'
import { translateContent } from '@/lib/services/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, toLanguage, contentType = 'general' } = body

    if (!content || !toLanguage) {
      return NextResponse.json(
        { error: 'Content and toLanguage are required' },
        { status: 400 }
      )
    }

    // Default fromLanguage to 'en' if not specified, or maybe auto-detect?
    // The translateContent function requires fromLanguage.
    // For now, let's assume 'en' as source or pass it from client.
    // Actually, let's assume 'en' if not provided, or maybe 'de' since it's WIRsuchen?
    // Let's require it or default to 'en'.
    const fromLanguage = body.fromLanguage || 'en'

    const result = await translateContent({
      content,
      fromLanguage,
      toLanguage,
      contentType,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ translation: result.translation })
  } catch (error: any) {
    console.error('Error in translate API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
