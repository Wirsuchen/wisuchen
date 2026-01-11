import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/translate
 * Simple translation endpoint for UI strings
 * Returns the original texts if translation service is not available
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { texts, toLanguage, fromLanguage, title, description, contentType } = body

    // Handle batch translation request (from i18n context)
    if (texts && Array.isArray(texts)) {
      // For now, return empty translations to prevent errors
      // The static locale files should have all UI translations
      return NextResponse.json({
        success: true,
        translations: texts, // Return original texts as fallback
        message: 'Using static translations from locale files'
      })
    }

    // Handle single item translation (job/deal/blog content)
    if (title || description) {
      return NextResponse.json({
        success: true,
        title: title || '',
        description: description || '',
        message: 'Translations should be fetched from database'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request format'
    }, { status: 400 })
  } catch (error: any) {
    console.error('Error in translate API:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Translation failed'
    }, { status: 500 })
  }
}

