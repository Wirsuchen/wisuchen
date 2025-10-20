import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Health Check API
 * 
 * GET /api/health
 * 
 * Returns status of all services and configurations
 * Useful for debugging and monitoring
 */
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {} as Record<string, any>
  }

  try {
    // Check environment variables
    checks.services.environment = {
      status: 'checking',
      details: {}
    }

    const requiredEnvVars = {
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
      'ADZUNA_APP_ID': process.env.ADZUNA_APP_ID ? '✓ Set' : '✗ Missing',
      'ADZUNA_API_KEY': process.env.ADZUNA_API_KEY ? '✓ Set' : '✗ Missing',
      'RAPIDAPI_KEY': process.env.RAPIDAPI_KEY ? '✓ Set' : '✗ Missing',
      'AWIN_OAUTH_TOKEN': process.env.AWIN_OAUTH_TOKEN ? '✓ Set' : '✗ Missing',
      'ADCELL_LOGIN': process.env.ADCELL_LOGIN ? '✓ Set' : '✗ Missing',
      'ADCELL_PASSWORD': process.env.ADCELL_PASSWORD ? '✓ Set' : '✗ Missing',
      'PAYPAL_CLIENT_ID': process.env.PAYPAL_CLIENT_ID ? '✓ Set' : '✗ Missing',
      'PAYPAL_CLIENT_SECRET': process.env.PAYPAL_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
      'PAYPAL_MODE': process.env.PAYPAL_MODE || 'Not Set'
    }

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => value && value.includes('✗'))
      .map(([key]) => key)

    checks.services.environment = {
      status: missingVars.length === 0 ? 'healthy' : 'warning',
      variables: requiredEnvVars,
      missing: missingVars,
      message: missingVars.length === 0 
        ? 'All environment variables configured' 
        : `Missing ${missingVars.length} environment variable(s)`
    }

    // Check Supabase connection
    checks.services.supabase = {
      status: 'checking'
    }

    try {
      const supabase = await createClient()
      const { data, error } = await supabase.from('profiles').select('count').limit(1).single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found (which is ok)
        checks.services.supabase = {
          status: 'error',
          error: error.message,
          message: 'Database connection failed'
        }
        checks.status = 'unhealthy'
      } else {
        checks.services.supabase = {
          status: 'healthy',
          message: 'Database connected successfully'
        }
      }
    } catch (error: any) {
      checks.services.supabase = {
        status: 'error',
        error: error.message,
        message: 'Failed to connect to Supabase'
      }
      checks.status = 'unhealthy'
    }

    // Check external APIs connectivity (basic check - just verify keys exist)
    checks.services.externalAPIs = {
      adzuna: process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY ? 'configured' : 'not configured',
      rapidapi: process.env.RAPIDAPI_KEY ? 'configured' : 'not configured',
      awin: process.env.AWIN_OAUTH_TOKEN ? 'configured' : 'not configured',
      adcell: process.env.ADCELL_LOGIN && process.env.ADCELL_PASSWORD ? 'configured' : 'not configured',
      paypal: process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET ? 'configured' : 'not configured'
    }

    // Overall status
    if (checks.services.supabase.status === 'error') {
      checks.status = 'unhealthy'
    } else if (missingVars.length > 0) {
      checks.status = 'degraded'
    } else {
      checks.status = 'healthy'
    }

    return NextResponse.json(checks, { 
      status: checks.status === 'healthy' ? 200 : checks.status === 'degraded' ? 207 : 503 
    })

  } catch (error: any) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message,
      message: 'Health check failed'
    }, { status: 500 })
  }
}
