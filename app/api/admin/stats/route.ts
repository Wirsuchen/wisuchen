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

    const startOfMonth = new Date()
    startOfMonth.setUTCDate(1)
    startOfMonth.setUTCHours(0, 0, 0, 0)

    // Jobs
    const { count: totalJobs } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'job')

    const { count: activeJobs } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'job')
      .eq('status', 'active')

    // Companies & Users
    const { count: totalCompanies } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Imports
    const { count: totalImports } = await supabase
      .from('import_runs')
      .select('*', { count: 'exact', head: true })

    const { count: successfulImports } = await supabase
      .from('import_runs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Payments & Revenue (sum amounts from completed payments)
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount, status, processed_at')

    const { data: monthlyPayments } = await supabase
      .from('payments')
      .select('amount, status, processed_at')
      .gte('processed_at', startOfMonth.toISOString())

    const totalRevenue = (allPayments || [])
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)

    const monthlyRevenue = (monthlyPayments || [])
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)

    // Impressions (views/clicks)
    const { count: totalViews } = await supabase
      .from('impressions')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'view')

    const { count: totalClicks } = await supabase
      .from('impressions')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'click')

    return NextResponse.json({
      totalJobs: totalJobs || 0,
      activeJobs: activeJobs || 0,
      totalCompanies: totalCompanies || 0,
      totalUsers: totalUsers || 0,
      totalRevenue,
      monthlyRevenue,
      totalImports: totalImports || 0,
      successfulImports: successfulImports || 0,
      totalViews: totalViews || 0,
      totalClicks: totalClicks || 0,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



