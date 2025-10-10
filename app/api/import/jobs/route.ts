// Job Import API - Import jobs from external APIs
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdzunaAPI, transformAdzunaJob } from '@/lib/services/job-apis/adzuna'
import { RapidAPIService, transformRapidAPIJob } from '@/lib/services/job-apis/rapidapi'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['supervisor', 'admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { source, params = {}, limit = 50 } = body

    let importedJobs: any[] = []
    let sourceId: string | null = null

    // Get or create job source record
    const { data: jobSource } = await supabase
      .from('job_sources')
      .select('id')
      .eq('name', source)
      .single()

    if (jobSource) {
      sourceId = jobSource.id
    } else {
      const { data: newSource } = await supabase
        .from('job_sources')
        .insert({
          name: source,
          type: 'api',
          is_active: true,
          last_import_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      sourceId = newSource?.id || null
    }

    // Create import run record
    const { data: importRun } = await supabase
      .from('import_runs')
      .insert({
        source_id: sourceId,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    const importRunId = importRun?.id

    try {
      switch (source) {
        case 'adzuna':
          const adzunaAPI = new AdzunaAPI()
          const adzunaResults = await adzunaAPI.searchJobs({
            ...params,
            results_per_page: Math.min(limit, 50)
          })
          
          importedJobs = adzunaResults.results.map(transformAdzunaJob)
          break

        case 'rapidapi-employment-agency':
          const rapidAPI = new RapidAPIService()
          const employmentJobs = await rapidAPI.searchEmploymentAgencyJobs({
            ...params,
            limit: Math.min(limit, 50)
          })
          
          importedJobs = employmentJobs.map(job => transformRapidAPIJob(job, 'employment-agency'))
          break

        case 'rapidapi-glassdoor':
          const rapidAPI2 = new RapidAPIService()
          const glassdoorJobs = await rapidAPI2.searchGlassdoorJobs({
            ...params,
            page: params.page || 1
          })
          
          importedJobs = glassdoorJobs.map(job => transformRapidAPIJob(job, 'glassdoor'))
          break

        case 'rapidapi-aggregate':
          const rapidAPI3 = new RapidAPIService()
          const aggregateResults = await rapidAPI3.aggregateJobSearch({
            ...params,
            sources: params.sources || ['employment-agency', 'glassdoor', 'active-jobs']
          })
          
          importedJobs = aggregateResults.jobs.map(job => transformRapidAPIJob(job, job.source || 'unknown'))
          break

        default:
          return NextResponse.json({ error: 'Unsupported job source' }, { status: 400 })
      }

      // Process and insert jobs
      let createdCount = 0
      let updatedCount = 0
      let failedCount = 0

      for (const jobData of importedJobs) {
        try {
          // Check if job already exists
          const { data: existingJob } = await supabase
            .from('offers')
            .select('id')
            .eq('source', jobData.source)
            .eq('external_id', jobData.external_id)
            .single()

          // Find or create company
          let companyId = null
          if (jobData.company_name) {
            const { data: company } = await supabase
              .from('companies')
              .select('id')
              .ilike('name', jobData.company_name)
              .single()

            if (company) {
              companyId = company.id
            } else {
              // Create company
              const { data: newCompany } = await supabase
                .from('companies')
                .insert({
                  name: jobData.company_name,
                  slug: jobData.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  is_active: true
                })
                .select('id')
                .single()
              
              companyId = newCompany?.id
            }
          }

          // Find category
          let categoryId = null
          if (jobData.category_name) {
            const { data: category } = await supabase
              .from('categories')
              .select('id')
              .eq('type', 'job')
              .ilike('name', jobData.category_name)
              .single()
            
            categoryId = category?.id
          }

          // Prepare job data for insertion
          const offerData = {
            ...jobData,
            company_id: companyId,
            category_id: categoryId,
            source_id: sourceId,
            created_by: profile.id,
            slug: `${jobData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
            status: 'pending' // Require manual approval for imported jobs
          }

          // Remove fields that don't exist in the database
          delete offerData.company_name
          delete offerData.category_name
          delete offerData.salary_text

          if (existingJob) {
            // Update existing job
            await supabase
              .from('offers')
              .update(offerData)
              .eq('id', existingJob.id)
            
            updatedCount++
          } else {
            // Create new job
            await supabase
              .from('offers')
              .insert(offerData)
            
            createdCount++
          }
        } catch (error) {
          console.error('Error processing job:', error)
          failedCount++
        }
      }

      // Update import run
      await supabase
        .from('import_runs')
        .update({
          status: 'completed',
          total_records: importedJobs.length,
          processed_records: createdCount + updatedCount + failedCount,
          created_records: createdCount,
          updated_records: updatedCount,
          failed_records: failedCount,
          completed_at: new Date().toISOString()
        })
        .eq('id', importRunId)

      // Update job source last import time
      if (sourceId) {
        await supabase
          .from('job_sources')
          .update({ last_import_at: new Date().toISOString() })
          .eq('id', sourceId)
      }

      return NextResponse.json({
        success: true,
        import_run_id: importRunId,
        summary: {
          total_fetched: importedJobs.length,
          created: createdCount,
          updated: updatedCount,
          failed: failedCount
        }
      })

    } catch (importError) {
      // Update import run with error
      if (importRunId) {
        await supabase
          .from('import_runs')
          .update({
            status: 'failed',
            error_log: importError instanceof Error ? importError.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', importRunId)
      }

      throw importError
    }

  } catch (error) {
    console.error('Job import API error:', error)
    return NextResponse.json({ 
      error: 'Failed to import jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check import status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const importRunId = searchParams.get('import_run_id')

    if (importRunId) {
      // Get specific import run status
      const { data: importRun, error } = await supabase
        .from('import_runs')
        .select(`
          *,
          source:job_sources(name, type)
        `)
        .eq('id', importRunId)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Import run not found' }, { status: 404 })
      }

      return NextResponse.json({ import_run: importRun })
    } else {
      // Get recent import runs
      const { data: importRuns, error } = await supabase
        .from('import_runs')
        .select(`
          *,
          source:job_sources(name, type)
        `)
        .order('started_at', { ascending: false })
        .limit(20)

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch import runs' }, { status: 500 })
      }

      return NextResponse.json({ import_runs: importRuns })
    }
  } catch (error) {
    console.error('Import status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
