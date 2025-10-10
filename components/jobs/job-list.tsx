'use client'

import { useState, useEffect } from 'react'
import { JobCard } from './job-card'
import { JobSearch, SearchFilters } from './job-search'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import type { OfferWithRelations } from '@/lib/types/supabase'

interface JobListProps {
  initialJobs?: OfferWithRelations[]
  initialCategories?: Array<{ id: string; name: string; slug: string }>
  showSearch?: boolean
  limit?: number
  variant?: 'default' | 'compact'
}

interface JobsResponse {
  jobs: OfferWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function JobList({ 
  initialJobs = [], 
  initialCategories = [],
  showSearch = true,
  limit = 20,
  variant = 'default'
}: JobListProps) {
  const [jobs, setJobs] = useState<OfferWithRelations[]>(initialJobs)
  const [categories, setCategories] = useState(initialCategories)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState<SearchFilters>({})
  const [sortBy, setSortBy] = useState<'date' | 'salary' | 'relevance'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const { toast } = useToast()

  useEffect(() => {
    if (initialJobs.length === 0) {
      fetchJobs()
    }
    if (initialCategories.length === 0) {
      fetchCategories()
    }
  }, [])

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      fetchJobs(1, filters)
    }
  }, [filters, sortBy, sortOrder])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?type=job')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchJobs = async (page: number = 1, searchFilters: SearchFilters = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      })

      // Add search filters to params
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== false) {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/jobs?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: JobsResponse = await response.json()
      
      setJobs(data.jobs || [])
      setPagination(data.pagination || { page: 1, limit, total: 0, pages: 0 })

      if (data.jobs.length === 0 && Object.keys(searchFilters).length > 0) {
        toast({
          title: 'No jobs found',
          description: 'Try adjusting your search filters to find more jobs.',
        })
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError(error instanceof Error ? error.message : 'Failed to load jobs')
      toast({
        title: 'Error loading jobs',
        description: 'Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }))
      fetchJobs(newPage, filters)
      
      // Scroll to top of job list
      document.getElementById('job-list-top')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  const JobSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div id="job-list-top" />
      
      {showSearch && (
        <JobSearch 
          categories={categories}
          onFiltersChange={handleFiltersChange}
        />
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {pagination.total > 0 ? (
              <>
                {pagination.total.toLocaleString()} Job{pagination.total !== 1 ? 's' : ''} Found
              </>
            ) : (
              'Jobs'
            )}
          </h2>
          
          {Object.keys(filters).length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Filtered
            </Badge>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <div className="flex gap-1">
            {[
              { key: 'date' as const, label: 'Date' },
              { key: 'salary' as const, label: 'Salary' },
              { key: 'relevance' as const, label: 'Relevance' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={sortBy === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleSortChange(key)}
                className="flex items-center gap-1"
              >
                {label}
                {sortBy === key && (
                  sortOrder === 'asc' ? 
                    <SortAsc className="w-3 h-3" /> : 
                    <SortDesc className="w-3 h-3" />
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => fetchJobs(pagination.page, filters)}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <JobSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Jobs List */}
      {!isLoading && !error && (
        <>
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-muted-foreground">
                  <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                  <p>Try adjusting your search criteria or check back later for new opportunities.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  variant={variant}
                  showCompany={true}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1 || isLoading}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum
                    if (pagination.pages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages || isLoading}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Load More Button for Mobile */}
      {!isLoading && !error && jobs.length > 0 && pagination.page < pagination.pages && (
        <div className="text-center md:hidden">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Jobs'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
