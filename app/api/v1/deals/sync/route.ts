/**
 * Deal Sync API Route
 * Triggers sync of deals from external APIs to Supabase database
 * POST /api/v1/deals/sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { dealSyncService } from '@/lib/services/deal-sync'
import { logger } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { query, limit, productIds, asins } = body

    logger.info('Deal sync triggered', { query, limit, productIds, asins })

    // Run sync
    const stats = await dealSyncService.syncAllDeals({
      query: query || 'laptop',
      limit: limit || 50,
      productIds: productIds || [],
      asins: asins || []
    })

    // Get total count from database
    const totalInDb = await dealSyncService.getTotalDealCount()

    return NextResponse.json({
      success: true,
      data: {
        stats,
        totalInDatabase: totalInDb
      }
    }, { status: 200 })

  } catch (error: any) {
    logger.apiError('deals-sync', 'sync', error)

    return NextResponse.json({
      success: false,
      error: error.message || 'Deal sync failed'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get sync status and database stats
    const totalInDb = await dealSyncService.getTotalDealCount()

    return NextResponse.json({
      success: true,
      data: {
        totalDeals: totalInDb,
        message: 'Use POST to trigger sync'
      }
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get sync status'
    }, { status: 500 })
  }
}
