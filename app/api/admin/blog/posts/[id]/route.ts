import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 190)
}

async function checkAdmin(supabase: any) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return { authorized: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', auth.user.id)
    .single()

  if (!profile || !['supervisor', 'admin', 'moderator', 'editor', 'blogger'].includes(profile.role as string)) {
    return { authorized: false, error: 'Forbidden', profile: null }
  }

  return { authorized: true, profile, user: auth.user }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ post: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const supabase = await createClient()
    
    // Check admin permissions
    const adminCheck = await checkAdmin(supabase)
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.error === 'Unauthorized' ? 401 : 403 })
    }

    // Build update payload
    const payload: any = {}
    
    // Status update
    if (body.status) {
      payload.status = body.status
      payload.published_at = body.status === 'published' ? (body.published_at || new Date().toISOString()) : null
    }
    
    // Full content update
    if (body.title !== undefined) payload.title = body.title
    if (body.content !== undefined) payload.content = body.content
    if (body.excerpt !== undefined) payload.excerpt = body.excerpt
    if (body.featuredImageUrl !== undefined) payload.featured_image_url = body.featuredImageUrl
    if (body.seoTitle !== undefined) payload.seo_title = body.seoTitle
    if (body.seoDescription !== undefined) payload.seo_description = body.seoDescription
    if (body.seoKeywords !== undefined) {
      payload.seo_keywords = Array.isArray(body.seoKeywords) 
        ? body.seoKeywords.join(', ') 
        : body.seoKeywords
    }
    if (body.categorySlug !== undefined) {
      if (body.categorySlug) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', body.categorySlug)
          .eq('type', 'blog')
          .maybeSingle()
        payload.category_id = cat?.id ?? null
      } else {
        payload.category_id = null
      }
    }
    
    // Update slug if title changed
    if (body.title) {
      let slugBase = slugify(body.title)
      if (!slugBase) slugBase = `post-${Date.now()}`
      let slug = slugBase
      for (let i = 1; i < 50; i++) {
        const { data: exists } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('slug', slug)
          .neq('id', params.id)
          .maybeSingle()
        if (!exists) break
        slug = `${slugBase}-${i}`
      }
      payload.slug = slug
    }
    
    // Always update updated_at
    payload.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('blog_posts')
      .update(payload)
      .eq('id', params.id)
      .select('id, slug, status, published_at, title, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ post: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    
    // Check admin permissions
    const adminCheck = await checkAdmin(supabase)
    if (!adminCheck.authorized) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.error === 'Unauthorized' ? 401 : 403 })
    }

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
