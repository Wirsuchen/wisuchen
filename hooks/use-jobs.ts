/**
 * Custom hook for fetching and managing jobs
 * Provides loading states, error handling, and automatic retries
 * Uses client-side cache to prevent unnecessary API calls on route changes
 */

import { useState, useEffect, useCallback } from 'react'
import { fetchWithCache } from '@/lib/utils/client-cache'

export interface Job {
  id: string
  title: string
  description: string
  company: string
  location: string
  salary?: {
    min?: number
    max?: number
    currency?: string
    text?: string
  }
  employmentType?: string
  experienceLevel?: string
  skills?: string[]
  applicationUrl?: string
  source: string
  publishedAt: string
  externalId: string
}

export interface SearchJobsParams {
  query?: string
  location?: string
  employmentType?: string
  experienceLevel?: string
  salaryMin?: number
  salaryMax?: number
  page?: number
  limit?: number
  sources?: string[]
  useCache?: boolean
  includeRemote?: boolean
  radiusKm?: number
  countries?: string[]
  postcodes?: string[]
  locale?: string // Language for translations (en, de, fr, it)
}

interface JobsResponse {
  jobs: Job[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  meta: {
    sources: Record<string, number>
    cached: boolean
    timestamp: string
  }
}

interface UseJobsReturn {
  jobs: Job[]
  pagination: JobsResponse['pagination'] | null
  meta: JobsResponse['meta'] | null
  loading: boolean
  error: string | null
  search: (params: SearchJobsParams) => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Hook to search and fetch jobs
 */
export function useJobs(initialParams?: SearchJobsParams): UseJobsReturn {
  const [jobs, setJobs] = useState<Job[]>([])
  const [pagination, setPagination] = useState<JobsResponse['pagination'] | null>(null)
  const [meta, setMeta] = useState<JobsResponse['meta'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastParams, setLastParams] = useState<SearchJobsParams | undefined>(initialParams)

  const search = useCallback(async (params: SearchJobsParams) => {
    setLoading(true)
    setError(null)
    setLastParams(params)

    try {
      // Build query string
      const queryParams = new URLSearchParams()
      
      if (params.query) queryParams.append('query', params.query)
      if (params.location) queryParams.append('location', params.location)
      if (params.employmentType) queryParams.append('employmentType', params.employmentType)
      if (params.experienceLevel) queryParams.append('experienceLevel', params.experienceLevel)
      if (params.salaryMin) queryParams.append('salaryMin', params.salaryMin.toString())
      if (params.salaryMax) queryParams.append('salaryMax', params.salaryMax.toString())
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.sources?.length) queryParams.append('sources', params.sources.join(','))
      if (params.useCache !== undefined) queryParams.append('useCache', params.useCache.toString())
      if (params.includeRemote !== undefined) queryParams.append('includeRemote', params.includeRemote ? 'true' : 'false')
      if (params.radiusKm) queryParams.append('radiusKm', params.radiusKm.toString())
      if (params.countries?.length) queryParams.append('countries', params.countries.join(','))
      if (params.postcodes?.length) queryParams.append('postcodes', params.postcodes.join(','))
      if (params.locale) queryParams.append('locale', params.locale) // Language for translations

      const url = `/api/v1/jobs/search?${queryParams.toString()}`
      
      // Use cache with 1 hour TTL - prevents API calls on route changes/refreshes
      const data = await fetchWithCache<any>(url, undefined, params, 60 * 60 * 1000)

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch jobs')
      }

      setJobs(data.data.jobs)
      setPagination(data.data.pagination)
      setMeta(data.data.meta)
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while fetching jobs'
      setError(errorMessage)
      console.error('Jobs fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (lastParams) {
      await search(lastParams)
    }
  }, [lastParams, search])

  // Auto-fetch on mount if initial params provided
  useEffect(() => {
    if (initialParams) {
      search(initialParams)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    jobs,
    pagination,
    meta,
    loading,
    error,
    search,
    refresh
  }
}

/**
 * Hook to fetch a single job by ID
 */
export function useJob(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) {
      setJob(null)
      return
    }

    const fetchJob = async () => {
      setLoading(true)
      setError(null)

      try {
        const url = `/api/v1/jobs/${jobId}`
        
        // Use cache with 1 hour TTL
        const data = await fetchWithCache<any>(url, undefined, { jobId }, 60 * 60 * 1000)

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch job')
        }

        setJob(data.data)
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching job')
        console.error('Job fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId])

  return { job, loading, error }
}
