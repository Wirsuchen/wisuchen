import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['supervisor', 'admin', 'moderator'].includes(profile.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get job sources breakdown
    const { data: jobSources } = await supabase
      .from('offers')
      .select('source')
      .eq('type', 'job')

    // Get deal sources breakdown
    const { data: dealSources } = await supabase
      .from('offers')
      .select('source')
      .eq('type', 'affiliate')

    // Count by source for jobs
    const jobSourceCounts: Record<string, number> = {}
    jobSources?.forEach((item) => {
      const source = item.source || 'unknown'
      jobSourceCounts[source] = (jobSourceCounts[source] || 0) + 1
    })

    // Count by source for deals
    const dealSourceCounts: Record<string, number> = {}
    dealSources?.forEach((item) => {
      const source = item.source || 'unknown'
      dealSourceCounts[source] = (dealSourceCounts[source] || 0) + 1
    })

    // Get source details from job_sources table
    const { data: sourceDetails } = await supabase
      .from('job_sources')
      .select('id, name, type, is_active, last_import_at')

    // Get total counts
    const totalJobs = jobSources?.length || 0
    const totalDeals = dealSources?.length || 0

    return NextResponse.json({
      jobSources: jobSourceCounts,
      dealSources: dealSourceCounts,
      sourceDetails: sourceDetails || [],
      totals: {
        jobs: totalJobs,
        deals: totalDeals,
        sources: Object.keys({ ...jobSourceCounts, ...dealSourceCounts }).length
      }
    })
  } catch (error) {
    console.error('Admin sources error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
