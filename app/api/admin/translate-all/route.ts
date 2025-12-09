/**
 * Admin Bulk Translate API
 * 
 * Translates all existing jobs, deals, and blog posts to all supported languages.
 * Uses small batches with delays to avoid rate limiting.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  translateBatchWithDelay, 
  SupportedLanguage,
  ContentType 
} from '@/lib/services/translation-service'

// Only allow admins
async function checkAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { authorized: false, error: 'Unauthorized' }
  }
  
  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (!profile || !['admin', 'supervisor'].includes(profile.role)) {
    return { authorized: false, error: 'Not authorized - admin only' }
  }
  
  return { authorized: true, user }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const auth = await checkAuth()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }
    
    const body = await request.json().catch(() => ({}))
    const { 
      type = 'all', // 'job', 'deal', 'blog', or 'all'
      limit = 50,   // Max items per type
      delayMs = 500 // Delay between translations
    } = body
    
    const supabase = await createClient()
    const results: Record<string, { success: number; failed: number; total: number }> = {}
    
    // Translate Jobs
    if (type === 'all' || type === 'job') {
      // Get jobs from ad_listings (user posted jobs)
      const { data: jobs } = await supabase
        .from('ad_listings')
        .select('id, title, description')
        .limit(limit)
      
      if (jobs && jobs.length > 0) {
        const items = jobs.map(job => ({
          id: `job-${job.id}`,
          fields: {
            title: job.title || '',
            description: job.description || ''
          }
        }))
        
        const result = await translateBatchWithDelay(
          items,
          'job' as ContentType,
          ['de', 'fr', 'it'] as SupportedLanguage[],
          delayMs
        )
        
        results.jobs = { ...result, total: jobs.length }
      } else {
        results.jobs = { success: 0, failed: 0, total: 0 }
      }
    }
    
    // Translate Deals
    if (type === 'all' || type === 'deal') {
      // Get deals from database or use a deals table if exists
      // For now, we'll skip deals as they come from external API
      // They will be translated on-the-fly when fetched
      results.deals = { success: 0, failed: 0, total: 0, message: 'Deals are translated on fetch' } as any
    }
    
    // Translate Blog Posts
    if (type === 'all' || type === 'blog') {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, content')
        .eq('status', 'published')
        .limit(limit)
      
      if (posts && posts.length > 0) {
        const items = posts.map(post => ({
          id: `blog-${post.id}`,
          fields: {
            title: post.title || '',
            excerpt: post.excerpt || '',
            content: post.content || ''
          }
        }))
        
        const result = await translateBatchWithDelay(
          items,
          'blog' as ContentType,
          ['de', 'fr', 'it'] as SupportedLanguage[],
          delayMs
        )
        
        results.blogs = { ...result, total: posts.length }
      } else {
        results.blogs = { success: 0, failed: 0, total: 0 }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Bulk translation completed',
      results
    })
  } catch (error: any) {
    console.error('Bulk translate error:', error)
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    )
  }
}

// GET - Check translation status
export async function GET() {
  try {
    const auth = await checkAuth()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }
    
    const supabase = await createClient()
    
    // Count translations by type
    const { data: stats } = await supabase
      .from('translations')
      .select('type, language')
    
    const summary: Record<string, Record<string, number>> = {}
    
    if (stats) {
      for (const row of stats) {
        if (!summary[row.type]) {
          summary[row.type] = {}
        }
        summary[row.type][row.language] = (summary[row.type][row.language] || 0) + 1
      }
    }
    
    // Count total content
    const { count: jobCount } = await supabase
      .from('ad_listings')
      .select('*', { count: 'exact', head: true })
    
    const { count: blogCount } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
    
    return NextResponse.json({
      status: 'ok',
      translations: summary,
      content: {
        jobs: jobCount || 0,
        blogs: blogCount || 0
      },
      languages: ['de', 'fr', 'it']
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
