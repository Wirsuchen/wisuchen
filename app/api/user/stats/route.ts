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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Active job ads by this user
    const { count: activeJobAds } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', profile.id)
      .eq('type', 'job')
      .eq('status', 'active')

    // Total invoices for this user
    const { count: totalInvoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)

    // Views of this user's job offers
    const { count: profileViews } = await supabase
      .from('impressions')
      .select('*', { count: 'exact', head: true })
      .in('offer_id', (
        await supabase.from('offers').select('id').eq('created_by', profile.id)
      ).data?.map(o => o.id) || [] )

    // Saved deals count (if saved_offers table exists later this returns 0 now)
    let savedDeals = 0
    try {
      const { count } = await supabase
        .from('saved_offers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
      savedDeals = count || 0
    } catch {
      savedDeals = 0
    }

    return NextResponse.json({
      activeJobAds: activeJobAds || 0,
      savedDeals,
      totalInvoices: totalInvoices || 0,
      profileViews: profileViews || 0,
    })
  } catch (error) {
    console.error('User stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



