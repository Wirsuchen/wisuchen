'use client'

/**
 * Jobs Page - Real Jobs from RapidAPI
 * Fetches live job data from multiple RapidAPI sources
 * Uses database translations when locale is not English
 * Auto-translates any content that's in the wrong language
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useJobs, type Job } from '@/hooks/use-jobs'
import { PageLayout } from '@/components/layout/page-layout'
import { Loader2, Search, MapPin, Briefcase, DollarSign, ExternalLink, Filter, RefreshCw, TrendingUp, Edit, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { useTranslation, useLocale } from '@/contexts/i18n-context'
import { useAutoTranslateContent, useTranslatedText } from '@/hooks/use-auto-translate-content'


const sanitizeJobDescription = (text: string) => {
  if (!text) return ''
  return text
    .replace(/\]init\[/gi, '')
    .replace(/\binit\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const getJobSnippet = (text?: string | null, max: number = 250) => {
  if (!text) return ''
  const cleaned = sanitizeJobDescription(text).replace(/<[^>]*>/g, '')
  return cleaned.substring(0, max)
}

// Function to deduplicate jobs that may come from multiple sources
// Uses a normalized (title + location/company) key and prefers entries
// with richer data (salary text + application URL), similar to homepage logic.
function dedupeJobs(jobs: Job[]): Job[] {
  const normalize = (s?: string | null) =>
    (s || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ') // drop parentheticals like (all genders)
      .replace(/&/g, ' and ')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')

  // Prefer entries with more useful info
  const score = (j: Job) => (j.salary?.text ? 1 : 0) + (j.applicationUrl ? 1 : 0)

  const byKey = new Map<string, Job>()

  for (const job of jobs) {
    const title = normalize(job.title)
    const company = normalize(job.company)
    const location = normalize(job.location)

    // Primary key: title + location; if location missing, fallback to company; if both missing, title only
    const base = location || company || ''
    const key = base ? `${title}|${base}` : title

    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, job)
    } else {
      // keep the richer one
      if (score(job) > score(existing)) {
        byKey.set(key, job)
      }
    }
  }

  return Array.from(byKey.values())
}

interface UserPostedJob {
  id: string
  title: string
  slug: string
  location: string | null
  employment_type: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  status: string
  published_at: string | null
  created_at: string
  description: string | null
  company?: {
    name: string
    logo_url: string | null
  } | null
  category?: {
    name: string
  } | null
  views_count: number
  applications_count: number
}

export default function JobsPage() {
  const searchParams = useSearchParams()
  const urlLocation = searchParams.get('location') || ''
  const urlQuery = searchParams.get('q') || searchParams.get('query') || ''

  const [searchQuery, setSearchQuery] = useState(urlQuery)
  const [location, setLocation] = useState(urlLocation)
  const [employmentType, setEmploymentType] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const { user } = useAuth()
  const [userJobs, setUserJobs] = useState<UserPostedJob[]>([])
  const [loadingUserJobs, setLoadingUserJobs] = useState(false)
  const { t } = useTranslation()
  const locale = useLocale() // Get current language for translations

  // Auto-translate hook for client-side translation fallback
  const { translateJobs, isTranslating: autoTranslating } = useAutoTranslateContent()
  const [translatedJobs, setTranslatedJobs] = useState<Job[]>([])

  const { jobs, loading, error, search, refresh, pagination, meta } = useJobs()

  // Deduplicate jobs to remove duplicates from different sources
  const uniqueJobs = useMemo(() => {
    const deduped = dedupeJobs(jobs)
    if (jobs.length > deduped.length) {
      console.log(`Removed ${jobs.length - deduped.length} duplicate jobs from ${jobs.length} total jobs`)
    }
    return deduped
  }, [jobs])

  // Auto-translate jobs that are in wrong language
  // Use refs to prevent re-running while translation is in progress and track locale
  const isTranslatingJobsRef = useRef(false)
  const lastTranslatedLocaleRef = useRef<string | null>(null)

  useEffect(() => {
    // Reset translation state when locale changes
    if (lastTranslatedLocaleRef.current !== locale) {
      setTranslatedJobs([])
      isTranslatingJobsRef.current = false
    }

    if (uniqueJobs.length > 0 && !loading && !isTranslatingJobsRef.current) {
      isTranslatingJobsRef.current = true
      lastTranslatedLocaleRef.current = locale

      console.log(`[JobsPage] Starting auto-translation for ${uniqueJobs.length} jobs to locale: ${locale}`)

      translateJobs(uniqueJobs).then(translated => {
        console.log(`[JobsPage] Translation complete, ${translated.filter((j, i) => j.title !== uniqueJobs[i]?.title).length} jobs translated`)
        setTranslatedJobs(translated)
        isTranslatingJobsRef.current = false
      }).catch((err) => {
        console.error('[JobsPage] Translation failed:', err)
        isTranslatingJobsRef.current = false
      })
    } else if (uniqueJobs.length === 0) {
      setTranslatedJobs([])
    }
  }, [uniqueJobs, loading, locale, translateJobs])

  // Use translated jobs if available, otherwise use original
  const displayJobs = translatedJobs.length > 0 ? translatedJobs : uniqueJobs

  // Load jobs on mount and when locale changes (to get translated content)
  // Also apply URL parameters on initial load
  useEffect(() => {
    if (!initialLoadDone) {
      // First load - use URL params if available
      if (urlLocation || urlQuery) {
        search({
          query: urlQuery || undefined,
          location: urlLocation || undefined,
          limit: 20,
          page: 1,
          useCache: true,
          locale: locale,
          requireFullTranslation: true
        })
      } else {
        loadJobs()
      }
      setInitialLoadDone(true)
    } else {
      // Subsequent loads (locale change)
      loadJobs()
    }
  }, [locale]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update state when URL params change
  useEffect(() => {
    if (urlLocation !== location) {
      setLocation(urlLocation)
    }
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery)
    }
    // Trigger search if URL params changed after initial load
    if (initialLoadDone && (urlLocation || urlQuery)) {
      search({
        query: urlQuery || undefined,
        location: urlLocation || undefined,
        limit: 20,
        page: 1,
        useCache: true,
        locale: locale,
        requireFullTranslation: true
      })
    }
  }, [urlLocation, urlQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load user's posted jobs with translations based on locale
  const loadUserJobs = useCallback(async () => {
    try {
      setLoadingUserJobs(true)
      const res = await fetch('/api/user/ads?limit=50')
      if (!res.ok) {
        if (res.status === 401) {
          // User not authenticated, skip
          return
        }
        throw new Error('Failed to load your jobs')
      }
      const data = await res.json()

      // Fetch full job details for each job (with locale for translations)
      const jobsWithDetails = await Promise.all(
        (data.ads || []).map(async (ad: any) => {
          try {
            const jobRes = await fetch(`/api/jobs/${ad.id}?locale=${locale}`)
            if (jobRes.ok) {
              const jobData = await jobRes.json()
              return jobData.job || jobData
            }
            return null
          } catch {
            return null
          }
        })
      )

      setUserJobs(jobsWithDetails.filter(Boolean))
    } catch (error) {
      console.error('Error loading user jobs:', error)
    } finally {
      setLoadingUserJobs(false)
    }
  }, [locale])

  // Load user's posted jobs if authenticated
  // Use user?.id instead of user object to prevent refetch on token refresh
  useEffect(() => {
    if (user?.id) {
      loadUserJobs()
    }
  }, [user?.id, loadUserJobs]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadJobs = () => {
    search({
      // Don't specify sources to use all enabled sources
      limit: 20, // 20 jobs per page
      page: 1,
      useCache: true,
      locale: locale, // Pass language for database translations
      requireFullTranslation: true // Only show fully translated jobs
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    search({
      query: searchQuery || undefined,
      location: location || undefined,
      employmentType: employmentType || undefined,
      // Don't specify sources to use all enabled sources
      limit: 20, // 20 jobs per page
      page: 1,
      useCache: false, // Fresh results for searches
      locale: locale, // Pass language for database translations
      requireFullTranslation: true // Only show fully translated jobs
    })
  }

  const handlePageChange = (newPage: number) => {
    search({
      query: searchQuery || undefined,
      location: location || undefined,
      employmentType: employmentType || undefined,
      limit: 20,
      page: newPage,
      locale: locale,
      requireFullTranslation: true
    })
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReset = () => {
    setSearchQuery('')
    setLocation('')
    setEmploymentType('')
    loadJobs()
  }

  return (
    <PageLayout showBackButton={false} containerClassName="container mx-auto px-4 sm:px-6 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-6 pt-8 pb-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">{t('jobs.title')}</h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              {t('jobs.heroSubtitle')}
            </p>
          </div>

          {/* Stats */}
          {meta && !loading && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm px-4">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <Briefcase className="w-3.5 h-3.5 text-gray-600" />
                <span className="font-medium text-gray-700">{(pagination?.total ?? uniqueJobs.length)} {t('nav.jobs')}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <TrendingUp className="w-3.5 h-3.5 text-gray-600" />
                <span className="font-medium text-gray-700">{t('jobs.sourcesCountLabel')}</span>
              </div>
              {meta.cached && (
                <Badge variant="secondary" className="bg-gray-50 text-gray-600 border border-gray-100 font-normal">
                  ✓ {t('jobs.cached')}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* My Posted Jobs Section - Only show if user has posted jobs */}
        {user && userJobs.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                {t('jobs.myPostedJobs')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{t('jobs.myPostedJobsDescription')}</p>
            </div>

            {loadingUserJobs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-900" />
              </div>
            ) : (
              <div className="space-y-3">
                {userJobs.map((job) => (
                  <UserJobCard
                    key={job.id}
                    job={job}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Main Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('jobs.searchPlaceholder')}
                  className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('jobs.locationPlaceholder')}
                  className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">{t('jobs.searching')}</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">{t('common.search')}</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3 border-gray-200 hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-4 border-t space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('jobs.jobType')}
                    </label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('jobs.allTypes')}</option>
                      <option value="full_time">{t('jobs.full_time')}</option>
                      <option value="part_time">{t('jobs.part_time')}</option>
                      <option value="contract">{t('jobs.contract')}</option>
                      <option value="freelance">{t('jobs.freelance')}</option>
                      <option value="internship">{t('jobs.internship')}</option>
                      <option value="temporary">{t('jobs.temporary')}</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="flex-1"
                    >
                      {t('jobs.resetFilters')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        loadJobs()
                        refresh()
                      }}
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-red-600 font-medium">{t('jobs.errorLoading')}</div>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <Button
              onClick={loadJobs}
              variant="outline"
              className="mt-3"
            >
              {t('common.tryAgain')}
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && uniqueJobs.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">{t('jobs.loadingJobs')}</p>
              <p className="text-gray-500 text-sm mt-2">{t('jobs.loadingFromSources')}</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && uniqueJobs.length === 0 && !error && (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('jobs.noJobsFound')}</h3>
            <p className="text-gray-600 mb-4">{t('jobs.tryAdjustingFilters')}</p>
            <Button onClick={handleReset} variant="outline">
              {t('jobs.resetSearch')}
            </Button>
          </div>
        )}

        {/* Jobs List */}
        {displayJobs.length > 0 && (
          <>
            {/* Auto-translate indicator */}
            {autoTranslating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Languages className="h-4 w-4 animate-pulse" />
                <span>{t('common.translating') || 'Translating content...'}</span>
              </div>
            )}
            <div className="space-y-4">
              {displayJobs.map((job) => (
                <JobCard
                  key={`${job.source}-${job.id}`}
                  job={job}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-8">
                <Button
                  onClick={() => {
                    handlePageChange(pagination.page - 1)
                  }}
                  disabled={loading || pagination.page <= 1}
                  variant="outline"
                  size="sm"
                >
                  {t('common.previous')}
                </Button>

                <span className="text-sm font-medium text-gray-600">
                  {t('common.page')} {pagination.page} {t('common.of')} {pagination.totalPages}
                </span>

                <Button
                  onClick={() => {
                    handlePageChange(pagination.page + 1)
                  }}
                  disabled={loading || pagination.page >= pagination.totalPages}
                  variant="outline"
                  size="sm"
                >
                  {t('common.next')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}

/**
 * Job Card Component - Uses translated content from API
 */
interface JobCardProps {
  job: Job
}

function JobCard({ job }: JobCardProps) {
  const { t, tr } = useTranslation()

  // Use client-side auto-translation for title and description
  const { translatedText: title } = useTranslatedText(job.title, 'job')
  const { translatedText: description } = useTranslatedText(job.description || '', 'job')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return t('jobs.time.justNow')
    if (diffInHours < 24) return tr('jobs.time.hoursAgo', { hours: diffInHours })
    if (diffInHours < 48) return t('jobs.time.yesterday')
    if (diffInHours < 168) return tr('jobs.time.daysAgo', { days: Math.floor(diffInHours / 24) })
    return date.toLocaleDateString()
  }

  const onOpenDetails = () => {
    try {
      const key = `job:${job.source}:${job.externalId || job.id}`
      sessionStorage.setItem(key, JSON.stringify({ ...job, title, description }))
    } catch { }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex items-start justify-between gap-2">
            <a
              href={`/jobs/${encodeURIComponent(job.externalId || job.id)}?source=${encodeURIComponent(job.source)}`}
              onClick={onOpenDetails}
              className="block flex-1"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
                <span>{title}</span>
              </h3>
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-600">
            {job.company && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="truncate max-w-[150px] sm:max-w-none font-medium text-gray-700">{job.company}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate max-w-[150px] sm:max-w-none text-gray-600">{job.location}</span>
            </span>
            {job.salary && (job.salary.min || job.salary.max || job.salary.text) && (
              <span className="flex items-center gap-1 text-gray-700 font-medium">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="truncate">{job.salary.text || `€${job.salary.min?.toLocaleString()} - €${job.salary.max?.toLocaleString()}`}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-400 ml-auto sm:ml-0 font-medium">
            {formatDate(job.publishedAt)}
          </span>
        </div>
      </div>

      {description && (
        <div className="relative group">
          <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {getJobSnippet(description)}...
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {job.employmentType && (() => {
            const key = job.employmentType.toLowerCase().replace(/[\s-]+/g, '_').trim()
            const tKey = `jobs.${key}`
            const translated = t(tKey)
            const label = translated && translated !== tKey
              ? translated
              : key.replace(/_/g, ' ')
            return (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
                {label}
              </Badge>
            )
          })()}
          {job.experienceLevel && (() => {
            const key = job.experienceLevel.toLowerCase().replace(/[\s-]+/g, '_').trim()
            const tKey = `jobs.${key}`
            const translated = t(tKey)
            const label = translated && translated !== tKey ? translated : job.experienceLevel
            return (
              <Badge variant="outline" className="text-xs capitalize text-gray-600 border-gray-200">
                {label}
              </Badge>
            )
          })()}
          {job.skills && job.skills.slice(0, 3).map((skill, idx) => (
            <Badge key={idx} variant="outline" className="text-xs text-gray-600 border-gray-200">
              {skill}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button asChild variant="ghost" size="sm" className="flex-1 sm:flex-initial text-gray-600 hover:text-gray-900 hover:bg-gray-100">
            <a
              href={`/jobs/${encodeURIComponent(job.externalId || job.id)}?source=${encodeURIComponent(job.source)}`}
              onClick={onOpenDetails}
              className="flex items-center justify-center gap-2"
            >
              <span className="hidden sm:inline">{t('jobs.viewDetails')}</span>
              <span className="sm:hidden">{t('jobs.details')}</span>
            </a>
          </Button>
          {job.applicationUrl && (
            <Button asChild size="sm" className="flex-1 sm:flex-initial bg-gray-900 hover:bg-gray-800 text-white shadow-none">
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <span className="hidden sm:inline">{t('jobs.applyNow')}</span>
                <span className="sm:hidden">{t('jobs.apply')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * User Posted Job Card Component - Uses translated content from API
 */
interface UserJobCardProps {
  job: UserPostedJob
}

function UserJobCard({ job }: UserJobCardProps) {
  const { t, tr } = useTranslation()

  // Use client-side auto-translation for title and description
  const { translatedText: title } = useTranslatedText(job.title, 'job')
  const { translatedText: description } = useTranslatedText(job.description || '', 'job')

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('jobs.notPublished')
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return t('jobs.time.justNow')
    if (diffInHours < 24) return tr('jobs.time.hoursAgo', { hours: diffInHours })
    if (diffInHours < 48) return t('jobs.time.yesterday')
    if (diffInHours < 168) return tr('jobs.time.daysAgo', { days: Math.floor(diffInHours / 24) })
    return date.toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending: 'outline',
      expired: 'destructive',
      archived: 'secondary',
    }
    return (
      <Badge variant={variants[status] || 'secondary'} className="text-xs">
        {t(`jobs.statusValues.${status}`, status.charAt(0).toUpperCase() + status.slice(1))}
      </Badge>
    )
  }

  const salaryText = job.salary_min && job.salary_max
    ? `${job.salary_currency || 'EUR'} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
    : job.salary_min
      ? `${t('jobs.salaryFrom')} ${job.salary_currency || 'EUR'} ${job.salary_min.toLocaleString()}`
      : null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
        <div className="flex-1 w-full sm:w-auto">
          <Link
            href={`/jobs/${job.id}`}
            className="block"
          >
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
              <span>{title}</span>
            </h3>
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-600">
            {job.company?.name && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="truncate font-medium text-gray-700">{job.company.name}</span>
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="truncate text-gray-600">{job.location}</span>
              </span>
            )}
            {salaryText && (
              <span className="flex items-center gap-1 text-gray-700 font-medium">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="truncate">{salaryText}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
          {getStatusBadge(job.status)}
          <span className="text-xs text-gray-400 ml-auto sm:ml-0 font-medium">
            {formatDate(job.published_at)}
          </span>
        </div>
      </div>

      {job.description && (
        <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {getJobSnippet(job.description)}...
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {job.employment_type && (() => {
            const key = job.employment_type.toLowerCase().replace(/[\s-]+/g, '_').trim()
            const tKey = `jobs.${key}`
            const translated = t(tKey)
            const label = translated && translated !== tKey
              ? translated
              : key.replace(/_/g, ' ')
            return (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
                {label}
              </Badge>
            )
          })()}
          {job.category?.name && (
            <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
              {job.category.name}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
            {job.views_count || 0} {t('jobs.views')}
          </Badge>
          <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
            {job.applications_count || 0} {t('jobs.applicants')}
          </Badge>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button asChild variant="ghost" size="sm" className="flex-1 sm:flex-initial text-gray-600 hover:text-gray-900 hover:bg-gray-100">
            <Link href={`/jobs/${job.id}`}>
              <span className="hidden sm:inline">{t('jobs.viewDetails')}</span>
              <span className="sm:hidden">{t('jobs.details')}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-initial border-gray-200 hover:bg-gray-50">
            <Link href={`/dashboard/my-ads`}>
              <Edit className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('jobs.manage')}</span>
              <span className="sm:hidden">{t('jobs.edit')}</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
