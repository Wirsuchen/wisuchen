/**
 * Cache management utilities for the application
 * Provides helper functions to manage localStorage cache
 */

import { clearAllCache, clearExpiredCache } from './client-cache'

/**
 * Initialize cache manager
 * Automatically clears expired cache on app load
 */
export function initCacheManager() {
  if (typeof window === 'undefined') return

  // Clear expired cache on load
  clearExpiredCache()

  // Set up periodic cleanup (every 5 minutes)
  setInterval(() => {
    clearExpiredCache()
  }, 5 * 60 * 1000)

  console.log('✅ [Cache Manager] Initialized')
}

/**
 * Clear all cached API data
 * Useful for debugging or forcing fresh data
 */
export function clearAllAPICache() {
  clearAllCache()
  window.location.reload()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  if (typeof window === 'undefined') return null

  const stats = {
    totalEntries: 0,
    totalSize: 0,
    entries: [] as Array<{
      key: string
      size: number
      age: string
      expiresIn: string
    }>
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('api_cache_')) continue

      const value = localStorage.getItem(key)
      if (!value) continue

      stats.totalEntries++
      stats.totalSize += value.length

      try {
        const entry = JSON.parse(value)
        const now = Date.now()
        const age = Math.round((now - entry.timestamp) / 1000)
        const expiresIn = Math.max(0, Math.round((entry.expiresAt - now) / 1000))

        stats.entries.push({
          key: key.replace('api_cache_', ''),
          size: value.length,
          age: `${age}s`,
          expiresIn: `${expiresIn}s`
        })
      } catch {
        // Skip corrupted entries
      }
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
  }

  return stats
}

/**
 * Display cache statistics in console
 */
export function logCacheStats() {
  const stats = getCacheStats()
  if (!stats) return

  console.group('📊 Cache Statistics')
  console.log(`Total Entries: ${stats.totalEntries}`)
  console.log(`Total Size: ${(stats.totalSize / 1024).toFixed(2)} KB`)
  console.table(stats.entries)
  console.groupEnd()
}

// Make cache utilities available globally for debugging
if (typeof window !== 'undefined') {
  ;(window as any).cacheManager = {
    clear: clearAllAPICache,
    stats: getCacheStats,
    log: logCacheStats,
    clearExpired: clearExpiredCache
  }
}
