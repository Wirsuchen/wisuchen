import { API_CONFIG, CACHE_CONFIG } from '@/lib/config/api-keys'
import { cacheWrap } from '@/lib/api/cache'
import { sanitizeSnippet } from '@/lib/utils/text'
import { fetchWithRetry } from '@/lib/api/http'

type AdzunaItem = {
  id: string
  title: string
  created: string
  redirect_url: string
  company?: { display_name?: string }
  location?: { display_name?: string }
  salary_min?: number
  salary_max?: number
  category?: { label?: string }
  contract_time?: string | null
  contract_type?: string | null
  description?: string
}

export type ExternalJob = {
  id: string
  title: string
  location?: string | null
  company?: { name: string; logo_url?: string | null; is_verified?: boolean } | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
  salary_period?: 'hourly' | 'monthly' | 'yearly' | null
  employment_type?: string | null
  short_description?: string | null
  published_at?: string | null
  application_url?: string | null
  source?: string
  external_id?: string
  is_external?: boolean
}

export type AdzunaSearchParams = {
  country?: 'de' | 'at' | 'ch' | 'gb' | 'fr' | 'nl' | 'pl' | 'it' | 'es' | 'se' | 'dk' | 'fi' | 'be' | 'no' | 'cz'
  what?: string
  where?: string
  postcode?: string
  radiusKm?: number
  page?: number
  resultsPerPage?: number
  remote?: boolean
  language?: 'de' | 'en'
  currency?: 'EUR' | 'CHF' | 'PLN' | 'GBP'
  isTest?: boolean
}

function buildAdzunaUrl(params: AdzunaSearchParams): string {
  const country = params.country || 'de'
  const page = params.page ?? 1
  const results = params.resultsPerPage ?? 20
  const base = `${API_CONFIG.adzuna.baseUrl}/${country}/search/${page}`
  const sp = new URLSearchParams()
  sp.set('app_id', API_CONFIG.adzuna.appId)
  sp.set('app_key', API_CONFIG.adzuna.apiKey)
  sp.set('results_per_page', String(results))
  sp.set('content-type', 'application/json')
  if (params.what) sp.set('what', params.what)
  // Prefer postcode if provided; otherwise where
  if (params.postcode) sp.set('where', params.postcode)
  else if (params.where) sp.set('where', params.where)
  if (params.radiusKm) sp.set('distance', String(params.radiusKm))
  if (params.language) sp.set('what_language', params.language)
  if (params.currency) sp.set('salary_currency', params.currency)
  if (params.remote) sp.set('where', 'remote')
  if (params.isTest) sp.set('what_or', 'developer,sales,nurse,fahrer,remote')
  return `${base}?${sp.toString()}`
}

function normalizeAdzunaItem(item: AdzunaItem, currency: AdzunaSearchParams['currency']): ExternalJob {
  const employment_type = item.contract_time || item.contract_type || null
  // Adzuna dates are ISO strings
  return {
    id: `adzuna:${item.id}`,
    external_id: String(item.id),
    title: item.title,
    location: item.location?.display_name || null,
    company: item.company?.display_name ? { name: item.company.display_name, logo_url: null, is_verified: false } : null,
    salary_min: item.salary_min ?? null,
    salary_max: item.salary_max ?? null,
    salary_currency: currency || 'EUR',
    salary_period: employment_type === 'hourly' ? 'hourly' : 'yearly',
    employment_type,
    short_description: sanitizeSnippet(item.description || ''),
    published_at: item.created || null,
    application_url: item.redirect_url || null,
    source: 'adzuna',
    is_external: true,
  }
}

export async function searchAdzunaJobs(params: AdzunaSearchParams): Promise<ExternalJob[]> {
  if (!API_CONFIG.adzuna.enabled || !API_CONFIG.adzuna.appId || !API_CONFIG.adzuna.apiKey) {
    return []
  }

  const url = buildAdzunaUrl(params)
  const cacheKey = `adzuna:${url}`

  return cacheWrap<ExternalJob[]>(cacheKey, CACHE_CONFIG.jobs.ttl, async () => {
    const res = await fetchWithRetry(url, { timeoutMs: API_CONFIG.adzuna.timeout })
    if (!res.ok) return []
    const data = await res.json().catch(() => null)
    const items: AdzunaItem[] = data?.results || []
    return items.map((i) => normalizeAdzunaItem(i, params.currency))
  })
}





