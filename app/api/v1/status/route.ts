/**
 * API Route: System Status
 * GET /api/v1/status
 * 
 * Returns system health, API status, cache stats, and rate limits
 */

import { NextResponse } from 'next/server'
import { validateApiKeys, API_CONFIG } from '@/lib/config/api-keys'
import { cache } from '@/lib/utils/cache'
import { rateLimiter } from '@/lib/utils/rate-limiter'

export async function GET() {
  try {
    const validation = validateApiKeys()
    const cacheStats = cache.getStats()
    const rateLimitStats = rateLimiter.getAllStatus()

    return NextResponse.json({
      success: true,
      data: {
        status: 'operational',
        timestamp: new Date().toISOString(),
        
        // API Configuration
        apis: {
          adzuna: {
            enabled: API_CONFIG.adzuna.enabled,
            configured: !!API_CONFIG.adzuna.apiKey
          },
          rapidApi: {
            enabled: API_CONFIG.rapidApi.enabled,
            configured: !!API_CONFIG.rapidApi.key
          },
          adcell: {
            enabled: API_CONFIG.adcell.enabled,
            configured: !!API_CONFIG.adcell.login && !!API_CONFIG.adcell.password
          },
          awin: {
            enabled: API_CONFIG.awin.enabled,
            configured: !!API_CONFIG.awin.oauthToken
          },
          paypal: {
            configured: !!API_CONFIG.paypal.clientId && !!API_CONFIG.paypal.clientSecret,
            mode: API_CONFIG.paypal.mode
          }
        },

        // Configuration Validation
        validation: {
          isValid: validation.isValid,
          missingKeys: validation.missingKeys,
          warnings: validation.warnings
        },

        // Cache Statistics
        cache: cacheStats,

        // Rate Limiting Status
        rateLimits: rateLimitStats,

        // Environment
        environment: process.env.NODE_ENV || 'unknown',
        
        version: '1.0.0'
      }
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to retrieve status'
    }, { status: 500 })
  }
}
