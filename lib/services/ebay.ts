import { cache } from '@/lib/utils/cache'
import { logger } from '@/lib/utils/logger'
import { withRetry } from '@/lib/utils/retry'

const EBAY_TOKEN_CACHE_KEY = 'ebay:oauth:token'

const MARKET_MAP: Record<string, string> = {
  DE: 'EBAY_DE',
  AT: 'EBAY_AT',
  CH: 'EBAY_CH',
}

function getEnv(name: string): string | undefined {
  return process.env[name]
}

async function getAccessToken(): Promise<string | null> {
  const cached = await cache.get<string>(EBAY_TOKEN_CACHE_KEY)
  if (cached) return cached

  const clientId = getEnv('EBAY_CLIENT_ID')
  const clientSecret = getEnv('EBAY_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    logger.warn('eBay credentials missing. Falling back to alternative sources if available.')
    return null
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await withRetry(async () => {
    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'https://api.ebay.com/oauth/api_scope',
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      const err = new Error(`eBay token error: ${response.status} ${response.statusText} ${text}`)
      logger.apiError('ebay', 'oauth2/token', err)
      throw err
    }

    return response.json() as Promise<{ access_token: string; expires_in: number }>
  }, {}, 'ebay', 'oauth2/token')

  const ttl = Math.max(60, Math.floor((res.expires_in || 7200) * 0.9))
  await cache.set(EBAY_TOKEN_CACHE_KEY, res.access_token, { ttl })
  return res.access_token
}

export interface EbaySearchParams {
  q: string
  limit?: number
  sort?: string
  market: 'DE' | 'AT' | 'CH'
  currency?: 'EUR' | 'CHF'
}

export async function searchEbayItems(params: EbaySearchParams) {
  const token = await getAccessToken()
  if (!token) {
    return { items: [], total: 0 }
  }

  const marketplace = MARKET_MAP[params.market] || MARKET_MAP.DE
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.limit) sp.set('limit', String(Math.min(params.limit, 200)))
  if (params.sort) sp.set('sort', params.sort)
  if (params.currency) sp.set('filter', `priceCurrency:${params.currency}`)

  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${sp.toString()}`

  const payload = await withRetry(async () => {
    logger.apiRequest('ebay', 'browse/search', { marketplace, q: params.q })
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': marketplace,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      const err = new Error(`eBay search error: ${response.status} ${response.statusText} ${text}`)
      logger.apiError('ebay', 'browse/search', err)
      throw err
    }

    return response.json()
  }, {}, 'ebay', 'browse/search')

  const items = Array.isArray(payload.itemSummaries) ? payload.itemSummaries : []
  return {
    items: items.map((i: any) => ({
      id: i.itemId,
      title: i.title,
      price: i.price?.value ? Number(i.price.value) : null,
      currency: i.price?.currency,
      image: i.image?.imageUrl || i.thumbnailImages?.[0]?.imageUrl,
      seller: i.seller?.username,
      url: i.itemWebUrl,
    })),
    total: typeof payload.total === 'number' ? payload.total : items.length,
  }
}
