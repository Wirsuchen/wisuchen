import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { OfferUpdate } from '@/lib/types/database'

// GET /api/jobs/[id] - Get a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { data: job, error } = await supabase
      .from('offers')
      .select(`
        *,
        company:companies(*),
        category:categories(*),
        created_by_profile:profiles!offers_created_by_fkey(*)
      `)
      .eq('id', id)
      .eq('type', 'job')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
      console.error('Error fetching job:', error)
      return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
    }

    // Increment view count
    await supabase
      .from('offers')
      .update({ views_count: (job.views_count || 0) + 1 })
      .eq('id', id)

    // Track impression for analytics
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('impressions')
      .insert({
        offer_id: id,
        user_id: user?.id || null,
        event_type: 'view',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        referrer: request.headers.get('referer'),
        page_url: request.url
      })

    return NextResponse.json({ job })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/jobs/[id] - Update a job
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get existing job to check ownership
    const { data: existingJob, error: fetchError } = await supabase
      .from('offers')
      .select('created_by, status')
      .eq('id', id)
      .eq('type', 'job')
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
    }

    // Check permissions (owner or moderator+)
    const canEdit = existingJob.created_by === profile.id || 
                   ['supervisor', 'admin', 'moderator'].includes(profile.role)

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    
    // Update slug if title changed
    if (body.title) {
      const slug = body.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      body.slug = `${slug}-${Date.now()}`
    }

    // Handle status changes
    if (body.status === 'active' && existingJob.status !== 'active') {
      // Publishing the job
      body.published_at = new Date().toISOString()
    }

    const updateData: OfferUpdate = {
      ...body,
      updated_at: new Date().toISOString()
    }

    const { data: job, error } = await supabase
      .from('offers')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        company:companies(*),
        category:categories(*)
      `)
      .single()

    if (error) {
      console.error('Error updating job:', error)
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only admins can delete jobs (others can archive)
    if (!['supervisor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id)
      .eq('type', 'job')

    if (error) {
      console.error('Error deleting job:', error)
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Job deleted successfully' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
