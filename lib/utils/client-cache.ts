/**
 * Client-side cache utility using localStorage
 * Stores API responses with 1-hour TTL
 * Prevents unnecessary API calls on route changes or page refreshes
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

const CACHE_PREFIX = 'api_cache_'
const DEFAULT_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Generate a cache key from URL and params
 */
function getCacheKey(url: string, params?: Record<string, any>): string {
  const paramsStr = params ? JSON.stringify(params) : ''
  // Include locale in cache key to prevent cross-language caching
  let locale = 'en'
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/)
    if (match) locale = match[1]
  }
  return `${CACHE_PREFIX}${url}:${paramsStr}:${locale}`
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Get cached data if valid
 */
export function getCache<T>(url: string, params?: Record<string, any>): T | null {
  if (!isLocalStorageAvailable()) return null

  try {
    const key = getCacheKey(url, params)
    const cached = localStorage.getItem(key)
    
    if (!cached) {
      console.log('❌ [Client Cache] Cache MISS for:', url)
      return null
    }

    const entry: CacheEntry<T> = JSON.parse(cached)
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      console.log('⚠️ [Client Cache] Cache EXPIRED for:', url)
      localStorage.removeItem(key)
      return null
    }

    const ageSeconds = Math.round((Date.now() - entry.timestamp) / 1000)
    console.log(`✅ [Client Cache] Cache HIT for: ${url} (Age: ${ageSeconds}s)`)
    return entry.data
  } catch (error) {
    console.error('❌ [Client Cache] Error reading cache:', error)
    return null
  }
}

/**
 * Set cache data with TTL
 */
export function setCache<T>(
  url: string,
  data: T,
  params?: Record<string, any>,
  ttl: number = DEFAULT_TTL
): void {
  if (!isLocalStorageAvailable()) return

  try {
    const key = getCacheKey(url, params)
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    }

    localStorage.setItem(key, JSON.stringify(entry))
    console.log('💾 [Client Cache] Data cached:', { url, params, ttl: ttl / 1000 + 's' })
  } catch (error) {
    console.error('❌ [Client Cache] Error setting cache:', error)
    // If quota exceeded, try to clear old entries
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearExpiredCache()
      // Retry once
      try {
        const key = getCacheKey(url, params)
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl
        }
        localStorage.setItem(key, JSON.stringify(entry))
      } catch {
        console.error('❌ [Client Cache] Still unable to cache after cleanup')
      }
    }
  }
}

/**
 * Clear all expired cache entries
 */
export function clearExpiredCache(): void {
  if (!isLocalStorageAvailable()) return

  try {
    const now = Date.now()
    const keysToRemove: string[] = []

    // Find all expired entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(CACHE_PREFIX)) continue

      try {
        const cached = localStorage.getItem(key)
        if (!cached) continue

        const entry: CacheEntry<any> = JSON.parse(cached)
        if (now > entry.expiresAt) {
          keysToRemove.push(key)
        }
      } catch {
        // Remove corrupted entries
        keysToRemove.push(key)
      }
    }

    // Remove expired entries
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    if (keysToRemove.length > 0) {
      console.log(`🧹 [Client Cache] Cleared ${keysToRemove.length} expired entries`)
    }
  } catch (error) {
    console.error('❌ [Client Cache] Error clearing expired cache:', error)
  }
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  if (!isLocalStorageAvailable()) return

  try {
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log(`🧹 [Client Cache] Cleared all ${keysToRemove.length} cache entries`)
  } catch (error) {
    console.error('❌ [Client Cache] Error clearing cache:', error)
  }
}

/**
 * Invalidate specific cache entry
 */
export function invalidateCache(url: string, params?: Record<string, any>): void {
  if (!isLocalStorageAvailable()) return

  try {
    const key = getCacheKey(url, params)
    localStorage.removeItem(key)
    console.log('🗑️ [Client Cache] Cache invalidated:', { url, params })
  } catch (error) {
    console.error('❌ [Client Cache] Error invalidating cache:', error)
  }
}

/**
 * Fetch with cache wrapper
 * Checks cache first, then falls back to API call
 */
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit,
  params?: Record<string, any>,
  ttl?: number
): Promise<T> {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    throw new Error('fetchWithCache can only be used in browser environment')
  }

  // Try to get from cache first
  const cached = getCache<T>(url, params)
  if (cached !== null) {
    return cached
  }

  // Not in cache or expired, make API call
  console.log('🌐 [Client Cache] Cache MISS, fetching:', { url, params })
  
  try {
    // Automatically append locale to URL if not present
    let fetchUrl = url
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/)
      const locale = match ? match[1] : 'en'
      if (locale && locale !== 'en' && !fetchUrl.includes('locale=')) {
        const separator = fetchUrl.includes('?') ? '&' : '?'
        fetchUrl = `${fetchUrl}${separator}locale=${locale}`
      }
    }

    const response = await fetch(fetchUrl, {
      ...options,
      signal: options?.signal || (typeof AbortController !== 'undefined' ? new AbortController().signal : undefined),
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
    }

    const data = await response.json()
    
    // Validate data before caching
    if (data !== null && data !== undefined) {
      // Cache the response
      setCache(url, data, params, ttl)
    }
    
    return data
  } catch (error: any) {
    // Re-throw with more context
    if (error.name === 'AbortError') {
      throw new Error('Request was aborted')
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach server')
    }
    throw error
  }
}

// Auto-clear expired cache on load
if (typeof window !== 'undefined') {
  clearExpiredCache()
}
