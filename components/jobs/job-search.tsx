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
    { value: 'full_time', label: 'Vollzeit' },
    { value: 'part_time', label: 'Teilzeit' },
    { value: 'contract', label: 'Vertrag' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Praktikum' },
    { value: 'temporary', label: 'Befristet' }
  ]

  const experienceLevels = [
    { value: 'entry', label: 'Einsteiger' },
    { value: 'junior', label: 'Junior' },
    { value: 'mid', label: 'Mid-Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead' },
    { value: 'executive', label: 'Executive' }
  ]

  const salaryRanges = [
    { value: 30000, label: '30.000€+' },
    { value: 50000, label: '50.000€+' },
    { value: 70000, label: '70.000€+' },
    { value: 100000, label: '100.000€+' },
    { value: 150000, label: '150.000€+' }
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Job Search
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} active filters
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="w-4 h-4 mr-1" />
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, companies, or skills..."
              value={filters.search || ''}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Location"
              value={filters.location || ''}
              onChange={(e) => updateFilters({ location: e.target.value })}
              className="pl-10 w-48"
            />
          </div>
          <Button type="button" onClick={() => onFiltersChange?.(filters)}>
            Search
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remote"
              checked={filters.remote || false}
              onCheckedChange={(checked) => updateFilters({ remote: checked as boolean })}
            />
            <Label htmlFor="remote" className="text-sm">Remote</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hybrid"
              checked={filters.hybrid || false}
              onCheckedChange={(checked) => updateFilters({ hybrid: checked as boolean })}
            />
            <Label htmlFor="hybrid" className="text-sm">Hybrid</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={filters.featured || false}
              onCheckedChange={(checked) => updateFilters({ featured: checked as boolean })}
            />
            <Label htmlFor="featured" className="text-sm">Featured Only</Label>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  Category
                </Label>
                <Select
                  value={filters.category || ''}
                  onValueChange={(value) => updateFilters({ category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
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
                <Label className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Employment Type
                </Label>
                <Select
                  value={filters.type || ''}
                  onValueChange={(value) => updateFilters({ type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
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
                <Label>Experience Level</Label>
                <Select
                  value={filters.experienceLevel || ''}
                  onValueChange={(value) => updateFilters({ experienceLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All levels</SelectItem>
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
                <Label className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Minimum Salary
                </Label>
                <Select
                  value={filters.salaryMin?.toString() || ''}
                  onValueChange={(value) => updateFilters({ 
                    salaryMin: value ? parseInt(value) : undefined 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any salary" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any salary</SelectItem>
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
            <Separator />
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
                    <Badge key={key} variant="secondary" className="flex items-center gap-1">
                      {displayValue}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 w-4 h-4"
                        onClick={() => updateFilters({ [key]: key === 'salaryMin' ? undefined : '' })}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  )
                })}
              </div>
              
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
