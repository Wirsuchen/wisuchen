/**
 * Custom API Error Classes
 * Provides typed errors for better error handling and debugging
 */

export class APIError extends Error {
  public statusCode: number
  public provider: string
  public endpoint: string
  public isRetryable: boolean
  public originalError?: any

  constructor(
    message: string,
    statusCode: number,
    provider: string,
    endpoint: string,
    isRetryable = false,
    originalError?: any
  ) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.provider = provider
    this.endpoint = endpoint
    this.isRetryable = isRetryable
    this.originalError = originalError
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      provider: this.provider,
      endpoint: this.endpoint,
      isRetryable: this.isRetryable,
    }
  }
}

export class RateLimitError extends APIError {
  public retryAfter?: number

  constructor(
    provider: string,
    endpoint: string,
    retryAfter?: number
  ) {
    super(
      `Rate limit exceeded for ${provider}`,
      429,
      provider,
      endpoint,
      true
    )
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

export class AuthenticationError extends APIError {
  constructor(provider: string, endpoint: string) {
    super(
      `Authentication failed for ${provider}`,
      401,
      provider,
      endpoint,
      false
    )
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends APIError {
  public validationErrors: Record<string, string[]>

  constructor(
    provider: string,
    endpoint: string,
    validationErrors: Record<string, string[]>
  ) {
    super(
      'Validation failed',
      400,
      provider,
      endpoint,
      false
    )
    this.name = 'ValidationError'
    this.validationErrors = validationErrors
  }
}

export class TimeoutError extends APIError {
  constructor(provider: string, endpoint: string, timeout: number) {
    super(
      `Request timeout after ${timeout}ms`,
      408,
      provider,
      endpoint,
      true
    )
    this.name = 'TimeoutError'
  }
}

export class NetworkError extends APIError {
  constructor(provider: string, endpoint: string, originalError: any) {
    super(
      'Network error occurred',
      0,
      provider,
      endpoint,
      true,
      originalError
    )
    this.name = 'NetworkError'
  }
}

/**
 * Determines if an error is retryable based on status code or error type
 */
export function isRetryableError(error: any): boolean {
  if (error instanceof APIError) {
    return error.isRetryable
  }

  // Network errors are retryable
  if (error.code && ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENETUNREACH'].includes(error.code)) {
    return true
  }

  // HTTP status codes that are retryable
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504]
  if (error.statusCode && retryableStatusCodes.includes(error.statusCode)) {
    return true
  }

  return false
}

/**
 * Converts various error types to APIError
 */
export function normalizeError(
  error: any,
  provider: string,
  endpoint: string
): APIError {
  // Already an APIError
  if (error instanceof APIError) {
    return error
  }

  // Fetch/Axios response error
  if (error.response) {
    const status = error.response.status
    const message = error.response.data?.message || error.message || 'API request failed'
    
    if (status === 429) {
      return new RateLimitError(provider, endpoint, error.response.headers?.['retry-after'])
    }
    
    if (status === 401 || status === 403) {
      return new AuthenticationError(provider, endpoint)
    }

    return new APIError(
      message,
      status,
      provider,
      endpoint,
      isRetryableError({ statusCode: status }),
      error
    )
  }

  // Network/Timeout errors
  if (error.code) {
    if (error.code === 'ETIMEDOUT') {
      return new TimeoutError(provider, endpoint, 0)
    }
    return new NetworkError(provider, endpoint, error)
  }

  // Generic error
  return new APIError(
    error.message || 'Unknown error occurred',
    500,
    provider,
    endpoint,
    false,
    error
  )
}

/**
 * Safe error serialization for logging
 * Removes sensitive information
 */
export function sanitizeErrorForLogging(error: APIError | Error): Record<string, any> {
  const sanitized: Record<string, any> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  }

  if (error instanceof APIError) {
    sanitized.statusCode = error.statusCode
    sanitized.provider = error.provider
    sanitized.endpoint = error.endpoint
    sanitized.isRetryable = error.isRetryable
  }

  return sanitized
}
