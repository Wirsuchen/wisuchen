// API Configuration - Centralized API key management
// IMPORTANT: Never commit actual API keys to version control
// Always use environment variables for sensitive credentials

/**
 * Feature flags to enable/disable API sources
 * Useful for testing or when API quotas are reached
 */
const env = (name: string): string | undefined => process.env[name]

const envBoolean = (name: string, defaultValue = true): boolean => {
  const value = env(name)
  if (value === undefined) return defaultValue
  return !['false', '0', 'off', 'no'].includes(value.toLowerCase())
}

const resolveAdzunaApiKey = () => env('ADZUNA_APP_KEY') || env('ADZUNA_API_KEY') || ''

const resolveRapidApiHost = () =>
  env('RAPIDAPI_HOST') || 'employment-agency-api.p.rapidapi.com'

export const API_FEATURES = {
  adzuna: envBoolean('ENABLE_ADZUNA'),
  rapidApi: envBoolean('ENABLE_RAPIDAPI'),
  awin: envBoolean('ENABLE_AWIN'),
  adcell: envBoolean('ENABLE_ADCELL'),
} as const

/**
 * Environment detection
 */
export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const

/**
 * Centralized API configuration
 * All credentials are loaded from environment variables
 */
export const API_CONFIG = {
  // Job APIs
  adzuna: {
    enabled: API_FEATURES.adzuna,
    appId: env('ADZUNA_APP_ID') || '',
    apiKey: resolveAdzunaApiKey(),
    baseUrl: 'https://api.adzuna.com/v1/api/jobs',
    timeout: 10000, // 10 seconds
  },
  
  rapidApi: {
    enabled: API_FEATURES.rapidApi,
    key: env('RAPIDAPI_KEY') || '',
    host: resolveRapidApiHost(),
    baseUrl: 'https://rapidapi.com',
    timeout: 15000, // 15 seconds
    endpoints: {
      employmentAgency: 'employment-agency-api.p.rapidapi.com',
      glassdoor: 'glassdoor-real-time-api.p.rapidapi.com',
      upwork: 'upwork-jobs-api.p.rapidapi.com',
      activeJobs: 'active-jobs-db-api.p.rapidapi.com',
      jobPostings: 'job-postings-api.p.rapidapi.com',
      yCombinator: 'free-y-combinator-jobs-api.p.rapidapi.com',
      freelancer: 'freelancer-api.p.rapidapi.com'
    }
  },

  // Affiliate APIs
  awin: {
    enabled: API_FEATURES.awin,
    oauthToken: env('AWIN_OAUTH_TOKEN') || '',
    baseUrl: 'https://api.awin.com/publishers',
    apiVersion: 'v1',
    timeout: 10000,
  },

  adcell: {
    enabled: API_FEATURES.adcell,
    login: env('ADCELL_LOGIN') || '',
    password: env('ADCELL_PASSWORD') || '',
    baseUrl: 'https://www.adcell.de/api/v2',
    timeout: 10000,
  },

  // Payment APIs
  paypal: {
    clientId: env('PAYPAL_CLIENT_ID') || '',
    clientSecret: env('PAYPAL_CLIENT_SECRET') || '',
    mode: (env('PAYPAL_MODE') || 'sandbox') as 'sandbox' | 'live',
    baseUrl: env('PAYPAL_MODE') === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com',
    timeout: 30000, // 30 seconds for payment operations
  }
} as const

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  jobs: {
    ttl: parseInt(env('CACHE_TTL_JOBS') || '3600', 10), // 1 hour default
    enabled: !ENV.isDevelopment, // Disable caching in development
  },
  affiliate: {
    ttl: parseInt(env('CACHE_TTL_AFFILIATE') || '7200', 10), // 2 hours default
    enabled: !ENV.isDevelopment,
  },
  statistics: {
    ttl: parseInt(env('CACHE_TTL_STATISTICS') || '86400', 10), // 24 hours default
    enabled: true,
  },
  redis: {
    url: env('REDIS_URL'),
    password: env('REDIS_PASSWORD'),
    enabled: !!env('REDIS_URL'),
  }
} as const

