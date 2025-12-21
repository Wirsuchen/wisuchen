'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Search, MapPin, Filter, X, Briefcase, Clock, DollarSign } from 'lucide-react'
import { useTranslation } from '@/contexts/i18n-context'

interface JobSearchProps {
  categories?: Array<{ id: string; name: string; slug: string }>
  onFiltersChange?: (filters: SearchFilters) => void
}

export interface SearchFilters {
  search?: string
  category?: string
  location?: string
  type?: string
  remote?: boolean
  hybrid?: boolean
  featured?: boolean
  salaryMin?: number
  experienceLevel?: string
}

export function JobSearch({ categories = [], onFiltersChange }: JobSearchProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<SearchFilters>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    type: searchParams.get('type') || '',
    remote: searchParams.get('remote') === 'true',
    hybrid: searchParams.get('hybrid') === 'true',
    featured: searchParams.get('featured') === 'true',
    salaryMin: searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')!) : undefined,
    experienceLevel: searchParams.get('experienceLevel') || '',
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const employmentTypes = [
    { value: 'full_time', label: t('jobs.full_time') },
    { value: 'part_time', label: t('jobs.part_time') },
    { value: 'contract', label: t('jobs.contract') },
    { value: 'freelance', label: t('jobs.freelance') },
    { value: 'internship', label: t('jobs.internship') },
    { value: 'temporary', label: t('jobs.temporary') }
  ]

  const experienceLevels = [
    { value: 'entry', label: t('jobs.entry') },
    { value: 'junior', label: t('jobs.junior') },
    { value: 'mid', label: t('jobs.mid') },
    { value: 'senior', label: t('jobs.senior') },
    { value: 'lead', label: t('jobs.lead') },
    { value: 'executive', label: t('jobs.executive') }
  ]

  const salaryRanges = [
    { value: 30000, label: t('jobSearch.salaryRanges.range30k') },
    { value: 50000, label: t('jobSearch.salaryRanges.range50k') },
    { value: 70000, label: t('jobSearch.salaryRanges.range70k') },
    { value: 100000, label: t('jobSearch.salaryRanges.range100k') },
    { value: 150000, label: t('jobSearch.salaryRanges.range150k') }
  ]

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    
    // Update URL
    const params = new URLSearchParams()
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false) {
        params.set(key, value.toString())
      }
    })
    
    const queryString = params.toString()
    router.push(`/jobs${queryString ? `?${queryString}` : ''}`, { scroll: false })
    
    // Notify parent component
    onFiltersChange?.(updatedFilters)
  }

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      search: '',
      category: '',
      location: '',
      type: '',
      remote: false,
      hybrid: false,
      featured: false,
      salaryMin: undefined,
      experienceLevel: '',
    }
    setFilters(clearedFilters)
    router.push('/jobs', { scroll: false })
    onFiltersChange?.(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== false
  )

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== '' && value !== false
    ).length
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <Search className="w-5 h-5 text-gray-500" />
          {t('jobSearch.title')}
        </h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-0 font-normal">
              {getActiveFiltersCount()} {t('jobSearch.activeFilters')}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Filter className="w-4 h-4 mr-1" />
            {showAdvanced ? t('jobSearch.simple') : t('jobSearch.advanced')}
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Main Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('jobSearch.searchPlaceholder')}
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
          <div className="relative w-full sm:w-56">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('jobSearch.locationPlaceholder')}
              value={filters.location || ''}
              onChange={(e) => updateFilters({ location: e.target.value })}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
          <Button 
            type="button" 
            onClick={() => onFiltersChange?.(filters)}
            className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white shadow-none"
          >
            {t('jobSearch.search')}
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-4 pt-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remote"
              checked={filters.remote || false}
              onCheckedChange={(checked) => updateFilters({ remote: checked as boolean })}
              className="border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <Label htmlFor="remote" className="text-sm font-normal text-gray-700">{t('jobSearch.filters.remote')}</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hybrid"
              checked={filters.hybrid || false}
              onCheckedChange={(checked) => updateFilters({ hybrid: checked as boolean })}
              className="border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <Label htmlFor="hybrid" className="text-sm font-normal text-gray-700">{t('jobSearch.filters.hybrid')}</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={filters.featured || false}
              onCheckedChange={(checked) => updateFilters({ featured: checked as boolean })}
              className="border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <Label htmlFor="featured" className="text-sm font-normal text-gray-700">{t('jobSearch.filters.featuredOnly')}</Label>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <>
            <Separator className="bg-gray-100" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Category */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Briefcase className="w-3 h-3" />
                  {t('jobSearch.filters.category')}
                </Label>
                <Select
                  value={filters.category || ''}
                  onValueChange={(value) => updateFilters({ category: value })}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-700">
                    <SelectValue placeholder={t('jobSearch.placeholders.allCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('jobSearch.placeholders.allCategories')}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employment Type */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Clock className="w-3 h-3" />
                  {t('jobSearch.filters.employmentType')}
                </Label>
                <Select
                  value={filters.type || ''}
                  onValueChange={(value) => updateFilters({ type: value })}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-700">
                    <SelectValue placeholder={t('jobSearch.placeholders.allTypes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('jobSearch.placeholders.allTypes')}</SelectItem>
                    {employmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('jobSearch.filters.experienceLevel')}</Label>
                <Select
                  value={filters.experienceLevel || ''}
                  onValueChange={(value) => updateFilters({ experienceLevel: value })}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-700">
                    <SelectValue placeholder={t('jobSearch.placeholders.allLevels')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('jobSearch.placeholders.allLevels')}</SelectItem>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Salary Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <DollarSign className="w-3 h-3" />
                  {t('jobSearch.filters.minimumSalary')}
                </Label>
                <Select
                  value={filters.salaryMin?.toString() || ''}
                  onValueChange={(value) => updateFilters({ 
                    salaryMin: value ? parseInt(value) : undefined 
                  })}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-700">
                    <SelectValue placeholder={t('jobSearch.placeholders.anySalary')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('jobSearch.placeholders.anySalary')}</SelectItem>
                    {salaryRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value.toString()}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <>
            <Separator className="bg-gray-100" />
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value || value === '' || value === false) return null
                  
                  let displayValue = value.toString()
                  if (key === 'category') {
                    const category = categories.find(c => c.id === value)
                    displayValue = category?.name || value.toString()
                  } else if (key === 'type') {
                    const type = employmentTypes.find(t => t.value === value)
                    displayValue = type?.label || value.toString()
                  } else if (key === 'experienceLevel') {
                    const level = experienceLevels.find(l => l.value === value)
                    displayValue = level?.label || value.toString()
                  } else if (key === 'salaryMin') {
                    displayValue = `${parseInt(value.toString()).toLocaleString('de-DE')}€+`
                  } else if (typeof value === 'boolean') {
                    displayValue = key.charAt(0).toUpperCase() + key.slice(1)
                  }

                  return (
                    <Badge key={key} variant="secondary" className="flex items-center gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 font-normal">
                      {displayValue}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 w-4 h-4 hover:bg-transparent text-gray-500 hover:text-gray-900"
                        onClick={() => updateFilters({ [key]: key === 'salaryMin' ? undefined : '' })}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )
                })}
              </div>
              
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-gray-900 h-8">
                {t('jobSearch.clearAll')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
