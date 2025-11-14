import { NextRequest, NextResponse } from 'next/server'
import { streamContentGeneration } from '@/lib/services/ai/gemini'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if user has a paid plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_subscribed, plan')
      .eq('user_id', user.id)
      .single()

    // If profile doesn't exist or query failed, treat as free user
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'AI features are available for Professional and Business plan subscribers. Please upgrade to access this feature.' },
        { status: 403 }
      )
    }

    type ProfileRow = {
      is_subscribed?: boolean | null
      plan?: string | null
    }

    const typedProfile = profile as ProfileRow
    // Check for paid plans: 'pro', 'professional', or 'business' (covers legacy and new values)
    const isPaidUser = !!(typedProfile.is_subscribed || ['pro', 'professional', 'business'].includes(typedProfile.plan || ''))
    
    if (!isPaidUser) {
      return NextResponse.json(
        { error: 'AI features are available for Professional and Business plan subscribers. Please upgrade to access this feature.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, company, location, employmentType, perks } = body || {}

    const prompt = `Generate a compelling list of employee benefits & perks as markdown dash bullets only (no heading). 8-12 bullets.
Title: ${title || ''}
Company: ${company || ''}
Location: ${location || ''}
Type: ${employmentType || ''}
Known perks: ${(perks || []).join(', ')}
Constraints:
- Only output lines starting with "- "
- Mix tangible (compensation, insurance) and intangible (growth, flexibility)
- Keep each bullet under 120 characters`

    const iterable = await streamContentGeneration(prompt)
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of iterable as any) {
            const text = (chunk?.text ?? '') as string
            if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
          controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'))
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
