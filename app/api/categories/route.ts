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
    const hasItems = (searchParams.get('has_items') ?? 'false') === 'true'

    // Narrow category type to allowed values
    const validCategoryTypes = ['job', 'affiliate', 'blog'] as const
    type CategoryType = typeof validCategoryTypes[number]
    const typeFilter: CategoryType | null = validCategoryTypes.includes(type as any) ? (type as CategoryType) : null

    let query = supabase
      .from('categories')
      .select('id, name, slug, type')
      .eq('is_active', true)
      .order('name')
      .limit(limit)

    if (typeFilter) {
      query = query.eq('type', typeFilter as any)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // Optional filter: only categories that have at least one active offer (for job/affiliate types)
    if (hasItems) {
      const supportedTypes = ['job', 'affiliate'] as const
      type OfferType = typeof supportedTypes[number]
      if (typeFilter && supportedTypes.includes(typeFilter as any)) {
        const nowIso = new Date().toISOString()
        const { data: activeOffers, error: offersError } = await supabase
          .from('offers')
          .select('category_id')
          .eq('status', 'active')
          .eq('type', typeFilter as any)
          .not('published_at', 'is', null)
          .lte('published_at', nowIso)
          .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
          .neq('category_id', null)

        if (offersError) {
          console.error('Error fetching active offers for has_items filter:', offersError)
          return NextResponse.json({ error: 'Failed to filter categories' }, { status: 500 })
        }

        const ids = Array.from(new Set((activeOffers || []).map((o: any) => o.category_id).filter(Boolean)))
        if (ids.length === 0) {
          return NextResponse.json({ categories: [] })
        }

        query = query.in('id', ids as any)
      }
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
