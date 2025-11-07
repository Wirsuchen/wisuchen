import { API_CONFIG, CACHE_CONFIG } from '@/lib/config/api-keys'
import { cacheWrap } from '@/lib/api/cache'
import { fetchWithRetry } from '@/lib/api/http'
import type { ExternalJob } from './adzuna'

/**
 * Active Jobs DB API Client
 * RapidAPI: https://rapidapi.com/letscrape-6bRBa3QguO5/api/active-jobs-db
 * Returns recent jobs from ATS systems (SmartRecruiters, Paylocity, etc.)
 */

type ActiveJobsDbItem = {
  id: string
  date_posted: string
  date_created: string
  title: string
  organization: string
  organization_url: string | null
  date_validthrough: string | null
  locations_raw: Array<{
    '@type'?: string
    address?: {
      '@type'?: string
      streetAddress?: string
      addressLocality?: string
      addressRegion?: string
      postalCode?: string
      addressCountry?: string
    }
  }>
  location_type: string | null
  location_requirements_raw: any | null
  salary_raw: string | null
  employment_type: string[] | null
  url: string
  source_type: string
  source: string
  source_domain: string
  organization_logo: string | null
  cities_derived: string[] | null
  regions_derived: string[] | null
  countries_derived: string[] | null
  locations_derived: string[] | null
  timezones_derived: string[] | null
  lats_derived: number[] | null
  lngs_derived: number[] | null
  remote_derived: boolean
}

export type ActiveJobsDbSearchParams = {
  limit?: number
  offset?: number
  title_filter?: string
  location_filter?: string
  description_type?: 'text' | 'html'
  country?: 'de' | 'at' | 'ch' | 'gb' | 'us' | 'fr' | 'nl' | 'pl' | 'it' | 'es' | 'se' | 'dk' | 'fi' | 'be' | 'no' | 'cz'
}

function buildActiveJobsDbUrl(params: ActiveJobsDbSearchParams): string {
  const base = 'https://active-jobs-db.p.rapidapi.com/active-ats-7d'
  const sp = new URLSearchParams()
  
  sp.set('limit', String(params.limit ?? 20))
  sp.set('offset', String(params.offset ?? 0))
  
  if (params.title_filter) {
    sp.set('title_filter', params.title_filter)
  }
  
  if (params.location_filter) {
    sp.set('location_filter', params.location_filter)
  }
  
  sp.set('description_type', params.description_type ?? 'text')
  
  return `${base}?${sp.toString()}`
}

function parseSalary(salaryRaw: string | null): { min: number | null; max: number | null } {
  if (!salaryRaw) return { min: null, max: null }
  
  try {
    const parsed = JSON.parse(salaryRaw)
    if (parsed?.value) {
      return {
        min: parsed.value.minValue ?? null,
        max: parsed.value.maxValue ?? null
      }
    }
  } catch {
    // Ignore parsing errors
  }
  
  return { min: null, max: null }
}

function normalizeActiveJobsDbItem(item: ActiveJobsDbItem, targetCountry?: string): ExternalJob | null {
  // Filter by target country if specified
  if (targetCountry && item.countries_derived) {
    const countryMap: Record<string, string[]> = {
      'de': ['Germany', 'Deutschland'],
      'at': ['Austria', 'Österreich'],
      'ch': ['Switzerland', 'Schweiz', 'Suisse'],
      'gb': ['United Kingdom', 'UK', 'Great Britain'],
      'us': ['United States', 'USA'],
    }
    
    const targetCountries = countryMap[targetCountry] || []
    const hasMatchingCountry = item.countries_derived.some(country => 
      targetCountries.some(target => country.toLowerCase().includes(target.toLowerCase()))
    )
    
    if (!hasMatchingCountry) {
      return null // Skip jobs from other countries
    }
  }
  
  const location = item.locations_derived?.[0] || item.regions_derived?.[0] || null
  const salary = parseSalary(item.salary_raw)
  const employment_type = item.employment_type?.[0] || null
  
  return {
    id: `active-jobs:${item.id}`,
    external_id: item.id,
    title: item.title,
    location,
    company: item.organization ? { 
      name: item.organization, 
      logo_url: item.organization_logo, 
      is_verified: false 
    } : null,
    salary_min: salary.min,
    salary_max: salary.max,
    salary_currency: 'USD', // Active Jobs DB returns USD by default
    salary_period: 'yearly',
    employment_type,
    short_description: `${item.title} at ${item.organization}. Source: ${item.source}`,
    published_at: item.date_posted || item.date_created,
    application_url: item.url,
    source: `active-jobs-${item.source}`,
    is_external: true,
  }
}

export async function searchActiveJobsDb(params: ActiveJobsDbSearchParams): Promise<ExternalJob[]> {
  if (!API_CONFIG.rapidApi.enabled || !API_CONFIG.rapidApi.key) {
    console.warn('[Active Jobs DB] API disabled or key missing')
    return []
  }

  const url = buildActiveJobsDbUrl(params)
  const cacheKey = `active-jobs:${url}`

  return cacheWrap<ExternalJob[]>(cacheKey, CACHE_CONFIG.jobs.ttl, async () => {
    try {
      const res = await fetchWithRetry(url, { 
        timeoutMs: API_CONFIG.rapidApi.timeout,
        headers: {
          'x-rapidapi-key': API_CONFIG.rapidApi.key,
          'x-rapidapi-host': 'active-jobs-db.p.rapidapi.com',
        }
      })
      
      if (!res.ok) {
        console.error(`[Active Jobs DB] API error: ${res.status} ${res.statusText}`)
        return []
      }
      
      const items: ActiveJobsDbItem[] = await res.json().catch(() => [])
      
      if (!Array.isArray(items)) {
        console.error('[Active Jobs DB] Invalid response format')
        return []
      }
      
      // Filter and normalize items
      const normalized = items
        .map((i) => normalizeActiveJobsDbItem(i, params.country))
        .filter((job): job is ExternalJob => job !== null)
      
      console.log(`[Active Jobs DB] Fetched ${normalized.length} jobs from ${items.length} total`)
      return normalized
    } catch (error) {
      console.error('[Active Jobs DB] Error fetching jobs:', error)
      return []
    }
  })
}
