'use client'

import { useEffect } from 'react'
import { initCacheManager } from '@/lib/utils/cache-manager'

/**
 * Client component to initialize cache management
 * Automatically clears expired cache entries
 */
export function CacheInitializer() {
  useEffect(() => {
    initCacheManager()
  }, [])

  return null
}
