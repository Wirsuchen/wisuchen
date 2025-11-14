'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  Star, 
  Zap,
  ExternalLink,
  Eye,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { OfferWithRelations } from '@/lib/types/database'
import { toast } from '@/hooks/use-toast'

interface JobCardProps {
  job: OfferWithRelations & { is_external?: boolean; application_url?: string | null; source?: string | null }
  variant?: 'default' | 'compact' | 'featured'
  showCompany?: boolean
}

export function JobCard({ job, variant = 'default', showCompany = true }: JobCardProps) {
  const isExternal = Boolean((job as any).is_external || ((job as any).source && (job as any).source !== 'manual'))
  const formatSalary = (min?: number | null, max?: number | null, currency = 'EUR', period = 'yearly') => {
    if (!min && !max) return null
    
    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      }).format(amount)
    }

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)} ${period === 'yearly' ? '/Jahr' : period === 'monthly' ? '/Monat' : '/Stunde'}`
    }
    
    return `Ab ${formatAmount(min || max!)} ${period === 'yearly' ? '/Jahr' : period === 'monthly' ? '/Monat' : '/Stunde'}`
  }

  const getEmploymentTypeLabel = (type: string) => {
    const labels = {
      full_time: 'Vollzeit',
      part_time: 'Teilzeit',
      contract: 'Vertrag',
      freelance: 'Freelance',
      internship: 'Praktikum',
      temporary: 'Befristet'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getExperienceLevelLabel = (level: string) => {
    const labels = {
      entry: 'Einsteiger',
      junior: 'Junior',
      mid: 'Mid-Level',
      senior: 'Senior',
      lead: 'Lead',
      executive: 'Executive'
    }
    return labels[level as keyof typeof labels] || level
  }

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {job.featured && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {job.urgent && (
                  <Badge variant="destructive">
                    <Zap className="w-3 h-3 mr-1" />
                    Urgent
                  </Badge>
                )}
              </div>
              
              <Link href={isExternal && (job as any).application_url ? (job as any).application_url : `/jobs/${job.id}`} className="block" target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}>
                <h3 className="font-semibold text-lg hover:text-primary truncate">
                  {job.title}
                </h3>
              </Link>
              
              {showCompany && job.company && (
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <Building className="w-4 h-4" />
                  <span className="text-sm">{job.company.name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {job.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                )}
                {job.employment_type && (
                  <Badge variant="outline" className="text-xs">
                    {getEmploymentTypeLabel(job.employment_type)}
                  </Badge>
                )}
                {job.is_remote && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    Remote
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-right ml-4">
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'EUR', job.salary_period || 'yearly') && (
                <div className="font-semibold text-primary">
                  {formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'EUR', job.salary_period || 'yearly')}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                {job.published_at && formatDistanceToNow(new Date(job.published_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${job.featured ? 'ring-2 ring-yellow-200' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {showCompany && job.company && (
              <Avatar className="w-12 h-12">
                <AvatarImage src={job.company.logo_url || ''} alt={job.company.name} />
                <AvatarFallback>
                  {job.company.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                {job.featured && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {job.urgent && (
                  <Badge variant="destructive">
                    <Zap className="w-3 h-3 mr-1" />
                    Urgent
                  </Badge>
                )}
              </div>
              
              <Link href={isExternal && (job as any).application_url ? (job as any).application_url : `/jobs/${job.id}`} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}>
                <h3 className="font-semibold text-xl hover:text-primary transition-colors">
                  {job.title}
                </h3>
              </Link>
              
              {showCompany && job.company && (
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <Building className="w-4 h-4" />
                  <span>{job.company.name}</span>
                  {job.company.is_verified && (
                    <Badge variant="outline" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            {formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'EUR', job.salary_period || 'yearly') && (
              <div className="font-bold text-lg text-primary">
                {formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'EUR', job.salary_period || 'yearly')}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {job.published_at && formatDistanceToNow(new Date(job.published_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {job.short_description && (
          <p className="text-muted-foreground mb-4 line-clamp-2">
            {job.short_description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {job.location && (
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
            </Badge>
          )}
          
          {job.employment_type && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getEmploymentTypeLabel(job.employment_type)}
            </Badge>
          )}
          
          {job.experience_level && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {getExperienceLevelLabel(job.experience_level)}
            </Badge>
          )}
          
          {job.is_remote && (
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Remote
            </Badge>
          )}
          
          {job.is_hybrid && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Hybrid
            </Badge>
          )}
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {job.skills.slice(0, 5).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{job.skills.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{job.views_count || 0} views</span>
            </div>
            {job.applications_count > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{job.applications_count} applications</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={isExternal && (job as any).application_url ? (job as any).application_url : `/jobs/${job.id}`} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}>
                {isExternal ? 'View Job' : 'View Details'}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                try {
                  const response = await fetch(isExternal ? '/api/saved/jobs' : '/api/saved', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(isExternal ? {
                      id: job.id,
                      title: job.title,
                      description: job.description,
                      company: (job as any).company_name || (job as any).company?.name || 'Unknown',
                      location: job.location,
                      employmentType: job.employment_type,
                      experienceLevel: job.experience_level,
                      salaryMin: job.salary_min,
                      salaryMax: job.salary_max,
                      salaryCurrency: job.salary_currency || 'EUR',
                      salaryPeriod: job.salary_period || 'yearly',
                      isRemote: job.is_remote,
                      skills: job.skills,
                      applicationUrl: job.application_url,
                      source: (job as any).source || 'external'
                    } : {
                      offer_id: job.id
                    }),
                  })
                  const data = await response.json()
                  if (data.success) {
                    toast({ 
                      title: 'Job saved', 
                      description: 'This job has been added to your saved items.' 
                    })
                  } else {
                    toast({ 
                      title: 'Failed to save job', 
                      description: data.error || 'Please try again.', 
                      variant: 'destructive' 
                    })
                  }
                } catch (error) {
                  console.error('Error saving job:', error)
                  toast({ 
                    title: 'Error', 
                    description: 'Failed to save job. Please try again.', 
                    variant: 'destructive' 
                  })
                }
              }}
            >
              Save
            </Button>
            
            {job.application_url && (
              <Button size="sm" asChild>
                <Link href={job.application_url} target="_blank" rel="noopener noreferrer">
                  Apply Now
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
