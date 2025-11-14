import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Test Setup API - Ensures test data exists in database
 * GET /api/test/setup
 * 
 * Creates or returns test category and company IDs for API testing
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure test category exists
    let categoryId: string | null = null
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'test-category')
      .eq('type', 'job')
      .single()

    if (existingCategory) {
      categoryId = existingCategory.id
    } else {
      // Create test category
      const { data: newCategory, error: categoryError } = await supabase
        .from('categories')
        .insert({
          name: 'Test Category',
          slug: 'test-category',
          type: 'job',
          is_active: true
        })
        .select('id')
        .single()

      if (categoryError) {
        console.error('Error creating test category:', categoryError)
        return NextResponse.json({ error: 'Failed to create test category' }, { status: 500 })
      }
      categoryId = newCategory?.id || null
    }

    // Ensure test company exists
    let companyId: string | null = null
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', 'test-tech-company')
      .single()

    if (existingCompany) {
      companyId = existingCompany.id
    } else {
      // Create test company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'Test Tech Company',
          slug: 'test-tech-company',
          is_active: true
        })
        .select('id')
        .single()

      if (companyError) {
        console.error('Error creating test company:', companyError)
        return NextResponse.json({ error: 'Failed to create test company' }, { status: 500 })
      }
      companyId = newCompany?.id || null
    }

    if (!categoryId || !companyId) {
      return NextResponse.json({ error: 'Failed to setup test data' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      test_data: {
        category_id: categoryId,
        company_id: companyId
      }
    })
  } catch (error) {
    console.error('Test setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

