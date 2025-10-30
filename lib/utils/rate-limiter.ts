/**
 * Rate Limiter utility
 * Implements token bucket algorithm to prevent API quota exhaustion
 */

import { RATE_LIMITS } from '@/lib/config/api-keys'
import { RateLimitError } from './api-error'
import { logger } from './logger'

interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour?: number
  requestsPerDay?: number
  burstLimit?: number
}

interface TokenBucket {
  tokens: number
  lastRefill: number
  queue: Array<{
    resolve: () => void
    reject: (error: Error) => void
    timestamp: number
  }>
}

/**
 * Token Bucket Rate Limiter
 * Allows burst traffic while maintaining average rate
 */
class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map()
  private stats: Map<string, { total: number, limited: number }> = new Map()

  constructor(private readonly configs: Record<string, RateLimitConfig>) {}

  /**
   * Get or create bucket for provider
   */
  private getBucket(provider: string): TokenBucket {
    if (!this.buckets.has(provider)) {
      const config = this.configs[provider]
      if (!config) {
        throw new Error(`No rate limit config for provider: ${provider}`)
      }

      this.buckets.set(provider, {
        tokens: config.burstLimit || config.requestsPerMinute,
        lastRefill: Date.now(),
        queue: []
      })
    }

    return this.buckets.get(provider)!
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(provider: string, bucket: TokenBucket) {
    const config = this.configs[provider]
    if (!config) return

    const now = Date.now()
    const elapsedMs = now - bucket.lastRefill
    const elapsedMinutes = elapsedMs / 60000

    // Calculate tokens to add
    const tokensToAdd = elapsedMinutes * config.requestsPerMinute
    const maxTokens = config.burstLimit || config.requestsPerMinute

    bucket.tokens = Math.min(bucket.tokens + tokensToAdd, maxTokens)
    bucket.lastRefill = now
  }

  /**
   * Process queued requests
   */
  private processQueue(provider: string, bucket: TokenBucket) {
    while (bucket.queue.length > 0 && bucket.tokens >= 1) {
      const request = bucket.queue.shift()!
      
      // Check if request hasn't timed out (30 second timeout)
      if (Date.now() - request.timestamp > 30000) {
        request.reject(new Error('Request timed out in rate limit queue'))
        continue
      }

      bucket.tokens -= 1
      request.resolve()
    }
  }

  /**
   * Acquire permission to make an API request
   * Returns a promise that resolves when request can proceed
   */
  async acquire(provider: string, endpoint: string): Promise<void> {
    const config = this.configs[provider]
    if (!config) {
      // No rate limiting configured for this provider
      return
    }

    const bucket = this.getBucket(provider)
    this.refillTokens(provider, bucket)

    // Update stats
    if (!this.stats.has(provider)) {
      this.stats.set(provider, { total: 0, limited: 0 })
    }
    const stats = this.stats.get(provider)!
    stats.total++

    // If tokens available, proceed immediately
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      this.processQueue(provider, bucket)
      return
    }

    // No tokens available - queue the request
    stats.limited++
    
    logger.warn('Rate limit reached, queueing request', {
      provider,
      endpoint,
      queueLength: bucket.queue.length,
      tokensAvailable: bucket.tokens
    })

    return new Promise((resolve, reject) => {
      bucket.queue.push({
        resolve,
        reject,
        timestamp: Date.now()
      })

      // If queue is too long, reject immediately
      if (bucket.queue.length > 100) {
        bucket.queue.shift()
        reject(new RateLimitError(provider, endpoint))
      }
    })
  }

  /**
   * Check if request would be rate limited without consuming tokens
   */
  wouldLimit(provider: string): boolean {
    const config = this.configs[provider]
    if (!config) return false

    const bucket = this.getBucket(provider)
    this.refillTokens(provider, bucket)

    return bucket.tokens < 1
  }

  /**
   * Get current rate limit status
   */
  getStatus(provider: string) {
    const bucket = this.buckets.get(provider)
    const stats = this.stats.get(provider)
    const config = this.configs[provider]

    if (!bucket || !config) {
      return null
    }

    this.refillTokens(provider, bucket)

    return {
      provider,
      tokensAvailable: Math.floor(bucket.tokens),
      maxTokens: config.burstLimit || config.requestsPerMinute,
      queueLength: bucket.queue.length,
      stats: stats || { total: 0, limited: 0 },
      limitRate: stats ? (stats.limited / stats.total * 100).toFixed(2) + '%' : '0%'
    }
  }

  /**
   * Get status for all providers
   */
  getAllStatus() {
    const providers = Object.keys(this.configs)
    return providers.map(provider => this.getStatus(provider)).filter(Boolean)
  }

  /**
   * Reset rate limiter for a provider
   */
  reset(provider: string) {
    this.buckets.delete(provider)
    this.stats.delete(provider)
  }

  /**
   * Reset all rate limiters
   */
  resetAll() {
    this.buckets.clear()
    this.stats.clear()
  }
}

