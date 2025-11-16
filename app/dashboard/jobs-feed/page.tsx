'use client'

/**
 * Jobs Feed Dashboard
 * Displays latest jobs from all API sources with real-time updates
 */

import { useState, useEffect } from 'react'
import { useJobs, type Job } from '@/hooks/use-jobs'
import { Loader2, Search, MapPin, Briefcase, DollarSign, ExternalLink, RefreshCw, Filter } from 'lucide-react'
import { useTranslation } from '@/contexts/i18n-context'

export default function JobsFeedPage() {
  const { t, tr } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState<string>('')
  const [selectedSources, setSelectedSources] = useState<string[]>(['adzuna', 'rapidapi'])

  const { jobs, loading, error, search, refresh, pagination, meta } = useJobs()

  // Load latest jobs on mount
  useEffect(() => {
    loadLatestJobs()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadLatestJobs = () => {
    search({
      sources: selectedSources,
      limit: 50,
      page: 1,
      useCache: true
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    search({
      query: searchQuery || undefined,
      location: location || undefined,
      employmentType: employmentType || undefined,
      sources: selectedSources,
      limit: 50,
      page: 1,
      useCache: false // Fresh results for searches
    })
  }

  const handleLoadMore = () => {
    if (pagination) {
      search({
        query: searchQuery || undefined,
        location: location || undefined,
        employmentType: employmentType || undefined,
        sources: selectedSources,
        limit: 50,
        page: pagination.page + 1
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('jobs.latestJobs')}</h1>
          <p className="text-gray-600">
            {t('jobs.heroSubtitle')}
          </p>
        </div>
        
        <button
          onClick={() => {
            loadLatestJobs()
            refresh()
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('jobs.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('jobs.locationPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('jobs.searching')}
                </span>
              ) : (
                t('jobs.searchJobs')
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                {t('jobs.jobType')}
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('jobs.allTypes')}</option>
                <option value="full_time">{t('jobs.fullTime')}</option>
                <option value="part_time">{t('jobs.partTime')}</option>
                <option value="contract">{t('jobs.contract')}</option>
                <option value="freelance">{t('jobs.freelance')}</option>
                <option value="internship">{t('jobs.internship')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('jobs.dataSources')}
              </label>
              <div className="flex flex-wrap gap-3">
                {['adzuna', 'rapidapi'].map(source => (
                  <label key={source} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSources([...selectedSources, source])
                        } else {
                          setSelectedSources(selectedSources.filter(s => s !== source))
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm capitalize">{source}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Stats */}
      {meta && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">{t('jobs.totalJobs')}</div>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
          </div>
          
          {Object.entries(meta.sources).map(([source, count]) => (
            <div key={source} className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1 capitalize">{source}</div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          ))}

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">{t('jobs.cacheStatus')}</div>
            <div className="text-lg font-semibold">
              {meta.cached ? (
                <span className="text-green-600">{t('jobs.cached')}</span>
              ) : (
                <span className="text-blue-600">{t('jobs.live')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-red-600 font-medium">{t('jobs.errorLoading')}</div>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <button
            onClick={loadLatestJobs}
            className="mt-3 text-red-600 hover:text-red-700 font-medium"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      )}

      {/* Jobs List */}
      {loading && jobs.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">{t('jobs.loadingFromSources')}</p>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('jobs.noJobsFound')}</h3>
          <p className="text-gray-600">{t('jobs.tryAdjustingFilters')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={`${job.source}-${job.id}`} job={job} />
            ))}
          </div>

          {/* Load More */}
          {pagination && pagination.page < pagination.totalPages && (
            <div className="text-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('jobs.loadingMore')}
                  </span>
                ) : (
                  `${t('common.loadMore')} (${pagination.total - pagination.page * pagination.limit} ${t('jobs.remaining')})`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Job Card Component
 */
function JobCard({ job }: { job: Job }) {
  const { t, tr } = useTranslation()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return t('jobs.time.justNow')
    if (diffInHours < 24) return tr('jobs.time.hoursAgo', { hours: diffInHours })
    if (diffInHours < 48) return t('jobs.time.yesterday')
    return date.toLocaleDateString()
  }

  const getSourceBadgeColor = (source: string) => {
    if (source.includes('adzuna')) return 'bg-purple-100 text-purple-700'
    if (source.includes('glassdoor')) return 'bg-green-100 text-green-700'
    if (source.includes('upwork')) return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
            {job.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            {job.company && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {job.company}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
            {job.salary && (job.salary.min || job.salary.max || job.salary.text) && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {job.salary.text || `€${job.salary.min?.toLocaleString()} - €${job.salary.max?.toLocaleString()}`}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(job.source)}`}>
            {job.source}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(job.publishedAt)}
          </span>
        </div>
      </div>

      {job.description && (
        <p className="text-gray-700 mb-4 line-clamp-2">
          {job.description.replace(/<[^>]*>/g, '').substring(0, 200)}...
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {job.employmentType && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              {job.employmentType.replace('_', ' ')}
            </span>
          )}
          {job.experienceLevel && (
            <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium capitalize">
              {job.experienceLevel}
            </span>
          )}
          {job.skills && job.skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
              {skill}
            </span>
          ))}
        </div>

        {job.applicationUrl && (
          <a
            href={job.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Apply Now
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}