/**
 * Validation function to check if required API keys are present
 * Only validates enabled APIs
 */
export function validateApiKeys() {
  const missing: string[] = []
  const warnings: string[] = []
  
  // Only validate enabled APIs
  if (API_CONFIG.adzuna.enabled) {
    if (!API_CONFIG.adzuna.appId) missing.push('ADZUNA_APP_ID')
    if (!API_CONFIG.adzuna.apiKey) missing.push('ADZUNA_APP_KEY|ADZUNA_API_KEY')
  }
  
  if (API_CONFIG.rapidApi.enabled && !API_CONFIG.rapidApi.key) {
    missing.push('RAPIDAPI_KEY')
  }

  if (API_CONFIG.rapidApi.enabled && !env('RAPIDAPI_HOST')) {
    warnings.push('RAPIDAPI_HOST not set - default host used')
  }
  
  if (API_CONFIG.awin.enabled && !API_CONFIG.awin.oauthToken) {
    missing.push('AWIN_OAUTH_TOKEN')
  }
  
  if (API_CONFIG.adcell.enabled) {
    if (!API_CONFIG.adcell.login) missing.push('ADCELL_LOGIN')
    if (!API_CONFIG.adcell.password) missing.push('ADCELL_PASSWORD')
  }
  
  // PayPal is optional for some features
  if (!API_CONFIG.paypal.clientId) warnings.push('PAYPAL_CLIENT_ID (optional)')
  if (!API_CONFIG.paypal.clientSecret) warnings.push('PAYPAL_CLIENT_SECRET (optional)')
  
  // Production-specific validations
  if (ENV.isProduction) {
    if (API_CONFIG.paypal.mode !== 'live') {
      warnings.push('PayPal is in SANDBOX mode in production!')
    }
    if (!CACHE_CONFIG.redis.url) {
      warnings.push('Redis not configured - using in-memory cache (not recommended for production)')
    }
  }
  
  return {
    isValid: missing.length === 0,
    missingKeys: missing,
    warnings,
    summary: {
      total: missing.length + warnings.length,
      critical: missing.length,
      warnings: warnings.length
    }
  }
}

/**
 * Rate limiting configuration per API provider
 * Prevents hitting API quotas and getting blocked
 */
export const RATE_LIMITS = {
  adzuna: { 
    requestsPerMinute: 60, 
    requestsPerHour: 1000,
    requestsPerDay: 5000,
    burstLimit: 10, // max concurrent requests
  },
  rapidApi: { 
    requestsPerMinute: 100, 
    requestsPerHour: 5000,
    requestsPerDay: 10000,
    burstLimit: 20,
  },
  awin: { 
    requestsPerMinute: 60, 
    requestsPerHour: 2000,
    requestsPerDay: 5000,
    burstLimit: 10,
  },
  adcell: { 
    requestsPerMinute: 30, 
    requestsPerHour: 1000,
    requestsPerDay: 2000,
    burstLimit: 5,
  },
  paypal: { 
    requestsPerMinute: 300, 
    requestsPerHour: 10000,
    requestsPerDay: 50000,
    burstLimit: 50,
  }
} as const

/**
 * Retry configuration for failed API requests
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENETUNREACH']
} as const

/**
 * Logging configuration
 */
export const LOG_CONFIG = {
  level: env('LOG_LEVEL') || 'info',
  enableApiLogs: envBoolean('ENABLE_API_LOGS'),
  enableErrorTracking: ENV.isProduction,
  sensitiveFields: ['password', 'clientSecret', 'apiKey', 'token', 'authorization']
} as const

/**
 * Initialize and validate configuration on module load
 * Only in development, to avoid blocking production startup
 */
if (ENV.isDevelopment && typeof window === 'undefined') {
  const validation = validateApiKeys()
  if (!validation.isValid) {
    console.warn('⚠️  Missing API keys:', validation.missingKeys)
  }
  if (validation.warnings.length > 0) {
    console.info('ℹ️  Configuration warnings:', validation.warnings)
  }
}
