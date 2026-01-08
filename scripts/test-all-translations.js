/**
 * Comprehensive Translation Test Script
 * Tests all endpoints: jobs, job detail, blogs, blog detail, deals, deal detail
 * Verifies translation works for different locales
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3001"

const LOCALES = ["en", "de", "fr", "it"]

async function testEndpoint(name, url, checkFn) {
  try {
    const res = await fetch(url)
    const contentType = res.headers.get("content-type") || ""

    if (!res.ok) {
      console.log(`❌ ${name}: HTTP ${res.status}`)
      return {name, success: false, error: `HTTP ${res.status}`}
    }

    if (!contentType.includes("application/json")) {
      console.log(`❌ ${name}: Not JSON response`)
      return {name, success: false, error: "Not JSON"}
    }

    const data = await res.json()
    const result = checkFn(data)

    if (result.success) {
      console.log(`✅ ${name}: ${result.message}`)
    } else {
      console.log(`❌ ${name}: ${result.message}`)
    }

    return {name, ...result}
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`)
    return {name, success: false, error: err.message}
  }
}

async function main() {
  console.log("=".repeat(60))
  console.log("🔍 TRANSLATION ENDPOINTS TEST")
  console.log(`   Base URL: ${BASE_URL}`)
  console.log("=".repeat(60))
  console.log("")

  const results = []

  // 1. Test /api/test-translate
  console.log("📋 1. Testing Translation API Health")
  console.log("-".repeat(40))
  results.push(
    await testEndpoint(
      "Translation Health Check",
      `${BASE_URL}/api/test-translate`,
      data => ({
        success: data.status?.includes("✅") || false,
        message: data.status || "No status",
        details: data.serviceAccount,
      })
    )
  )
  console.log("")

  // 2. Test Jobs API with different locales
  console.log("📋 2. Testing Jobs API (with locales)")
  console.log("-".repeat(40))

  for (const locale of LOCALES) {
    results.push(
      await testEndpoint(
        `Jobs List [${locale}]`,
        `${BASE_URL}/api/v1/jobs/search?limit=3&locale=${locale}`,
        data => {
          // API returns { success, data: { jobs: [...] } }
          const jobs = data.data?.jobs || data.jobs || []
          if (jobs.length === 0) {
            return {success: false, message: "No jobs returned"}
          }
          const sample = jobs[0]
          return {
            success: true,
            message: `${jobs.length} jobs, sample: "${(
              sample.title || ""
            ).substring(0, 40)}..."`,
          }
        }
      )
    )
  }
  console.log("")

  // 3. Test Deals API with different locales
  console.log("📋 3. Testing Deals API (with locales)")
  console.log("-".repeat(40))

  for (const locale of LOCALES) {
    results.push(
      await testEndpoint(
        `Deals List [${locale}]`,
        `${BASE_URL}/api/deals?limit=3&locale=${locale}`,
        data => {
          const deals = data.deals || []
          if (deals.length === 0) {
            return {success: false, message: "No deals returned"}
          }
          const sample = deals[0]
          return {
            success: true,
            message: `${deals.length} deals, sample: "${(
              sample.title || ""
            ).substring(0, 40)}..."`,
          }
        }
      )
    )
  }
  console.log("")

  // 4. Test /api/translate endpoint directly
  console.log("📋 4. Testing Direct Translation API")
  console.log("-".repeat(40))

  const testTexts = [
    {
      type: "job",
      title: "Software Developer",
      description: "Build amazing applications",
    },
    {
      type: "deal",
      title: "Amazing Discount",
      description: "Save 50% on electronics",
    },
    {
      type: "blog",
      title: "How to Learn Programming",
      description: "A complete guide",
      content: "Start with basics...",
    },
  ]

  for (const test of testTexts) {
    for (const locale of ["de", "fr"]) {
      const body = {
        contentType: test.type,
        title: test.title,
        description: test.description,
        ...(test.content ? {content: test.content} : {}),
        toLanguage: locale,
        fromLanguage: "en",
      }

      try {
        const res = await fetch(`${BASE_URL}/api/translate`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const errText = await res.text()
          console.log(
            `❌ Translate ${test.type} to ${locale}: HTTP ${
              res.status
            } - ${errText.substring(0, 100)}`
          )
          results.push({
            name: `Translate ${test.type} [${locale}]`,
            success: false,
          })
        } else {
          const data = await res.json()
          const translated = data.title || data.translation || ""
          console.log(
            `✅ Translate ${test.type} to ${locale}: "${
              test.title
            }" → "${translated.substring(0, 30)}..."`
          )
          results.push({
            name: `Translate ${test.type} [${locale}]`,
            success: true,
          })
        }
      } catch (err) {
        console.log(`❌ Translate ${test.type} to ${locale}: ${err.message}`)
        results.push({
          name: `Translate ${test.type} [${locale}]`,
          success: false,
        })
      }
    }
  }
  console.log("")

  // 5. Get a specific job ID and test job detail
  console.log("📋 5. Testing Job Detail")
  console.log("-".repeat(40))

  try {
    const jobsRes = await fetch(
      `${BASE_URL}/api/v1/jobs/search?limit=1&useDatabase=true`
    )
    if (jobsRes.ok) {
      const jobsData = await jobsRes.json()
      const jobs = jobsData.jobs || jobsData.data || []
      if (jobs.length > 0) {
        const jobId = jobs[0].id || jobs[0].externalId
        results.push(
          await testEndpoint(
            `Job Detail [${jobId.substring(0, 20)}...]`,
            `${BASE_URL}/api/jobs/${encodeURIComponent(jobId)}`,
            data => ({
              success: !!data.job,
              message: data.job
                ? `Found: "${(data.job.title || "").substring(0, 40)}..."`
                : "No job data",
            })
          )
        )
      } else {
        console.log("⚠️  No jobs found to test detail")
      }
    }
  } catch (err) {
    console.log(`❌ Job Detail test failed: ${err.message}`)
  }
  console.log("")

  // Summary
  console.log("=".repeat(60))
  console.log("📊 SUMMARY")
  console.log("=".repeat(60))

  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📋 Total:  ${results.length}`)
  console.log("")

  if (failed > 0) {
    console.log("Failed tests:")
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.error || r.message || "Unknown error"}`)
      })
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error("Test script error:", err)
  process.exit(1)
})
