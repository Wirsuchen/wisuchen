import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/profile/settings - Get user account settings
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('language, timezone, email_notifications, marketing_emails, job_alerts, deal_alerts')
      .eq('user_id', user.id)
      .single()

    if (error || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    
    return NextResponse.json({ 
      settings: {
        language: profile.language || 'en',
        timezone: profile.timezone || 'Europe/Berlin',
        emailNotifications: profile.email_notifications ?? true,
        marketingEmails: profile.marketing_emails ?? false,
        jobAlerts: profile.job_alerts ?? true,
        dealAlerts: profile.deal_alerts ?? true,
      }
    })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/profile/settings - Update user account settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const allowed = {
      language: body.language,
      timezone: body.timezone,
      email_notifications: body.emailNotifications,
      marketing_emails: body.marketingEmails,
      job_alerts: body.jobAlerts,
      deal_alerts: body.dealAlerts,
    }

    // Remove undefined values
    Object.keys(allowed).forEach(key => {
      if ((allowed as any)[key] === undefined) {
        delete (allowed as any)[key]
      }
    })

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { error: updateError } = await supabase
      .from('profiles')
      .update(allowed)
      .eq('id', profile.id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
