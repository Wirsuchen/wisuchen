
async function testApi() {
  const url = 'http://localhost:3000/api/v1/jobs/search?locale=de&limit=5&useDatabase=true'
  console.log('Fetching:', url)
  
  try {
    const res = await fetch(url)
    if (!res.ok) {
        console.error('Error:', res.status, res.statusText)
        return
    }
    const data = await res.json()
    console.log('Success:', data.success)
    console.log('Locale in API:', data.data?.meta?.language) // Assuming API returns language/locale in meta or similar?
    
    // Check jobs
    const jobs = data.data?.jobs || []
    console.log(`Found ${jobs.length} jobs`)
    
    for (const job of jobs) {
        if (job.id === '53a8876a-d9a0-456e-bb7e-d13f2b13d3f6') {
            console.log('Target Job Found!')
            console.log('Title:', job.title)
            console.log('Desc:', job.description?.substring(0, 50))
        }
    }
  } catch (err) {
    console.error('Fetch error:', err)
  }
}

testApi()

