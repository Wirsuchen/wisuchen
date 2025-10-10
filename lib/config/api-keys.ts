// API Configuration - Centralized API key management
// IMPORTANT: Never commit actual API keys to version control

export const API_CONFIG = {
  // Job APIs
  adzuna: {
    appId: process.env.ADZUNA_APP_ID || 'aac666ff',
    apiKey: process.env.ADZUNA_API_KEY || '',
    baseUrl: 'https://api.adzuna.com/v1/api/jobs'
  },
  
  rapidApi: {
    key: process.env.RAPIDAPI_KEY || '',
    baseUrl: 'https://rapidapi.com',
    endpoints: {
      employmentAgency: 'employment-agency-api',
      glassdoor: 'glassdoor-real-time-api',
      upwork: 'upwork-jobs-api',
      activeJobs: 'active-jobs-db-api',
      jobPostings: 'job-postings-api',
      yCombinator: 'free-y-combinator-jobs-api',
      freelancer: 'freelancer-api'
    }
  },

  // Affiliate APIs
  awin: {
    oauthToken: process.env.AWIN_OAUTH_TOKEN || '',
    baseUrl: 'https://api.awin.com/publishers',
    apiVersion: 'v1'
  },

  adcell: {
    login: process.env.ADCELL_LOGIN || '',
    password: process.env.ADCELL_PASSWORD || '',
    baseUrl: 'https://www.adcell.de/api/v2'
  },

  // Payment APIs
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    mode: process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' or 'live'
    baseUrl: process.env.PAYPAL_MODE === 'live' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com'
  }
} as const

// Validation function to check if required API keys are present
export function validateApiKeys() {
  const missing: string[] = []
  
  if (!API_CONFIG.adzuna.apiKey) missing.push('ADZUNA_API_KEY')
  if (!API_CONFIG.rapidApi.key) missing.push('RAPIDAPI_KEY')
  if (!API_CONFIG.awin.oauthToken) missing.push('AWIN_OAUTH_TOKEN')
  if (!API_CONFIG.adcell.login) missing.push('ADCELL_LOGIN')
  if (!API_CONFIG.adcell.password) missing.push('ADCELL_PASSWORD')
  if (!API_CONFIG.paypal.clientId) missing.push('PAYPAL_CLIENT_ID')
  if (!API_CONFIG.paypal.clientSecret) missing.push('PAYPAL_CLIENT_SECRET')
  
  return {
    isValid: missing.length === 0,
    missingKeys: missing
  }
}

// Rate limiting configuration
export const RATE_LIMITS = {
  adzuna: { requestsPerMinute: 60, requestsPerDay: 1000 },
  rapidApi: { requestsPerMinute: 100, requestsPerDay: 10000 },
  awin: { requestsPerMinute: 60, requestsPerDay: 5000 },
  adcell: { requestsPerMinute: 30, requestsPerDay: 1000 },
  paypal: { requestsPerMinute: 300, requestsPerDay: 50000 }
} as const
