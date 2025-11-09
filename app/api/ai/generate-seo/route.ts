import { NextRequest, NextResponse } from 'next/server'
import { streamContentGeneration } from '@/lib/services/ai/gemini'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/ai/generate-seo
 * Generate SEO meta descriptions and keywords using AI
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
    const { title, content, type, maxLength, maxKeywords, industry } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const metaPrompt = `Generate an SEO-optimized meta description under ${maxLength || 160} characters for this page.\n\nTitle: ${title}\nIndustry: ${industry || 'General'}\nContent: ${content.substring(0, 800)}...\n\nReturn only the description text, no quotes.`
    const keywordsPrompt = `Extract up to ${maxKeywords || 10} relevant SEO keywords and long-tail phrases from this page. Return them as a comma-separated list.\n\nTitle: ${title}\nIndustry: ${industry || 'General'}\nContent: ${content.substring(0, 800)}...`

    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // Helper to forward chunks with event type
          const forward = async (iterable: AsyncIterable<any>, event: 'meta' | 'keywords') => {
            for await (const chunk of iterable as any) {
              const text = (chunk?.text ?? '') as string
              if (text && text.length) {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify({ text })}\n\n`))
              }
            }
          }

          if (type === 'meta' || type === 'both') {
            const metaIterable = await streamContentGeneration(metaPrompt)
            await forward(metaIterable, 'meta')
          }

          if (type === 'keywords' || type === 'both') {
            const kwIterable = await streamContentGeneration(keywordsPrompt)
            await forward(kwIterable, 'keywords')
          }

          controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'))
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Error in generate-seo API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
