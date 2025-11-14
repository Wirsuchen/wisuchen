import { NextRequest, NextResponse } from 'next/server'
    import { streamContentGeneration, iterableToSSE } from '@/lib/services/ai/gemini'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/ai/generate-job-description
 * Generate or improve job descriptions using AI
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
    const {
      jobTitle,
      company,
      location,
      employmentType,
      requirements,
      benefits,
      existingDescription,
    } = body

    if (!jobTitle || !company) {
      return NextResponse.json(
        { error: 'Job title and company are required' },
        { status: 400 }
      )
    }

    const prompt = existingDescription
      ? `Improve and expand this job description.\n\nJob Title: ${jobTitle}\nCompany: ${company}\nLocation: ${location || 'Not specified'}\nType: ${employmentType || 'Full-time'}\n\nCurrent Description:\n${existingDescription}\n\nRequirements: ${(requirements || []).join(', ')}\nBenefits: ${(benefits || []).join(', ')}\n\nPlease rewrite this job description to be more compelling, professional, and SEO-friendly. Include clear sections for responsibilities, requirements, and benefits. Keep it between 300-500 words.`
      : `Create a professional job description for:\n\nJob Title: ${jobTitle}\nCompany: ${company}\nLocation: ${location || 'Not specified'}\nType: ${employmentType || 'Full-time'}\nRequirements: ${(requirements || []).join(', ')}\nBenefits: ${(benefits || []).join(', ')}\n\nCreate a compelling, professional, and SEO-friendly job description with clear sections for responsibilities, requirements, and benefits. Keep it between 300-500 words.`

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
    console.error('Error in generate-job-description API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
