import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

// Simple token-bucket rate limiting per IP for API routes
const RATE_LIMIT = 100 // requests
const WINDOW_MS = 60_000 // 1 minute
const ipBuckets = new Map<string, { tokens: number; resetAt: number }>()

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Rate limit only API routes
  if (pathname.startsWith('/api/')) {
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1').split(',')[0].trim()
    const now = Date.now()
    const bucket = ipBuckets.get(ip) || { tokens: RATE_LIMIT, resetAt: now + WINDOW_MS }

    // Reset window
    if (now > bucket.resetAt) {
      bucket.tokens = RATE_LIMIT
      bucket.resetAt = now + WINDOW_MS
    }

    if (bucket.tokens <= 0) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil((bucket.resetAt - now) / 1000)) },
      })
    }

    bucket.tokens -= 1
    ipBuckets.set(ip, bucket)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
