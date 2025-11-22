import { NextRequest, NextResponse } from 'next/server'
import { streamContentGeneration, iterableToSSE } from '@/lib/services/ai/gemini'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/ai/generate-blog
 * Generate blog article content using AI
 */
export async function POST(request: NextRequest) {
  console.log('Received blog generation request')
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing')
      return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 })
    }

    const body = await request.json()
    const { topic, category, targetAudience, tone, keywords, language } = body

    console.log('Generating blog for:', { topic, category, language })

    if (!topic || !category) {
      return NextResponse.json(
        { error: 'Topic and category are required' },
        { status: 400 }
      )
    }

    const audienceMap: Record<string, string> = {
      job_seekers: 'job seekers looking for employment opportunities',
      employers: 'employers and recruiters looking to hire talent',
      general: 'general audience interested in job market trends',
    }
    const languageInstructions: Record<string, string> = {
      de: 'Write in German (Deutsch)',
      en: 'Write in English',
      fr: 'Write in French (Français)',
      it: 'Write in Italian (Italiano)',
    }

    const prompt = `Write a comprehensive blog article about: ${topic}\n\nCategory: ${category}\nTarget Audience: ${audienceMap[targetAudience || 'general']}\nTone: ${tone || 'professional'}\nKeywords to include: ${(keywords || []).join(', ')}\nLanguage: ${languageInstructions[language || 'en']}\n\nCreate an engaging, well-structured article with:\n1. Compelling headline\n2. Introduction (hook the reader)\n3. 3-5 main sections with subheadings (H2)\n4. Practical tips or actionable advice\n5. Conclusion with call-to-action\n\nLength: 800-1200 words\nMake it SEO-friendly, informative, and valuable to the reader.`

    const stream = await streamContentGeneration(prompt)
    const sse = iterableToSSE(stream)
    
    console.log('Stream started successfully')
    
    return new Response(sse, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Error in generate-blog API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
