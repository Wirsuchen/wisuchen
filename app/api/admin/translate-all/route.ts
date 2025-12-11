/**
 * Admin Bulk Translate API
 * 
 * Translates all existing jobs, deals, and blog posts to all supported languages.
 * Uses Gemini AI with structured output for reliable translations.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  translateBatchWithGemini,
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
      limit = 10,   // Max items per type (reduced to avoid rate limits)
      delayMs = 2000 // Delay between translations (increased to 2 seconds)
    } = body
    
    const supabase = await createClient()
    const results: Record<string, { success: number; failed: number; skipped: number; total: number }> = {}
    
    // Translate Jobs (both database and external API jobs)
    if (type === 'all' || type === 'job') {
      let allJobs: Array<{ id: string; title: string; description: string; source: string }> = []
      
      // Get jobs from offers table (user posted jobs)
      const { data: dbJobs } = await (supabase as any)
        .from('offers')
        .select('id, title, description')
        .eq('type', 'job')
        .limit(limit)
      
      if (dbJobs) {
        allJobs = dbJobs.map((job: any) => ({
          id: job.id,
          title: job.title || '',
          description: job.description || '',
          source: 'db'
        }))
      }
      
      // Fetch external jobs from the Jobs API (same as website)
      try {
        const jobsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/jobs?limit=${limit}&include_external=true`, {
          headers: { 'Content-Type': 'application/json' }
        })
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json()
          const externalJobs = (jobsData.jobs || []).map((j: any) => ({
            id: j.id,
            title: j.title || '',
            description: (j.description || '').substring(0, 1000),
            source: j.source || 'api'
          }))
          allJobs = [...allJobs, ...externalJobs]
        }
      } catch (e) {
        console.error('Failed to fetch external jobs for translation:', e)
      }
      
      if (allJobs.length > 0) {
        const items = allJobs.map(job => ({
          id: `job-${job.source}-${job.id}`,
          title: job.title,
          description: job.description
        }))
        
        const result = await translateBatchWithGemini(
          items,
          'job' as ContentType,
          delayMs
        )
        
        results.jobs = { ...result, total: allJobs.length }
      } else {
        results.jobs = { success: 0, failed: 0, skipped: 0, total: 0 }
      }
    }
    
    // Translate Deals from external API
    if (type === 'all' || type === 'deal') {
      let allDeals: Array<{ id: string; title: string; description: string; source: string }> = []
      
      // Fetch deals from the Deals API
      try {
        const dealsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/deals?limit=${limit}`, {
          headers: { 'Content-Type': 'application/json' }
        })
        if (dealsRes.ok) {
          const dealsData = await dealsRes.json()
          allDeals = (dealsData.deals || []).map((d: any) => ({
            id: d.id,
            title: d.title || '',
            description: (d.description || '').substring(0, 500),
            source: d.source || 'api'
          }))
        }
      } catch (e) {
        console.error('Failed to fetch deals for translation:', e)
      }
      
      if (allDeals.length > 0) {
        const items = allDeals.map(deal => ({
          id: `deal-${deal.source}-${deal.id}`,
          title: deal.title,
          description: deal.description
        }))
        
        const result = await translateBatchWithGemini(
          items,
          'deal' as ContentType,
          delayMs
        )
        
        results.deals = { ...result, total: allDeals.length }
      } else {
        results.deals = { success: 0, failed: 0, skipped: 0, total: 0 }
      }
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
          id: `blog-db-${post.id}`,
          title: post.title || '',
          description: (post.excerpt || post.content || '').substring(0, 2000)
        }))
        
        const result = await translateBatchWithGemini(
          items,
          'blog' as ContentType,
          delayMs
        )
        
        results.blogs = { ...result, total: posts.length }
      } else {
        results.blogs = { success: 0, failed: 0, skipped: 0, total: 0 }
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

// GET - Check translation status with detailed content list
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }
    
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'
    
    // Count translations by type
    const { data: stats } = await (supabase as any)
      .from('translations')
      .select('type, language, content_id')
    
    const summary: Record<string, Record<string, number>> = {}
    const translatedIds: Set<string> = new Set()
    
    if (stats) {
      for (const row of stats) {
        if (!summary[row.type]) {
          summary[row.type] = {}
        }
        summary[row.type][row.language] = (summary[row.type][row.language] || 0) + 1
        translatedIds.add(`${row.content_id}-${row.language}`)
      }
    }
    
    // Count total content
    const { count: jobCount } = await (supabase as any)
      .from('ad_listings')
      .select('*', { count: 'exact', head: true })
    
    const { count: blogCount } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
    
    // If detailed view requested, fetch actual content with translation status
    let contentDetails = null
    if (detailed) {
      // Get user jobs from ad_listings (database)
      const { data: userJobs } = await (supabase as any)
        .from('ad_listings')
        .select('id, title')
        .limit(50)
      
      // Get blogs from database
      const { data: blogs } = await supabase
        .from('blog_posts')
        .select('id, title')
        .eq('status', 'published')
        .limit(50)
      
      // Fetch external jobs from the Jobs API (same as website)
      let externalJobs: any[] = []
      try {
        const jobsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/jobs?limit=30&include_external=true`, {
          headers: { 'Content-Type': 'application/json' }
        })
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json()
          externalJobs = (jobsData.jobs || []).map((j: any) => ({
            id: j.id,
            title: j.title,
            source: j.source || 'database'
          }))
        }
      } catch (e) {
        console.error('Failed to fetch external jobs:', e)
      }
      
      // Fetch deals from the Deals API (same as website)
      let externalDeals: any[] = []
      try {
        const dealsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/deals?limit=30`, {
          headers: { 'Content-Type': 'application/json' }
        })
        if (dealsRes.ok) {
          const dealsData = await dealsRes.json()
          externalDeals = (dealsData.deals || []).map((d: any) => ({
            id: d.id,
            title: d.title,
            source: d.source || 'api'
          }))
        }
      } catch (e) {
        console.error('Failed to fetch external deals:', e)
      }
      
      const languages = ['de', 'fr', 'it']
      
      // Map content with translation status
      const mapWithStatus = (items: any[], type: string, prefix: string) => {
        if (!items) return []
        return items.map(item => {
          const translationStatus: Record<string, boolean> = {}
          const contentId = `${prefix}-${item.source || 'db'}-${item.id}`
          
          for (const lang of languages) {
            translationStatus[lang] = translatedIds.has(`${contentId}-${lang}`)
          }
          
          return {
            id: item.id,
            title: (item.title || '').substring(0, 60) + ((item.title || '').length > 60 ? '...' : ''),
            source: item.source || 'database',
            translations: translationStatus,
            fullyTranslated: languages.every(l => translationStatus[l])
          }
        })
      }
      
      contentDetails = {
        userJobs: mapWithStatus(userJobs || [], 'job', 'job'),
        externalJobs: mapWithStatus(externalJobs, 'job', 'job'),
        blogs: mapWithStatus(blogs || [], 'blog', 'blog'),
        deals: mapWithStatus(externalDeals, 'deal', 'deal')
      }
    }
    
    return NextResponse.json({
      status: 'ok',
      translations: summary,
      content: {
        jobs: jobCount || 0,
        blogs: blogCount || 0
      },
      languages: ['de', 'fr', 'it'],
      details: contentDetails
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
