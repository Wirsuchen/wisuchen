import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If environment variables are missing, bypass session handling gracefully
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login ONLY for protected areas
  const pathname = request.nextUrl.pathname
  const PROTECTED_PREFIXES = ['/dashboard', '/account', '/profile', '/settings', '/admin', '/app']
  const requiresAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login'

  // Redirect unauthenticated users
  if (!user && requiresAuth) {
    const url = request.nextUrl.clone()
    // Admin routes redirect to admin login, others to regular login
    url.pathname = isAdminRoute ? '/admin/login' : '/login'
    return NextResponse.redirect(url)
  }

  // For admin routes, check if user has admin role
  if (user && isAdminRoute) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      const ADMIN_ROLES = ['supervisor', 'admin', 'moderator']
      
      // If user doesn't have admin role, redirect to home
      if (!profile || !ADMIN_ROLES.includes(profile.role)) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // If error checking profile, redirect to admin login
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}
