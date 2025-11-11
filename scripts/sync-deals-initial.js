/**
 * Initial Deal Sync Script
 * Triggers first sync to populate database with deals
 * 
 * Usage: node scripts/sync-deals-initial.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Amazon ASINs for top products
const asins = [
  'B07ZPKBL9V', // iPhone 11
  'B0DGJ736JM', // Apple Watch SE
  'B0BL5PYD69', // Amazon Fire HD 10
  'B0CQMRKRV5', // Fire TV Stick
]

const queries = [
  'laptop',
  'smartphone',
  'headphones',
  'monitor',
  'keyboard',
  'mouse',
  'tablet',
  'smartwatch'
]

// Sample product IDs for ShopSavvy Price Comparison
const productIds = [
  '611247373064', // Example product
]

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function syncDeals(query) {
  try {
    console.log(`\n🔄 Syncing deals for: ${query}`)
    
    const response = await fetch(`${BASE_URL}/api/v1/deals/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        limit: 50
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

async function syncPriceComparison(productId) {
  try {
    console.log(`\n💰 Syncing price comparison for product: ${productId}`)
    
    const response = await fetch(`${BASE_URL}/api/v1/deals/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productIds: [productId],
        limit: 20
      })
    })

    const data = await response.json()

    if (data.success) {
      console.log(`✅ Price comparison: ${data.data.stats.new} new offers`)
      return data.data
    } else {
      console.error(`❌ Price comparison: ${data.error}`)
      return null
    }
  } catch (error) {
    console.error(`❌ Price comparison: ${error.message}`)
    return null
  }
}

async function syncAmazonDeals() {
  try {
    console.log('\n📦 Syncing Amazon deals...')
    
    const response = await fetch(`${BASE_URL}/api/v1/deals/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        asins: asins,
        limit: 50
      })
    })

    const data = await response.json()

    if (data.success) {
      console.log(`✅ Amazon: ${data.data.stats.new} new deals from ${asins.length} ASINs`)
      console.log(`📊 Total in database: ${data.data.totalInDatabase}`)
      return data.data
    } else {
      console.error(`❌ Amazon sync: ${data.error}`)
      return null
    }
  } catch (error) {
    console.error(`❌ Amazon sync: ${error.message}`)
    return null
  }
}

async function main() {
  console.log('🚀 Starting initial deal sync...')
  console.log(`🌐 API Base URL: ${BASE_URL}`)
  console.log(`📦 Syncing Amazon deals first (priority source)`)
  console.log(`📋 Then syncing ${queries.length} product categories\n`)

  let totalStats = {
    new: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  }

  // Priority 1: Sync Amazon deals
  const amazonResult = await syncAmazonDeals()
  if (amazonResult) {
    totalStats.new += amazonResult.stats.new
    totalStats.updated += amazonResult.stats.updated
    totalStats.skipped += amazonResult.stats.skipped
    totalStats.errors += amazonResult.stats.errors
  } else {
    totalStats.errors++
  }

  await sleep(2000)

  // Priority 2: Sync product search deals
  for (const query of queries) {
    const result = await syncDeals(query)
    
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

  // Sync price comparison offers
  console.log('\n\n💰 Syncing price comparison offers...')
  for (const productId of productIds) {
    const result = await syncPriceComparison(productId)
    
    if (result) {
      totalStats.new += result.stats.new
      totalStats.updated += result.stats.updated
      totalStats.skipped += result.stats.skipped
      totalStats.errors += result.stats.errors
    } else {
      totalStats.errors++
    }

    await sleep(2000)
  }

  console.log('\n✅ Initial sync complete!')
  console.log('📊 Total Statistics:')
  console.log(`   - New deals: ${totalStats.new}`)
  console.log(`   - Updated deals: ${totalStats.updated}`)
  console.log(`   - Skipped: ${totalStats.skipped}`)
  console.log(`   - Errors: ${totalStats.errors}`)

  // Get final count
  try {
    const response = await fetch(`${BASE_URL}/api/v1/deals/sync`)
    const data = await response.json()
    if (data.success) {
      console.log(`\n🎉 Total deals in database: ${data.data.totalDeals}`)
    }
  } catch (error) {
    console.error('Failed to get final count:', error.message)
  }
}

main().catch(console.error)
