/**
 * Quick API Integration Test Script
 * Run with: node test-api-integration.js
 * 
 * Tests all API endpoints to verify integration
 */

const BASE_URL = 'http://localhost:3000'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testEndpoint(name, url) {
  log(`\n🧪 Testing: ${name}`, 'cyan')
  log(`   URL: ${url}`, 'blue')
  
  try {
    const startTime = Date.now()
    const response = await fetch(url)
    const duration = Date.now() - startTime
    
    if (!response.ok) {
      log(`   ❌ FAILED: HTTP ${response.status}`, 'red')
      const text = await response.text()
      log(`   Response: ${text.substring(0, 200)}`, 'yellow')
      return false
    }
    
    const data = await response.json()
    log(`   ✅ SUCCESS (${duration}ms)`, 'green')
    
    // Show relevant data based on endpoint
    if (data.data?.jobs) {
      log(`   📊 Jobs found: ${data.data.jobs.length}`, 'blue')
      log(`   📦 Total available: ${data.data.pagination?.total || 0}`, 'blue')
      if (data.data.meta?.sources) {
        log(`   🌐 Sources: ${JSON.stringify(data.data.meta.sources)}`, 'blue')
      }
      if (data.data.jobs[0]) {
        log(`   💼 First job: ${data.data.jobs[0].title} @ ${data.data.jobs[0].company}`, 'blue')
      }
    } else if (data.data?.offers) {
      log(`   📊 Offers found: ${data.data.offers.length}`, 'blue')
      log(`   📦 Total available: ${data.data.pagination?.total || 0}`, 'blue')
      if (data.data.offers[0]) {
        log(`   🎁 First offer: ${data.data.offers[0].title} - €${data.data.offers[0].price}`, 'blue')
      }
    } else if (data.data?.status) {
      log(`   📊 Status: ${data.data.status}`, 'blue')
      log(`   🔧 APIs configured: ${Object.keys(data.data.apis || {}).length}`, 'blue')
    }
    
    return true
  } catch (error) {
    log(`   ❌ ERROR: ${error.message}`, 'red')
    return false
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'cyan')
  log('   API INTEGRATION TEST SUITE', 'cyan')
  log('='.repeat(60), 'cyan')
  
  const tests = [
    {
      name: 'System Status',
      url: `${BASE_URL}/api/v1/status`
    },
    {
      name: 'Jobs Search - All Sources',
      url: `${BASE_URL}/api/v1/jobs/search?limit=10`
    },
    {
      name: 'Jobs Search - Developer Jobs',
      url: `${BASE_URL}/api/v1/jobs/search?query=developer&limit=5`
    },
    {
      name: 'Jobs Search - Location Filter',
      url: `${BASE_URL}/api/v1/jobs/search?query=engineer&location=Berlin&limit=5`
    },
    {
      name: 'Jobs Search - Adzuna Only',
      url: `${BASE_URL}/api/v1/jobs/search?sources=adzuna&limit=5`
    },
    {
      name: 'Jobs Search - RapidAPI Only',
      url: `${BASE_URL}/api/v1/jobs/search?sources=rapidapi&limit=5`
    },
    {
      name: 'Offers Search - All Sources',
      url: `${BASE_URL}/api/v1/offers/search?limit=10`
    },
    {
      name: 'Offers Search - On Sale',
      url: `${BASE_URL}/api/v1/offers/search?onSale=true&limit=5`
    }
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url)
    if (result) {
      passed++
    } else {
      failed++
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  log('\n' + '='.repeat(60), 'cyan')
  log('   TEST RESULTS', 'cyan')
  log('='.repeat(60), 'cyan')
  log(`   ✅ Passed: ${passed}`, 'green')
  log(`   ❌ Failed: ${failed}`, 'red')
  log(`   📊 Total: ${tests.length}`, 'blue')
  
  if (failed === 0) {
    log('\n   🎉 ALL TESTS PASSED!', 'green')
  } else {
    log('\n   ⚠️  SOME TESTS FAILED', 'yellow')
  }
  
  log('\n' + '='.repeat(60) + '\n', 'cyan')
}

// Check if server is running
async function checkServer() {
  log('\n🔍 Checking if server is running...', 'yellow')
  try {
    const response = await fetch(`${BASE_URL}/api/v1/status`)
    if (response.ok) {
      log('✅ Server is running!', 'green')
      return true
    }
  } catch (error) {
    log('❌ Server is not running!', 'red')
    log('   Please start the development server with: npm run dev', 'yellow')
    return false
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    process.exit(1)
  }
  
  await runTests()
})()