/**
 * Global rate limiter instance
 */
export const rateLimiter = new RateLimiter({
  adzuna: RATE_LIMITS.adzuna,
  rapidApi: RATE_LIMITS.rapidApi,
  awin: RATE_LIMITS.awin,
  adcell: RATE_LIMITS.adcell,
  paypal: RATE_LIMITS.paypal
})

/**
 * Decorator to add rate limiting to class methods
 * 
 * @example
 * ```typescript
 * class API {
 *   @RateLimited('adzuna')
 *   async fetchJobs() {
 *     // ...
 *   }
 * }
 * ```
 */
export function RateLimited(provider: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      await rateLimiter.acquire(provider, propertyKey)
      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

/**
 * Middleware for Next.js API routes (Next.js 15 App Router compatible)
 * Usage: export const GET = withRateLimit(handler, { max: 100, windowMs: 60000 })
 */
export function withRateLimit(
  handler: any,
  options: { max: number; windowMs: number } = { max: 100, windowMs: 60000 }
) {
  const requests = new Map<string, number[]>()

  return async (req: any, res?: any) => {
    // Next.js 15 App Router uses Request object
    const isAppRouter = req instanceof Request
    
    // Get client identifier (IP or user ID)
    let identifier = 'anonymous'
    
    if (isAppRouter) {
      // Next.js 15 App Router
      const forwarded = req.headers.get('x-forwarded-for')
      const realIp = req.headers.get('x-real-ip')
      identifier = forwarded || realIp || 'anonymous'
    } else {
      // Legacy Pages Router
      identifier = req.headers['x-forwarded-for'] || 
                   req.socket?.remoteAddress || 
                   'anonymous'
    }

    const now = Date.now()
    const windowStart = now - options.windowMs

    // Get or initialize request timestamps for this client
    const clientRequests = requests.get(identifier) || []
    
    // Filter out old requests outside the window
    const recentRequests = clientRequests.filter(timestamp => timestamp > windowStart)

    // Check if limit exceeded
    if (recentRequests.length >= options.max) {
      logger.warn('API route rate limit exceeded', {
        identifier,
        path: isAppRouter ? new URL(req.url).pathname : req.url,
        count: recentRequests.length,
        limit: options.max
      })

      if (isAppRouter) {
        // Next.js 15 App Router - return Response
        return new Response(
          JSON.stringify({
            error: 'Too many requests',
            retryAfter: Math.ceil((recentRequests[0] - windowStart) / 1000)
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      } else {
        // Legacy Pages Router
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((recentRequests[0] - windowStart) / 1000)
        })
      }
    }

    // Add current request
    recentRequests.push(now)
    requests.set(identifier, recentRequests)

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [key, timestamps] of requests.entries()) {
        const filtered = timestamps.filter(t => t > windowStart)
        if (filtered.length === 0) {
          requests.delete(key)
        } else {
          requests.set(key, filtered)
        }
      }
    }

    return handler(req, res)
  }
}
