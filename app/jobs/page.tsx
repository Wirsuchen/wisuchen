'use client'

/**
 * Jobs Page - Real Jobs from RapidAPI
 * Fetches live job data from multiple RapidAPI sources
 */

import { useEffect, useState } from 'react'
import { useJobs, type Job } from '@/hooks/use-jobs'
import { PageLayout } from '@/components/layout/page-layout'
import { Loader2, Search, MapPin, Briefcase, DollarSign, ExternalLink, Filter, RefreshCw, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const { jobs, loading, error, search, refresh, pagination, meta } = useJobs()

  // Load jobs on mount
  useEffect(() => {
    loadJobs()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadJobs = () => {
    search({
      // Don't specify sources to use all enabled sources
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
      // Don't specify sources to use all enabled sources
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
        // Don't specify sources to use all enabled sources
        limit: 50,
        page: pagination.page + 1
      })
    }
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
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Find Your Dream Job</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover jobs from 10+ sources: Glassdoor, Upwork, Y Combinator & more
          </p>
          
          {/* Stats */}
          {meta && !loading && (
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">{pagination?.total || 0} Jobs</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>{Object.keys(meta.sources).length} Sources</span>
              </div>
              {meta.cached && (
                <Badge variant="secondary" className="text-xs">
                  ✓ Cached
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Main Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Job title, keywords..."
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, state, or country..."
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
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
                      Employment Type
                    </label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="freelance">Freelance</option>
                      <option value="internship">Internship</option>
                      <option value="temporary">Temporary</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="flex-1"
                    >
                      Reset Filters
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
              <div className="text-red-600 font-medium">Error loading jobs</div>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <Button
              onClick={loadJobs}
              variant="outline"
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && jobs.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Loading jobs...</p>
              <p className="text-gray-500 text-sm mt-2">Fetching from multiple sources (Adzuna, RapidAPI)</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && jobs.length === 0 && !error && (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
            <Button onClick={handleReset} variant="outline">
              Reset Search
            </Button>
          </div>
        )}

        {/* Jobs List */}
        {jobs.length > 0 && (
          <>
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard key={`${job.source}-${job.id}`} job={job} />
              ))}
            </div>

            {/* Load More */}
            {pagination && pagination.page < pagination.totalPages && (
              <div className="text-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  size="lg"
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    `Load More (${pagination.total - pagination.page * pagination.limit} remaining)`
                  )}
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
 * Job Card Component
 */
function JobCard({ job }: { job: Job }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`
    return date.toLocaleDateString()
  }

  const getSourceBadgeColor = (source: string) => {
    // New primary sources (latest jobs)
    if (source.includes('job-search-api')) return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    if (source.includes('jsearch')) return 'bg-violet-100 text-violet-700 border-violet-200'
    
    // Other sources
    if (source.includes('glassdoor')) return 'bg-green-100 text-green-700 border-green-200'
    if (source.includes('upwork')) return 'bg-blue-100 text-blue-700 border-blue-200'
    if (source.includes('employment')) return 'bg-purple-100 text-purple-700 border-purple-200'
    if (source.includes('job-posting')) return 'bg-orange-100 text-orange-700 border-orange-200'
    if (source.includes('active-jobs')) return 'bg-pink-100 text-pink-700 border-pink-200'
    if (source.includes('ycombinator')) return 'bg-red-100 text-red-700 border-red-200'
    if (source.includes('freelancer')) return 'bg-cyan-100 text-cyan-700 border-cyan-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getSourceName = (source: string) => {
    // New primary sources
    if (source.includes('job-search-api')) return '🔥 Latest Jobs (7 days)'
    if (source.includes('jsearch')) return '⚡ Google Jobs'
    
    // Other sources
    if (source.includes('glassdoor')) return 'Glassdoor'
    if (source.includes('upwork')) return 'Upwork'
    if (source.includes('employment')) return 'Employment Agency'
    if (source.includes('job-posting')) return 'Job Postings'
    if (source.includes('active-jobs')) return 'Active Jobs DB'
    if (source.includes('ycombinator')) return 'Y Combinator'
    if (source.includes('freelancer')) return 'Freelancer'
    return 'RapidAPI'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
            {job.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {job.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
            {job.salary && (job.salary.min || job.salary.max || job.salary.text) && (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <DollarSign className="w-4 h-4" />
                {job.salary.text || `€${job.salary.min?.toLocaleString()} - €${job.salary.max?.toLocaleString()}`}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <Badge className={`border ${getSourceBadgeColor(job.source)}`}>
            {getSourceName(job.source)}
          </Badge>
          <span className="text-xs text-gray-500">
            {formatDate(job.publishedAt)}
          </span>
        </div>
      </div>

      {job.description && (
        <p className="text-gray-700 mb-4 line-clamp-2">
          {job.description.replace(/<[^>]*>/g, '').substring(0, 250)}...
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {job.employmentType && (
            <Badge variant="secondary" className="text-xs">
              {job.employmentType.replace('_', ' ')}
            </Badge>
          )}
          {job.experienceLevel && (
            <Badge variant="outline" className="text-xs capitalize">
              {job.experienceLevel}
            </Badge>
          )}
          {job.skills && job.skills.slice(0, 3).map((skill, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>

        {job.applicationUrl && (
          <Button asChild>
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              Apply Now
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
