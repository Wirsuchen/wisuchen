/**
 * Cache utility with multiple storage backends
 * Supports in-memory cache and Redis for production
 */

import { CACHE_CONFIG } from '@/lib/config/api-keys'
import { logger } from './logger'

// Re-export CACHE_CONFIG for convenience
export { CACHE_CONFIG }

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Tags for cache invalidation
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
  tags: string[]
}

/**
 * In-memory cache implementation
 * Used for development and as fallback
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.value as T
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 3600
    const expiresAt = Date.now() + ttl * 1000

    this.cache.set(key, {
      value,
      expiresAt,
      tags: options.tags || []
    })

    this.stats.sets++
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
    this.stats.deletes++
  }

  async deleteByTag(tag: string): Promise<number> {
    let count = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key)
        count++
      }
    }

    logger.info('Cache invalidated by tag', { tag, count })
    return count
  }

  async clear(): Promise<void> {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 }
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : '0'

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`
    }
  }

  // Periodic cleanup of expired entries
  private cleanupInterval?: NodeJS.Timeout

  startCleanup(intervalMs = 60000) {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      let cleaned = 0

      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt < now) {
          this.cache.delete(key)
          cleaned++
        }
      }

      if (cleaned > 0) {
        logger.debug('Cache cleanup completed', { cleaned })
      }
    }, intervalMs)
  }

  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
  }
}

/**
 * Redis cache implementation (for production)
 */
class RedisCache {
  private client: any = null
  private connected = false

  async connect() {
    if (this.connected) return

    try {
      // Dynamically import Redis only if needed
      const redis = await import('redis').catch(() => null)
      
      if (!redis) {
        console.warn('⚠️ Redis module not installed. Using memory cache only.')
        return
      }
      
      const { createClient } = redis
      
      this.client = createClient({
        url: CACHE_CONFIG.redis.url,
        password: CACHE_CONFIG.redis.password
      })

      this.client.on('error', (err: any) => {
        logger.error('Redis error', { error: err.message })
      })

      await this.client.connect()
      this.connected = true
      logger.info('Redis cache connected')
    } catch (error: any) {
      console.warn('⚠️ Redis connection failed, using memory cache:', error.message)
      // Don't throw - just use memory cache as fallback
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) return null

    try {
      const data = await this.client.get(key)
      return data ? JSON.parse(data) : null
    } catch (error: any) {
      logger.error('Redis get error', { key, error: error.message })
      return null
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    if (!this.connected) return

    try {
      const ttl = options.ttl || 3600
      const data = JSON.stringify(value)
      
      await this.client.setEx(key, ttl, data)

      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await this.client.sAdd(`tag:${tag}`, key)
          await this.client.expire(`tag:${tag}`, ttl)
        }
      }
    } catch (error: any) {
      logger.error('Redis set error', { key, error: error.message })
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.connected) return

    try {
      await this.client.del(key)
    } catch (error: any) {
      logger.error('Redis delete error', { key, error: error.message })
    }
  }

  async deleteByTag(tag: string): Promise<number> {
    if (!this.connected) return 0

    try {
      const keys = await this.client.sMembers(`tag:${tag}`)
      
      if (keys.length > 0) {
        await this.client.del(keys)
      }
      
      await this.client.del(`tag:${tag}`)
      
      logger.info('Redis cache invalidated by tag', { tag, count: keys.length })
      return keys.length
    } catch (error: any) {
      logger.error('Redis deleteByTag error', { tag, error: error.message })
      return 0
    }
  }

  async clear(): Promise<void> {
    if (!this.connected) return

    try {
      await this.client.flushDb()
    } catch (error: any) {
      logger.error('Redis clear error', { error: error.message })
    }
  }

  async disconnect() {
    if (this.connected && this.client) {
      await this.client.quit()
      this.connected = false
    }
  }
}

/**
 * Unified cache interface
 * Automatically uses Redis if available, falls back to memory
 */
class Cache {
  private memory: MemoryCache
  private redis?: RedisCache
  private backend: 'memory' | 'redis' = 'memory'

  constructor() {
    this.memory = new MemoryCache()
    this.memory.startCleanup()

    // Initialize Redis if configured
    if (CACHE_CONFIG.redis.enabled) {
      this.redis = new RedisCache()
      this.redis.connect()
        .then(() => {
          this.backend = 'redis'
          logger.info('Cache backend: Redis')
        })
        .catch(() => {
          logger.warn('Failed to connect to Redis, using memory cache')
        })
    }
  }

  private getBackend() {
    return this.backend === 'redis' && this.redis ? this.redis : this.memory
  }

  async get<T>(key: string): Promise<T | null> {
    return this.getBackend().get<T>(key)
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    return this.getBackend().set(key, value, options)
  }

  async delete(key: string): Promise<void> {
    return this.getBackend().delete(key)
  }

  async deleteByTag(tag: string): Promise<number> {
    return this.getBackend().deleteByTag(tag)
  }

  async clear(): Promise<void> {
    return this.getBackend().clear()
  }

  getStats() {
    return {
      backend: this.backend,
      stats: this.memory.getStats()
    }
  }

  /**
   * Wrap a function with caching
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Check cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      logger.debug('Cache hit', { key })
      return cached
    }

    logger.debug('Cache miss', { key })

    // Execute function
    const result = await fn()

    // Store in cache
    await this.set(key, result, options)

    return result
  }
}

/**
 * Global cache instance
 */
export const cache = new Cache()

/**
 * Helper functions for common cache patterns
 */
export const CacheKeys = {
  job: (id: string) => `job:${id}`,
  jobs: (params: string) => `jobs:${params}`,
  affiliate: (id: string) => `affiliate:${id}`,
  affiliates: (params: string) => `affiliates:${params}`,
  statistics: (type: string, period: string) => `stats:${type}:${period}`,
}

/**
 * Decorator to automatically cache method results
 * 
 * @example
 * ```typescript
 * class API {
 *   @Cached('jobs', { ttl: 3600 })
 *   async getJobs() {
 *     // ...
 *   }
 * }
 * ```
 */
export function Cached(prefix: string, options?: CacheOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // Generate cache key from method arguments
      const argsKey = JSON.stringify(args)
      const cacheKey = `${prefix}:${propertyKey}:${argsKey}`

      return cache.wrap(
        cacheKey,
        () => originalMethod.apply(this, args),
        options
      )
    }

    return descriptor
  }
}
