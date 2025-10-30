/**
 * Direct RapidAPI Test
 * Tests if your RapidAPI key works with FREE endpoints
 */

const API_KEY = '90b7091d96msh7d9172a7f3735c4p100a2bjsn9237d1dbc9f8'

// Test each FREE API endpoint
const endpoints = [
  {
    name: 'Employment Agency API',
    host: 'employment-agency-api.p.rapidapi.com',
    path: '/jobs/search?query=developer&location=Germany'
  },
  {
    name: 'Glassdoor Real-Time API',
    host: 'glassdoor-real-time-api.p.rapidapi.com',
    path: '/jobs?query=developer'
  },
  {
    name: 'Upwork Jobs API',
    host: 'upwork-jobs-api.p.rapidapi.com',
    path: '/jobs?q=developer'
  },
  {
    name: 'Active Jobs DB API',
    host: 'active-jobs-db-api.p.rapidapi.com',
    path: '/jobs?query=developer'
  },
  {
    name: 'Job Postings API',
    host: 'job-postings-api.p.rapidapi.com',
    path: '/search?keywords=developer'
  },
  {
    name: 'Y Combinator Jobs API',
    host: 'free-y-combinator-jobs-api.p.rapidapi.com',
    path: '/jobs?role=developer'
  }
]

async function testAPI(endpoint) {
  console.log(`\n🧪 Testing: ${endpoint.name}`)
  console.log(`   URL: https://${endpoint.host}${endpoint.path}`)
  
  try {
    const response = await fetch(`https://${endpoint.host}${endpoint.path}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': endpoint.host
      }
    })
    
    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const text = await response.text()
      console.log(`   ❌ Error: ${text.substring(0, 200)}`)
      
      if (response.status === 403) {
        console.log(`   ⚠️  You need to SUBSCRIBE to this API on RapidAPI.com`)
      }
      return false
    }
    
    const data = await response.json()
    const jobCount = (data.jobs || data.data || data.results || []).length
    
    console.log(`   ✅ Success! Found ${jobCount} jobs`)
    console.log(`   Response keys: ${Object.keys(data).join(', ')}`)
    
    return true
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return false
  }
}

async function runTests() {
  console.log('='.repeat(60))
  console.log('   RAPID API FREE ENDPOINTS TEST')
  console.log('='.repeat(60))
  console.log(`\n🔑 Using API Key: ${API_KEY.substring(0, 20)}...`)
  
  let passed = 0
  let failed = 0
  
  for (const endpoint of endpoints) {
    const result = await testAPI(endpoint)
    if (result) {
      passed++
    } else {
      failed++
    }
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s between tests
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('   TEST RESULTS')
  console.log('='.repeat(60))
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📊 Total: ${endpoints.length}`)
  
  if (failed > 0) {
    console.log('\n⚠️  IMPORTANT:')
    console.log('If you see 403 errors, you need to SUBSCRIBE to those APIs on RapidAPI.com')
    console.log('Go to: https://rapidapi.com/hub')
    console.log('Search for each API and click "Subscribe to Test"')
    console.log('Choose the FREE tier for each one')
  }
  
  console.log('\n')
}

runTests()
