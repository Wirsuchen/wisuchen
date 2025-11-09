import { NextRequest, NextResponse } from 'next/server'
import { streamContentGeneration, iterableToSSE } from '@/lib/services/ai/gemini'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/ai/translate
 * Translate content between languages using AI
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, fromLanguage, toLanguage, contentType } = body

    if (!content || !fromLanguage || !toLanguage) {
      return NextResponse.json(
        { error: 'Content, fromLanguage, and toLanguage are required' },
        { status: 400 }
      )
    }

    const validLanguages = ['de', 'en', 'fr', 'it']
    if (!validLanguages.includes(fromLanguage) || !validLanguages.includes(toLanguage)) {
      return NextResponse.json(
        { error: 'Invalid language code. Supported: de, en, fr, it' },
        { status: 400 }
      )
    }

    const languageNames: Record<string, string> = { de: 'German', en: 'English', fr: 'French', it: 'Italian' }
    const prompt = `Translate this ${String(contentType || 'general').replace('_', ' ')} from ${languageNames[fromLanguage]} to ${languageNames[toLanguage]}:\n\n${content}\n\nMaintain the tone, formatting, and professional style. Ensure all industry-specific terms are accurately translated.`

    const stream = await streamContentGeneration(prompt)
    const sse = iterableToSSE(stream)
    return new Response(sse, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Error in translate API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
