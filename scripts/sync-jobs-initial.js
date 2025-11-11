/**
 * Initial Job Sync Script
 * Triggers first sync to populate database with jobs
 * 
 * Usage: node scripts/sync-jobs-initial.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const queries = [
  'developer',
  'designer', 
  'marketing',
  'sales',
  'manager',
  'engineer',
  'analyst',
  'consultant'
]

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function syncJobs(query) {
  try {
    console.log(`\n🔄 Syncing jobs for: ${query}`)
    
    const response = await fetch(`${BASE_URL}/api/v1/jobs/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        limit: 100
      })
    })

    const data = await response.json()

    if (data.success) {
      console.log(`✅ ${query}: ${data.data.stats.new} new, ${data.data.stats.updated} updated, ${data.data.stats.skipped} skipped`)
      console.log(`📊 Total in database: ${data.data.totalInDatabase}`)
      return data.data
    } else {
      console.error(`❌ ${query}: ${data.error}`)
      return null
    }
  } catch (error) {
    console.error(`❌ ${query}: ${error.message}`)
    return null
  }
}

async function main() {
  console.log('🚀 Starting initial job sync...')
  console.log(`🌐 API Base URL: ${BASE_URL}`)
  console.log(`📋 Syncing ${queries.length} job categories\n`)

  let totalStats = {
    new: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  }

  for (const query of queries) {
    const result = await syncJobs(query)
    
    if (result) {
      totalStats.new += result.stats.new
      totalStats.updated += result.stats.updated
      totalStats.skipped += result.stats.skipped
      totalStats.errors += result.stats.errors
    } else {
      totalStats.errors++
    }

    // Wait 2 seconds between syncs to avoid rate limits
    await sleep(2000)
  }

  console.log('\n✅ Initial sync complete!')
  console.log('📊 Total Statistics:')
  console.log(`   - New jobs: ${totalStats.new}`)
  console.log(`   - Updated jobs: ${totalStats.updated}`)
  console.log(`   - Skipped: ${totalStats.skipped}`)
  console.log(`   - Errors: ${totalStats.errors}`)

  // Get final count
  try {
    const response = await fetch(`${BASE_URL}/api/v1/jobs/sync`)
    const data = await response.json()
    if (data.success) {
      console.log(`\n🎉 Total jobs in database: ${data.data.totalJobs}`)
    }
  } catch (error) {
    console.error('Failed to get final count:', error.message)
  }
}

main().catch(console.error)
