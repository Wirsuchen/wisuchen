/**
 * Job Sync API Route
 * Triggers sync of jobs from external APIs to Supabase database
 * POST /api/v1/jobs/sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { jobSyncService } from '@/lib/services/job-sync'
import { logger } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    // Optional: Add authentication check here
    // For now, allow any request to trigger sync
    
    const body = await req.json().catch(() => ({}))
    const { query, limit } = body

    logger.info('Job sync triggered', { query, limit })

    // Run sync
    const stats = await jobSyncService.syncAllJobs({
      query,
      limit: limit || 100
    })

    // Get total count from database
    const totalInDb = await jobSyncService.getTotalJobCount()

    return NextResponse.json({
      success: true,
      data: {
        stats,
        totalInDatabase: totalInDb
      }
    }, { status: 200 })

  } catch (error: any) {
    logger.apiError('jobs-sync', 'sync', error)

    return NextResponse.json({
      success: false,
      error: error.message || 'Job sync failed'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get sync status and database stats
    const totalInDb = await jobSyncService.getTotalJobCount()

    return NextResponse.json({
      success: true,
      data: {
        totalJobs: totalInDb,
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
