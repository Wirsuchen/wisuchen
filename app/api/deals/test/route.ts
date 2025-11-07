import { NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/config/api-keys'
import { awinApi } from '@/lib/api/awin'
import { adcellApi } from '@/lib/api/adcell'

/**
 * Test endpoint to verify affiliate API configurations
 * Visit: http://localhost:3000/api/deals/test
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    configuration: {
      awin: {
        enabled: API_CONFIG.awin.enabled,
        hasToken: !!API_CONFIG.awin.oauthToken,
        tokenPreview: API_CONFIG.awin.oauthToken ? 
          `${API_CONFIG.awin.oauthToken.slice(0, 8)}...${API_CONFIG.awin.oauthToken.slice(-4)}` : 
          'Not configured',
      },
      adcell: {
        enabled: API_CONFIG.adcell.enabled,
        hasLogin: !!API_CONFIG.adcell.login,
        hasPassword: !!API_CONFIG.adcell.password,
        login: API_CONFIG.adcell.login || 'Not configured',
      },
    },
    tests: {
      awin: { status: 'pending', message: '', products: 0 },
      adcell: { status: 'pending', message: '', products: 0 },
    },
  }

  // Test AWIN API
  try {
    const awinResult = await awinApi.searchProducts({ limit: 5 })
    results.tests.awin = {
      status: awinResult.products.length > 0 ? 'success' : 'no_results',
      message: awinResult.products.length > 0 
        ? `Found ${awinResult.products.length} products` 
        : 'API connected but returned no products',
      products: awinResult.products.length,
    }
  } catch (error) {
    results.tests.awin = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      products: 0,
    }
  }

  // Test ADCELL API
  try {
    const adcellResult = await adcellApi.searchProducts({ limit: 5 })
    results.tests.adcell = {
      status: adcellResult.products.length > 0 ? 'success' : 'no_results',
      message: adcellResult.products.length > 0 
        ? `Found ${adcellResult.products.length} products` 
        : 'API connected but returned no products',
      products: adcellResult.products.length,
    }
  } catch (error) {
    results.tests.adcell = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      products: 0,
    }
  }

  const overallStatus = 
    results.tests.awin.status === 'success' || results.tests.adcell.status === 'success'
      ? 'success'
      : 'error'

  return NextResponse.json({
    status: overallStatus,
    message: overallStatus === 'success' 
      ? '✅ At least one affiliate API is working!' 
      : '❌ No affiliate APIs are working. Check your credentials.',
    ...results,
  })
}
