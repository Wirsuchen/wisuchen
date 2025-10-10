import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if profile exists, create if not
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', data.user.id)
        .single()

      if (!profile) {
        // Create profile for OAuth users
        await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
            avatar_url: data.user.user_metadata?.avatar_url || null,
            role: 'job_seeker', // default role
          })
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
