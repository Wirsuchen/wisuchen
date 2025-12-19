/**
 * Smart Background Translation Service for Deals
 * 
 * Same features as translate-jobs:
 * - Respects free API limits
 * - Handles 429 errors gracefully
 * - Uses exponential backoff
 * - Tracks daily usage
 * - Proper timing gaps
 * 
 * Usage: GET /api/cron/translate-deals?secret=YOUR_CRON_SECRET
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { storeTranslation, getStoredTranslation, ContentType, SupportedLanguage } from '@/lib/services/translation-service'
import { translateText } from '@/lib/services/lingva-translate'

const TARGET_LANGUAGES: SupportedLanguage[] = ['de', 'fr', 'it']

const CONFIG = {
  MAX_TRANSLATIONS_PER_RUN: 10,
  BASE_DELAY_MS: 4000,
  MAX_DELAY_MS: 60000,
  MAX_RETRIES: 3,
  MAX_CONSECUTIVE_ERRORS: 3,
  DAILY_LIMIT: 100,
}

let dailyUsage = {
  count: 0,
  date: new Date().toISOString().split('T')[0]
}

function resetDailyUsageIfNeeded() {
  const today = new Date().toISOString().split('T')[0]
  if (dailyUsage.date !== today) {
    console.log(`[Cron Deals] Resetting daily usage. Previous: ${dailyUsage.count}`)
    dailyUsage = { count: 0, date: today }
  }
}

function canMakeRequest(): boolean {
  resetDailyUsageIfNeeded()
  return dailyUsage.count < CONFIG.DAILY_LIMIT
}

function incrementUsage() {
  dailyUsage.count++
}

async function smartDelay(attempt: number, baseDelay: number): Promise<void> {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), CONFIG.MAX_DELAY_MS)
  console.log(`[Cron Deals] Waiting ${delay}ms...`)
  await new Promise(resolve => setTimeout(resolve, delay))
}

async function translateWithRetry(
  text: string,
  targetLang: SupportedLanguage,
  sourceLang: string = 'en'
): Promise<{ translation: string | null; rateLimited: boolean }> {
  
  for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
    try {
      if (!canMakeRequest()) {
        return { translation: null, rateLimited: true }
      }
      
      const result = await translateText(text, targetLang, sourceLang)
      incrementUsage()
      
      return { translation: result.translation, rateLimited: false }
      
    } catch (error: any) {
      const statusCode = error?.status || error?.response?.status || 0
      const errorMessage = error?.message || ''
      
      if (statusCode === 429 || errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
        console.log(`[Cron Deals] Rate limit hit. Attempt ${attempt + 1}/${CONFIG.MAX_RETRIES}`)
        
        if (attempt < CONFIG.MAX_RETRIES - 1) {
          await smartDelay(attempt + 1, CONFIG.BASE_DELAY_MS * 2)
          continue
        }
        
        return { translation: null, rateLimited: true }
      }
      
      throw error
    }
  }
  
  return { translation: null, rateLimited: false }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const url = new URL(request.url)
    const secret = url.searchParams.get('secret')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    resetDailyUsageIfNeeded()
    if (!canMakeRequest()) {
      return NextResponse.json({
        message: 'Daily limit reached',
        dailyUsage: dailyUsage.count,
        dailyLimit: CONFIG.DAILY_LIMIT
      })
    }

    const supabase = await createClient()
    
    // Get deals that need translation
    const { data: deals, error } = await supabase
      .from('offers')
      .select('id, title, description, source, created_at')
      .eq('type', 'deal')
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })
      .limit(CONFIG.MAX_TRANSLATIONS_PER_RUN * 3)

    if (error) {
      console.error('[Cron Deals] Error fetching deals:', error)
      return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
    }

    if (!deals || deals.length === 0) {
      return NextResponse.json({ message: 'No deals found', processed: 0 })
    }

    console.log(`[Cron Deals] Checking ${deals.length} deals...`)

    let translated = 0
    let skipped = 0
    let failed = 0
    let rateLimited = false
    let consecutiveErrors = 0

    for (const deal of deals) {
      if (rateLimited || consecutiveErrors >= CONFIG.MAX_CONSECUTIVE_ERRORS) break
      if (translated >= CONFIG.MAX_TRANSLATIONS_PER_RUN || !canMakeRequest()) break

      const source = deal.source || 'db'
      const contentId = `deal-${source}-${deal.id}`

      for (const lang of TARGET_LANGUAGES) {
        if (rateLimited || !canMakeRequest()) break

        try {
          const existingTranslation = await getStoredTranslation(contentId, lang, 'deal' as ContentType)
          
          if (existingTranslation) {
            skipped++
            continue
          }

          console.log(`[Cron Deals] Translating deal ${deal.id} to ${lang}...`)

          const titleResult = await translateWithRetry(deal.title || '', lang, 'en')
          if (titleResult.rateLimited) {
            rateLimited = true
            break
          }

          await smartDelay(0, CONFIG.BASE_DELAY_MS)

          const descResult = await translateWithRetry(
            (deal.description || '').substring(0, 1500), 
            lang, 
            'en'
          )
          if (descResult.rateLimited) {
            rateLimited = true
            break
          }

          const stored = await storeTranslation(contentId, lang, 'deal', {
            title: titleResult.translation || deal.title,
            description: descResult.translation || deal.description
          })

          if (stored) {
            translated++
            consecutiveErrors = 0
            console.log(`[Cron Deals] ✓ Translated deal ${deal.id} to ${lang}`)
          } else {
            failed++
            consecutiveErrors++
          }

          await smartDelay(0, CONFIG.BASE_DELAY_MS)

        } catch (err) {
          failed++
          consecutiveErrors++
          console.error(`[Cron Deals] ✗ Failed:`, err)
        }
      }
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      message: rateLimited ? 'Stopped due to rate limit' : 'Completed',
      duration: `${(duration / 1000).toFixed(1)}s`,
      translated,
      skipped,
      failed,
      rateLimited,
      dailyUsage: dailyUsage.count,
      remainingToday: CONFIG.DAILY_LIMIT - dailyUsage.count
    })

  } catch (error) {
    console.error('[Cron Deals] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
