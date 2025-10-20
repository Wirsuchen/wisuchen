#!/usr/bin/env node

/**
 * TalentPlus API Testing Script
 * 
 * Run this script to test all API endpoints automatically
 * Usage: node test-api.js
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
  bold: '\x1b[1m'
}

let totalTests = 0
let passedTests = 0
let failedTests = 0

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function success(message) {
  log(`✓ ${message}`, colors.green)
  passedTests++
  totalTests++
}

function fail(message, error = '') {
  log(`✗ ${message}`, colors.red)
  if (error) log(`  Error: ${error}`, colors.red)
  failedTests++
  totalTests++
}

function info(message) {
  log(`ℹ ${message}`, colors.blue)
}

function section(title) {
  log(`\n${colors.bold}${colors.cyan}═══ ${title} ═══${colors.reset}\n`)
}

async function testEndpoint(name, url, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, options)
    const contentType = response.headers.get('content-type')
    
    let data
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (response.ok) {
      success(`${name} - Status: ${response.status}`)
      return { success: true, data, status: response.status }
    } else {
      fail(`${name} - Status: ${response.status}`, JSON.stringify(data).substring(0, 100))
      return { success: false, data, status: response.status }
    }
  } catch (error) {
    fail(`${name}`, error.message)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  log(`${colors.bold}${colors.cyan}
╔═══════════════════════════════════════════╗
║   TalentPlus API Testing Suite           ║
║   Testing all endpoints...                ║
╚═══════════════════════════════════════════╝
${colors.reset}`)

  info(`Testing against: ${BASE_URL}`)
  info(`Make sure your dev server is running!\n`)

  // ==========================================
  // 1. Categories API Tests
  // ==========================================
  section('Categories API')

  await testEndpoint(
    'Get all categories',
    '/api/categories'
  )

  await testEndpoint(
    'Get job categories',
    '/api/categories?type=job'
  )

  await testEndpoint(
    'Get affiliate categories',
    '/api/categories?type=affiliate'
  )

  await testEndpoint(
    'Get blog categories',
    '/api/categories?type=blog'
  )

  await testEndpoint(
    'Search categories',
    '/api/categories?search=tech&limit=5'
  )

  // ==========================================
  // 2. Jobs API Tests
  // ==========================================
  section('Jobs API')

  const jobsResult = await testEndpoint(
    'Get all jobs',
    '/api/jobs'
  )

  await testEndpoint(
    'Get jobs with pagination',
    '/api/jobs?page=1&limit=10'
  )

  await testEndpoint(
    'Get jobs with category filter',
    '/api/jobs?category=technology'
  )

  await testEndpoint(
    'Get jobs with location filter',
    '/api/jobs?location=Berlin'
  )

  await testEndpoint(
    'Get jobs with employment type filter',
    '/api/jobs?employment_type=full-time'
  )

  await testEndpoint(
    'Search jobs',
    '/api/jobs?search=developer'
  )

  // Test specific job if we got jobs data
  if (jobsResult.success && jobsResult.data?.data?.length > 0) {
    const jobId = jobsResult.data.data[0].id
    await testEndpoint(
      `Get specific job (ID: ${jobId})`,
      `/api/jobs/${jobId}`
    )
  } else {
    info('⊘ Skipping specific job test (no jobs found)')
  }

  // ==========================================
  // 3. Job Import API Tests (Admin)
  // ==========================================
  section('Job Import API (Admin - requires auth)')

  info('⊘ Skipping POST /api/import/jobs (requires authentication)')
  info('⊘ To test: Use Postman/Thunder Client with auth token')

  await testEndpoint(
    'Get import status (no run_id)',
    '/api/import/jobs'
  )

  // ==========================================
  // 4. Affiliate Import API Tests (Admin)
  // ==========================================
  section('Affiliate Import API (Admin - requires auth)')

  info('⊘ Skipping POST /api/import/affiliates (requires authentication)')
  info('⊘ To test: Use Postman/Thunder Client with auth token')

  await testEndpoint(
    'Get affiliate programs list',
    '/api/import/affiliates'
  )

  // ==========================================
  // 5. Payment API Tests
  // ==========================================
  section('Payment API (requires auth)')

  info('⊘ Skipping POST /api/payment/paypal (requires authentication)')
  info('⊘ Skipping PUT /api/payment/paypal (requires authentication)')
  info('⊘ To test payments: Login to app and use payment flow')

  await testEndpoint(
    'Get payment status (no ID)',
    '/api/payment/paypal'
  )

  // ==========================================
  // 6. Page Load Tests
  // ==========================================
  section('Page Load Tests')

  const pagesToTest = [
    { name: 'Home page', path: '/' },
    { name: 'Jobs page', path: '/jobs' },
    { name: 'Deals page', path: '/deals' },
    { name: 'Blog page', path: '/blog' },
    { name: 'Pricing page', path: '/pricing' },
    { name: 'About page', path: '/about' },
    { name: 'Support page', path: '/support' },
    { name: 'Login page', path: '/login' },
    { name: 'Register page', path: '/register' },
  ]

  for (const page of pagesToTest) {
    try {
      const response = await fetch(`${BASE_URL}${page.path}`)
      if (response.ok) {
        success(`${page.name} loads - Status: ${response.status}`)
      } else {
        fail(`${page.name} - Status: ${response.status}`)
      }
    } catch (error) {
      fail(`${page.name}`, error.message)
    }
  }

  // ==========================================
  // Summary
  // ==========================================
  log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════${colors.reset}`)
  log(`${colors.bold}Test Summary:${colors.reset}`)
  log(`  Total Tests: ${totalTests}`)
  log(`  ${colors.green}Passed: ${passedTests}${colors.reset}`)
  log(`  ${colors.red}Failed: ${failedTests}${colors.reset}`)
  log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`)
  log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`)

  if (failedTests === 0) {
    log(`${colors.green}${colors.bold}🎉 All tests passed! Your app is working great!${colors.reset}\n`)
  } else {
    log(`${colors.yellow}${colors.bold}⚠️  Some tests failed. Check the errors above.${colors.reset}\n`)
  }

  // Return exit code
  process.exit(failedTests > 0 ? 1 : 0)
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(BASE_URL)
    return true
  } catch (error) {
    log(`\n${colors.red}${colors.bold}Error: Cannot connect to ${BASE_URL}${colors.reset}`)
    log(`${colors.yellow}Make sure your development server is running:${colors.reset}`)
    log(`${colors.cyan}  pnpm dev${colors.reset}\n`)
    return false
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer()
  if (serverRunning) {
    await runTests()
  } else {
    process.exit(1)
  }
})()
