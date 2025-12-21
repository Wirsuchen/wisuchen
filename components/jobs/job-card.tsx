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
import { useTranslation } from '@/contexts/i18n-context'

interface JobCardProps {
  job: OfferWithRelations & { is_external?: boolean; application_url?: string | null; source?: string | null }
  variant?: 'default' | 'compact' | 'featured'
  showCompany?: boolean
}

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export function JobCard({ job, variant = 'default', showCompany = true }: JobCardProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
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

    const periodLabel = period === 'yearly' ? t('jobs.perYear') : period === 'monthly' ? t('jobs.perMonth') : t('jobs.perHour')

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)} ${periodLabel}`
    }

    return `${t('jobs.salaryFrom')} ${formatAmount(min || max!)} ${periodLabel}`
  }

  const normalizeKey = (value: string) =>
    value.toLowerCase().replace(/[\s-]+/g, '_').trim()

  const getEmploymentTypeLabel = (type: string) => {
    const key = normalizeKey(type)
    const tKey = `jobs.${key}`
    const translated = t(tKey)
    return translated !== tKey ? translated : type
  }

  const getExperienceLevelLabel = (level: string) => {
    const key = normalizeKey(level)
    const tKey = `jobs.${key}`
    const translated = t(tKey)
    return translated !== tKey ? translated : level
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
                    {t('jobs.badges.featured')}
                  </Badge>
                )}
                {job.urgent && (
                  <Badge variant="destructive">
                    <Zap className="w-3 h-3 mr-1" />
                    {t('jobs.badges.urgent')}
                  </Badge>
                )}
              </div>

              <Link href={isExternal && (job as any).application_url ? (job as any).application_url : `/jobs/${job.id}`} className="block">
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
                    {t('jobs.badges.remote')}
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
    <Card className={`transition-all duration-200 border-gray-200 hover:border-gray-300 shadow-none hover:bg-gray-50/50 ${job.featured ? 'bg-yellow-50/30 border-yellow-200 hover:border-yellow-300' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {showCompany && job.company && (
              <Avatar className="w-10 h-10 border border-gray-100">
                <AvatarImage src={job.company.logo_url || ''} alt={job.company.name} />
                <AvatarFallback className="bg-gray-50 text-gray-600 text-xs">
                  {job.company.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                {job.featured && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-0 text-[10px] px-1.5 h-5">
                    <Star className="w-3 h-3 mr-1" />
                    {t('jobs.badges.featured')}
                  </Badge>
                )}
                {job.urgent && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 h-5">
                    <Zap className="w-3 h-3 mr-1" />
                    {t('jobs.badges.urgent')}
                  </Badge>
                )}
              </div>

              <Link href={isExternal && (job as any).application_url ? (job as any).application_url : `/jobs/${job.id}`}>
                <h3 className="font-semibold text-lg text-gray-900 hover:text-gray-700 transition-colors">
                  {job.title}
                </h3>
              </Link>

              {showCompany && job.company && (
                <div className="flex items-center gap-2 mt-0.5 text-gray-500">
                  <Building className="w-3.5 h-3.5" />
                  <span className="text-sm">{job.company.name}</span>
                  {job.company.is_verified && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1 border-gray-200 text-gray-500 font-normal">
                      {t('jobs.badges.verified')}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            {formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'EUR', job.salary_period || 'yearly') && (
              <div className="font-medium text-gray-900">
                {formatSalary(job.salary_min, job.salary_max, job.salary_currency || 'EUR', job.salary_period || 'yearly')}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              {job.published_at && formatDistanceToNow(new Date(job.published_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        {job.short_description && (
          <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
            {job.short_description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {job.location && (
            <Badge variant="outline" className="flex items-center gap-1 font-normal text-gray-600 border-gray-200">
              <MapPin className="w-3 h-3 text-gray-400" />
              {job.location}
            </Badge>
          )}

          {job.employment_type && (
            <Badge variant="outline" className="flex items-center gap-1 font-normal text-gray-600 border-gray-200">
              <Clock className="w-3 h-3 text-gray-400" />
              {getEmploymentTypeLabel(job.employment_type)}
            </Badge>
          )}

          {job.experience_level && (
            <Badge variant="outline" className="flex items-center gap-1 font-normal text-gray-600 border-gray-200">
              <Users className="w-3 h-3 text-gray-400" />
              {getExperienceLevelLabel(job.experience_level)}
            </Badge>
          )}

          {job.is_remote && (
            <Badge variant="outline" className="bg-green-50/50 text-green-700 border-green-200 font-normal">
              {t('jobs.badges.remote')}
            </Badge>
          )}

          {job.is_hybrid && (
            <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-200 font-normal">
              {t('jobs.badges.hybrid')}
            </Badge>
          )}
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 5).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs font-normal bg-gray-100 text-gray-600 hover:bg-gray-200 border-0">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 5 && (
              <Badge variant="secondary" className="text-xs font-normal bg-gray-100 text-gray-600 hover:bg-gray-200 border-0">
                +{job.skills.length - 5}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        <div className="flex items-center justify-between w-full pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{job.views_count || 0}</span>
            </div>
            {job.applications_count > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{job.applications_count}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild className="h-8 text-gray-600 hover:text-gray-900">
              <Link href={isExternal && (job as any).application_url ? (job as any).application_url : `/jobs/${job.id}`}>
                {isExternal ? t('jobs.buttons.viewJob') : t('jobs.buttons.viewDetails')}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-gray-200"
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()

                if (!user) {
                  router.push('/login')
                  return
                }

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
                      title: t('jobs.toasts.saved.title'),
                      description: t('jobs.toasts.saved.description')
                    })
                  } else {
                    toast({
                      title: t('jobs.toasts.saveFailed.title'),
                      description: data.error || t('jobs.toasts.saveFailed.description'),
                      variant: 'destructive'
                    })
                  }
                } catch (error) {
                  console.error('Error saving job:', error)
                  toast({
                    title: t('jobs.toasts.error.title'),
                    description: t('jobs.toasts.error.description'),
                    variant: 'destructive'
                  })
                }
              }}
            >
              {t('jobs.buttons.save')}
            </Button>

            {job.application_url && (
              <Button size="sm" asChild className="h-8 bg-gray-900 hover:bg-gray-800 text-white shadow-none">
                <Link href={job.application_url} target="_blank" rel="noopener noreferrer">
                  {t('jobs.buttons.applyNow')}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
