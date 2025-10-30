'use client'

/**
 * Latest Jobs Widget
 * Displays recent job listings on the dashboard
 */

import { useEffect } from 'react'
import { useJobs, type Job } from '@/hooks/use-jobs'
import { Briefcase, MapPin, TrendingUp, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

export function LatestJobsWidget() {
  const { jobs, loading, error, search, meta } = useJobs()

  useEffect(() => {
    // Fetch latest 10 jobs from all sources
    search({
      limit: 10,
      sources: ['adzuna', 'rapidapi'],
      useCache: true
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Briefcase className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Latest Jobs</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Latest Jobs</h2>
            {meta && (
              <p className="text-sm text-gray-600">
                {Object.values(meta.sources).reduce((a, b) => a + b, 0)} jobs from multiple sources
              </p>
            )}
          </div>
        </div>
        
        <Link
          href="/dashboard/jobs-feed"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          View All
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Source Stats */}
      {meta && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(meta.sources).map(([source, count]) => (
            <div key={source} className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 capitalize mb-1">{source}</div>
              <div className="text-lg font-bold text-gray-900">{count}</div>
            </div>
          ))}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Status</div>
            <div className="text-sm font-semibold text-green-600">
              {meta.cached ? '✓ Cached' : 'Live'}
            </div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="text-center py-8">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No jobs available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.slice(0, 5).map((job) => (
            <JobItem key={`${job.source}-${job.id}`} job={job} />
          ))}
        </div>
      )}

      {/* View All Link */}
      {jobs.length > 0 && (
        <Link
          href="/dashboard/jobs-feed"
          className="block text-center mt-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          View all jobs →
        </Link>
      )}
    </div>
  )
}

/**
 * Individual Job Item
 */
function JobItem({ job }: { job: Job }) {
  const getSourceColor = (source: string) => {
    if (source.includes('adzuna')) return 'text-purple-600 bg-purple-50'
    if (source.includes('glassdoor')) return 'text-green-600 bg-green-50'
    if (source.includes('upwork')) return 'text-blue-600 bg-blue-50'
    return 'text-gray-600 bg-gray-50'
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">
            {job.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {job.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
            </span>
          </div>
          
          {job.employmentType && (
            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
              {job.employmentType.replace('_', ' ')}
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getSourceColor(job.source)}`}>
            {job.source.split('-')[0]}
          </span>
          {job.applicationUrl && (
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
            >
              Apply →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
