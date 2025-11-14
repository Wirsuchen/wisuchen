import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 190)
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') as 'draft' | 'published' | null
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let query = supabase
      .from('blog_posts')
      .select('id, title, slug, status, views_count, likes_count, published_at, created_at, excerpt, featured_image_url, category:categories(name,slug), author:profiles(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({
      posts: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const title: string = body?.title || ''
    const content: string = body?.content || ''
    const excerpt: string = body?.excerpt || ''
    const status: 'draft' | 'published' = body?.status === 'published' ? 'published' : 'draft'
    const featured_image_url: string | null = body?.featuredImageUrl || null
    const seo_title: string | null = body?.seoTitle || null
    const seo_description: string | null = body?.seoDescription || null
    const seo_keywords_raw: string | string[] | undefined = body?.seoKeywords
    const category_slug: string | undefined = body?.categorySlug

    if (!title || !content) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', auth.user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 })

    let slugBase = slugify(title)
    if (!slugBase) slugBase = `post-${Date.now()}`
    let slug = slugBase
    for (let i = 1; i < 50; i++) {
      const { data: exists } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      if (!exists) break
      slug = `${slugBase}-${i}`
    }

    let category_id: string | null = null
    if (category_slug) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category_slug)
        .eq('type', 'blog')
        .maybeSingle()
      category_id = cat?.id ?? null
    }

    const seo_keywords = Array.isArray(seo_keywords_raw)
      ? seo_keywords_raw.join(', ')
      : typeof seo_keywords_raw === 'string'
      ? seo_keywords_raw
      : null

    const insertPayload: any = {
      title,
      slug,
      excerpt,
      content,
      featured_image_url,
      status,
      category_id,
      author_id: profile.id,
      seo_title,
      seo_description,
      seo_keywords,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(insertPayload)
      .select('id, slug, status')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ id: data.id, slug: data.slug, status: data.status })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
