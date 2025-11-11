/*
  Job APIs Test Script
  - Logs total job count from the aggregated jobs endpoint
  - Logs counts per top-level source (e.g., rapidapi, adzuna)
  - Optionally logs counts per RapidAPI sub-source by walking result pages

  Usage:
    node test-job-apis.js                # uses default base URL and query "developer"
    node test-job-apis.js --query nurse  # change query
    node test-job-apis.js --base http://localhost:3001 # custom base URL
    node test-job-apis.js --no-sub      # skip sub-source breakdown (faster)

  Notes:
  - Requires your Next.js dev server running so /api/v1/jobs/search is reachable.
  - Uses caching (useCache=true) to avoid rate limits on repeated runs.
*/

const DEFAULT_BASE = process.env.BASE_URL || 'http://localhost:3000'
const args = process.argv.slice(2)

function getArg(flag, fallback) {
  const i = args.indexOf(flag)
  if (i !== -1 && args[i + 1] && !args[i + 1].startsWith('--')) return args[i + 1]
  return fallback
}

const BASE_URL = getArg('--base', DEFAULT_BASE)
const QUERY = getArg('--query', 'developer')
const SKIP_SUB = args.includes('--no-sub')
const LIMIT = 500

async function ensureFetch() {
  if (typeof fetch !== 'undefined') return fetch
  try {
    const mod = await import('node-fetch')
    return mod.default
  } catch (e) {
    throw new Error('Global fetch is not available and node-fetch is not installed. Use Node 18+ or install node-fetch.')
  }
}

async function getJson(url) {
  const f = await ensureFetch()
  const res = await f(url, {
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'fetch'
    }
  })
  const contentType = (res.headers.get('content-type') || '').toLowerCase()
  const body = await res.text().catch(() => '')

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}. Preview: ${body.slice(0, 300)}`)
  }

  if (!contentType.includes('application/json')) {
    console.error('\nReceived non-JSON response from endpoint:')
    console.error(`- URL: ${url}`)
    console.error(`- Status: ${res.status} ${res.statusText}`)
    console.error(`- Content-Type: ${contentType || 'unknown'}`)
    console.error(`- Body preview: ${body.slice(0, 300)}\n`)
    console.error('Hints:')
    console.error('- Ensure Next.js server is running at the specified base URL')
    console.error('- Open the URL in a browser to verify it returns JSON')
    console.error('- Try using --base http://127.0.0.1:3000 instead of localhost')
    console.error('- Verify the route exists: /api/v1/jobs/search')
    throw new Error('Expected JSON but received non-JSON response')
  }

  try {
    return JSON.parse(body)
  } catch (e) {
    console.error('Failed to parse JSON body. Preview:', body.slice(0, 300))
    throw e
  }
}

function buildUrl(page) {
  const params = new URLSearchParams()
  params.set('limit', String(LIMIT))
  params.set('page', String(page))
  params.set('useCache', 'true')
  if (QUERY) params.set('query', QUERY)
  // DACH region can be toggled here if needed:
  // params.set('countries', 'de,at,ch')
  return `${BASE_URL}/api/v1/jobs/search?${params.toString()}`
}

async function main() {
  console.log('=== Job APIs Test ===')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Query: ${QUERY || '(none)'}`)
  console.log(`Limit per page: ${LIMIT}`)
  console.log('----------------------')

  // First page
  const firstUrl = buildUrl(1)
  const first = await getJson(firstUrl)

  const total = first?.data?.pagination?.total ?? first?.data?.total ?? 0
  const page = first?.data?.pagination?.page ?? 1
  const limit = first?.data?.pagination?.limit ?? LIMIT
  const jobsPage = first?.data?.jobs ?? []
  const topLevelSources = first?.data?.meta?.sources ?? {}

  console.log('\n[Top-level Source Counts]')
  for (const [src, n] of Object.entries(topLevelSources)) {
    console.log(`- ${src}: ${n}`)
  }
  console.log(`\nTotal jobs (deduplicated): ${total}`)
  console.log(`Fetched page ${page} with ${jobsPage.length} jobs (limit ${limit})`)

  if (SKIP_SUB) {
    console.log('\n(Sub-source breakdown skipped)')
    return
  }

  // Walk pages to compute RapidAPI sub-source breakdown
  const allJobs = [...jobsPage]
  const totalPages = Math.ceil(total / limit)
  for (let p = 2; p <= totalPages; p++) {
    // Safety guard: avoid excessive requests
    if (p > 10) {
      console.log(`Stopping pagination at page ${p - 1} (safety cap).`)
      break
    }
    const url = buildUrl(p)
    const data = await getJson(url)
    const jobs = data?.data?.jobs ?? []
    console.log(`Fetched page ${p} with ${jobs.length} jobs`)
    allJobs.push(...jobs)
  }

  // Group by job.source if present (e.g., rapidapi-jsearch, rapidapi-glassdoor)
  const subCounts = allJobs.reduce((acc, j) => {
    const src = (j && j.source) ? j.source : 'unknown'
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {})

  console.log('\n[Sub-source Breakdown from fetched jobs]')
  Object.entries(subCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([src, n]) => console.log(`- ${src}: ${n}`))

  console.log(`\nSummary:`)
  console.log(`- Total (API reported): ${total}`)
  console.log(`- Counted from fetched pages: ${allJobs.length}`)
}

main().catch((err) => {
  console.error('Test failed:', err)
  process.exitCode = 1
})
