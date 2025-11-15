import { RETRY_CONFIG, LOG_CONFIG } from '@/lib/config/api-keys'

export type HttpOptions = {
  headers?: Record<string, string>
  timeoutMs?: number
}

export async function fetchWithRetry(url: string, options: HttpOptions = {}): Promise<Response> {
  const { timeoutMs = 15000, headers = {} } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let attempt = 0
  let lastError: unknown

  const start = Date.now()

  while (attempt <= RETRY_CONFIG.maxRetries) {
    try {
      const res = await fetch(url, { headers, signal: controller.signal, cache: 'no-store' })

      if (!res.ok && RETRY_CONFIG.retryableStatusCodes.includes(res.status)) {
        throw new Error(`HTTP ${res.status}`)
      }

      if (LOG_CONFIG.enableApiLogs) {
        const latency = Date.now() - start
        // eslint-disable-next-line no-console
        console.info(`[api] ${url} -> ${res.status} in ${latency}ms`)
      }

      clearTimeout(timer)
      return res
    } catch (err: any) {
      lastError = err
      const isAbort = err?.name === 'AbortError'
      const isRetryableError = RETRY_CONFIG.retryableErrors.includes(err?.code) || isAbort

      if (attempt >= RETRY_CONFIG.maxRetries || (!isRetryableError && err?.message?.startsWith('HTTP') === false)) {
        clearTimeout(timer)
        throw err
      }

      const delay = Math.min(
        RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelayMs
      )
      await new Promise((r) => setTimeout(r, delay))
      attempt += 1
    }
  }

  clearTimeout(timer)
  throw lastError
}






