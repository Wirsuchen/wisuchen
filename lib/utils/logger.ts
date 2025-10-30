/**
 * Logger utility for API operations
 * Provides structured logging with different levels and sanitization
 */

import { LOG_CONFIG } from '@/lib/config/api-keys'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

/**
 * Sanitizes sensitive data from logs
 */
function sanitizeData(data: any, sensitiveFields: string[]): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, sensitiveFields))
  }

  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    
    // Check if field is sensitive
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '***REDACTED***'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value, sensitiveFields)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Format log message with timestamp and context
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
}

/**
 * Logger class with structured logging
 */
class Logger {
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  }

  private shouldLog(level: LogLevel): boolean {
    const configLevel = LOG_CONFIG.level as LogLevel
    return this.levelPriority[level] >= this.levelPriority[configLevel]
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.shouldLog(level)) {
      return
    }

    // Sanitize sensitive data
    const sanitizedContext = context 
      ? sanitizeData(context, LOG_CONFIG.sensitiveFields)
      : undefined

    const formattedMessage = formatLog(level, message, sanitizedContext)

    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(formattedMessage)
        break
      case 'info':
        console.info(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'error':
        console.error(formattedMessage)
        break
    }

    // In production, you might want to send to external service
    if (LOG_CONFIG.enableErrorTracking && level === 'error') {
      // TODO: Send to Sentry, LogRocket, etc.
      // Sentry.captureException(new Error(message), { extra: sanitizedContext })
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context)
  }

  /**
   * Log API request
   */
  apiRequest(provider: string, endpoint: string, params?: any) {
    if (LOG_CONFIG.enableApiLogs) {
      this.debug('API Request', {
        provider,
        endpoint,
        params: sanitizeData(params, LOG_CONFIG.sensitiveFields)
      })
    }
  }

  /**
   * Log API response
   */
  apiResponse(provider: string, endpoint: string, duration: number, statusCode?: number) {
    if (LOG_CONFIG.enableApiLogs) {
      this.debug('API Response', {
        provider,
        endpoint,
        duration: `${duration}ms`,
        statusCode
      })
    }
  }

  /**
   * Log API error
   */
  apiError(provider: string, endpoint: string, error: any) {
    this.error('API Error', {
      provider,
      endpoint,
      error: error.message || String(error),
      statusCode: error.statusCode,
      isRetryable: error.isRetryable
    })
  }
}

// Export singleton instance
export const logger = new Logger()

/**
 * Performance measurement utility
 */
export class PerformanceTimer {
  private startTime: number

  constructor() {
    this.startTime = Date.now()
  }

  elapsed(): number {
    return Date.now() - this.startTime
  }

  log(message: string, context?: LogContext) {
    logger.info(message, {
      ...context,
      duration: `${this.elapsed()}ms`
    })
  }
}

/**
 * Decorator to automatically log method execution time
 */
export function LogPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = async function (...args: any[]) {
    const timer = new PerformanceTimer()
    const className = target.constructor.name
    
    logger.debug(`${className}.${propertyKey} started`)
    
    try {
      const result = await originalMethod.apply(this, args)
      logger.debug(`${className}.${propertyKey} completed`, {
        duration: `${timer.elapsed()}ms`
      })
      return result
    } catch (error) {
      logger.error(`${className}.${propertyKey} failed`, {
        duration: `${timer.elapsed()}ms`,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  return descriptor
}
