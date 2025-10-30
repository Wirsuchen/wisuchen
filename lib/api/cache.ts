// Simple in-memory TTL cache for server runtime
// Not suitable for multi-instance production; use Redis for that case.

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  const expiresAt = Date.now() + ttlSeconds * 1000
  store.set(key, { value, expiresAt })
}

export function cacheDel(key: string): void {
  store.delete(key)
}

export function cacheWrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const cached = cacheGet<T>(key)
  if (cached !== undefined) return Promise.resolve(cached)
  return loader().then((value) => {
    cacheSet(key, value, ttlSeconds)
    return value
  })
}



