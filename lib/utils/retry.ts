/**
 * Retry utility with exponential backoff
 * Automatically retries failed API requests with configurable delays
 */

import { RETRY_CONFIG } from '@/lib/config/api-keys'
import { isRetryableError, normalizeError, APIError } from './api-error'
import { logger } from './logger'

export interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  onRetry?: (attempt: number, error: any) => void
}

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt - 1)
  const delay = Math.min(exponentialDelay, maxDelay)
  
  // Add jitter (±20%) to prevent thundering herd
  const jitter = delay * 0.2 * (Math.random() * 2 - 1)
  
  return Math.floor(delay + jitter)
}

/**
 * Retry a function with exponential backoff
 * 
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => fetchFromAPI(),
 *   { maxRetries: 3, initialDelayMs: 1000 }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  provider = 'unknown',
  endpoint = 'unknown'
): Promise<T> {
  const {
    maxRetries = RETRY_CONFIG.maxRetries,
    initialDelayMs = RETRY_CONFIG.initialDelayMs,
    maxDelayMs = RETRY_CONFIG.maxDelayMs,
    backoffMultiplier = RETRY_CONFIG.backoffMultiplier,
    onRetry
  } = options

  let lastError: any

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Normalize error
      const apiError = normalizeError(error, provider, endpoint)

      // Don't retry if not retryable or last attempt
      if (!isRetryableError(apiError) || attempt > maxRetries) {
        logger.error('Request failed (not retrying)', {
          provider,
          endpoint,
          attempt,
          error: apiError.message,
          isRetryable: apiError.isRetryable
        })
        throw apiError
      }

      // Calculate delay
      const delay = calculateDelay(attempt, initialDelayMs, maxDelayMs, backoffMultiplier)

      logger.warn('Request failed, retrying...', {
        provider,
        endpoint,
        attempt,
        maxRetries,
        delayMs: delay,
        error: apiError.message
      })

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, apiError)
      }

      // Wait before retry
      await sleep(delay)
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError
}

/**
 * Decorator for class methods to add retry logic
 * 
 * @example
 * ```typescript
 * class API {
 *   @Retryable({ maxRetries: 3 })
 *   async fetchData() {
 *     // ...
 *   }
 * }
 * ```
 */
export function Retryable(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return withRetry(
        () => originalMethod.apply(this, args),
        options,
        target.constructor.name,
        propertyKey
      )
    }

    return descriptor
  }
}

/**
 * Circuit breaker pattern for API calls
 * Prevents cascading failures by temporarily disabling failed services
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private readonly threshold = 5,
    private readonly timeout = 60000, // 1 minute
    private readonly resetTimeout = 30000 // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    if (this.state === 'open' && Date.now() - this.lastFailureTime > this.resetTimeout) {
      this.state = 'half-open'
      this.failures = 0
    }

    // Fail fast if circuit is open
    if (this.state === 'open') {
      throw new Error('Circuit breaker is OPEN')
    }

    try {
      const result = await fn()
      
      // Success - reset if half-open
      if (this.state === 'half-open') {
        this.state = 'closed'
        this.failures = 0
      }
      
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()

      // Open circuit if threshold reached
      if (this.failures >= this.threshold) {
        this.state = 'open'
        logger.error('Circuit breaker opened', {
          failures: this.failures,
          threshold: this.threshold
        })
      }

      throw error
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }

  reset() {
    this.state = 'closed'
    this.failures = 0
    this.lastFailureTime = 0
  }
}
