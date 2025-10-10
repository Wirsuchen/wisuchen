import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/categories?type=job|affiliate|blog&search=...&limit=...
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const type = searchParams.get('type') // 'job' | 'affiliate' | 'blog' | null
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('categories')
      .select('id, name, slug, type')
      .eq('is_active', true)
      .order('name')
      .limit(limit)

    if (type) {
      query = query.eq('type', type)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
