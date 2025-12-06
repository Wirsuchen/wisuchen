"use client"

import React, { useEffect, useState, use } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Briefcase,
  Clock,
  Euro,
  Heart,
  Share2,
  Building2,
  Users,
  Calendar,
  Sparkles,
  ExternalLink,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { formatEuroText } from "@/lib/utils"
import { useSearchParams, useRouter } from "next/navigation"
import type { Job } from "@/hooks/use-jobs"
import { fetchWithCache } from "@/lib/utils/client-cache"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { useTranslation, useI18n } from "@/contexts/i18n-context"
import { TranslateButton } from "@/components/ui/translate-button"
import { useTranslatedText } from "@/contexts/dynamic-translation-context"

const sanitizeJobDescription = (text: string) => {
  if (!text) return ""
  return text
    // Remove bracketed token like "]init["
    .replace(/\]init\[/gi, "")
    // Remove standalone word "init" (case-insensitive)
    .replace(/\binit\b/gi, "")
    // Collapse multiple spaces
    .replace(/\s{2,}/g, " ")
    .trim()
}

import { Suspense } from "react"

function JobDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: routeId } = use(params)
  const [isImproving, setIsImproving] = useState(false)
  const [improvedDescription, setImprovedDescription] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()
  const canUseAI = !!(user && (user.isSubscribed || ['pro', 'premium'].includes(user.plan || '')))

  type ExtJob = Job & {
    logo?: string
    category?: string
    benefits?: string[]
    website?: string
    applicants?: number
    companySize?: string
    industry?: string
    postedDate?: string
    type?: string
  }

  const [job, setJob] = useState<ExtJob | null>(null)
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)
  const [loadingJob, setLoadingJob] = useState(true)

  // Load job either from sessionStorage (when coming from external search with source)
  // or from the database via /api/jobs/[id] (when opened from /saved or user-posted jobs)
  useEffect(() => {
    const id = routeId
    if (!id) {
      setJob(null)
      setLoadingJob(false)
      return
    }

    const loadJob = async () => {
      const source = searchParams.get('source')

      // Try sessionStorage first when a source is provided (external search flow)
      if (source) {
        try {
          const storageKey = `job:${source}:${id}`
          if (typeof window !== 'undefined') {
            const raw = sessionStorage.getItem(storageKey)
            if (raw) {
              const parsed = JSON.parse(raw) as ExtJob
              setJob(parsed)
              setLoadingJob(false)
              return
            }
          }
        } catch (error) {
          console.error('Error reading job from sessionStorage:', error)
        }
      }

      // Fallback: fetch from API using internal offer ID (supports saved and user-posted jobs)
      setLoadingJob(true)
      try {
        const res = await fetch(`/api/jobs/${encodeURIComponent(id)}`)
        if (!res.ok) {
          setJob(null)
          return
        }

        const data = await res.json()
        const dbJob = data.job
        if (!dbJob) {
          setJob(null)
          return
        }

        const mapped: ExtJob = {
          id: dbJob.id,
          externalId: dbJob.external_id || dbJob.id,
          title: dbJob.title,
          description: dbJob.description || "",
          company: (dbJob.company && dbJob.company.name) || "",
          location: dbJob.location || "",
          salary: dbJob.salary_min || dbJob.salary_max
            ? {
              min: dbJob.salary_min || undefined,
              max: dbJob.salary_max || undefined,
              currency: dbJob.salary_currency || undefined,
              text:
                dbJob.salary_min && dbJob.salary_max
                  ? `€${dbJob.salary_min}-€${dbJob.salary_max}`
                  : undefined,
            }
            : undefined,
          employmentType: dbJob.employment_type || undefined,
          experienceLevel: dbJob.experience_level || undefined,
          skills: dbJob.skills || [],
          applicationUrl: dbJob.application_url || undefined,
          source: dbJob.source || 'database',
          publishedAt: dbJob.published_at || dbJob.created_at || new Date().toISOString(),
          logo: dbJob.company?.logo_url || undefined,
          companySize: dbJob.company?.company_size || undefined,
          industry: dbJob.company?.industry || undefined,
          website: dbJob.company?.website_url || undefined,
          applicants: (dbJob as any).applications_count || undefined,
          postedDate: dbJob.published_at || undefined,
          type: dbJob.employment_type || undefined,
        }

        setJob(mapped)
      } catch (error) {
        console.error('Error fetching job:', error)
        setJob(null)
      } finally {
        setLoadingJob(false)
      }
    }

    loadJob()
  }, [routeId, searchParams])

  // Fetch similar jobs when job is loaded
  useEffect(() => {
    if (!job) return

    const fetchSimilarJobs = async () => {
      setLoadingRelated(true)
      try {
        // Extract location city (first part before comma)
        const locationParts = job.location?.split(',') || []
        const city = locationParts[0]?.trim()

        // Build query params for similar jobs
        const params = new URLSearchParams()
        if (city) params.append('location', city)
        if (job.employmentType) params.append('employmentType', job.employmentType)
        params.append('limit', '6')
        params.append('page', '1')

        const url = `/api/v1/jobs/search?${params.toString()}`
        const data = await fetchWithCache<any>(url, undefined, { city, type: job.employmentType }, 60 * 60 * 1000)

        if (data.success && data.data.jobs) {
          // Filter out the current job and limit to 3
          const filtered = data.data.jobs
            .filter((j: Job) => j.id !== job.id && j.externalId !== job.externalId)
            .slice(0, 3)
          setRelatedJobs(filtered)
        }
      } catch (error) {
        console.error('Error fetching similar jobs:', error)
      } finally {
        setLoadingRelated(false)
      }
    }

    fetchSimilarJobs()
  }, [job])

  // Auto-translate job when locale changes
  const { locale } = useI18n()
  const originalJobRef = React.useRef<{ title: string; description: string } | null>(null)
  const lastTranslatedLocaleRef = React.useRef<string>('en')
  const jobIdRef = React.useRef<string | null>(null)

  useEffect(() => {
    if (!job) return

    // Store original content when job ID changes
    if (jobIdRef.current !== job.id) {
      jobIdRef.current = job.id
      originalJobRef.current = {
        title: job.title,
        description: job.description || ''
      }
      lastTranslatedLocaleRef.current = 'en' // Reset to English for new job
    }

    // Skip if locale hasn't changed
    if (lastTranslatedLocaleRef.current === locale) return

    // Update the last translated locale
    lastTranslatedLocaleRef.current = locale

    // If locale is English, restore original
    if (locale === 'en') {
      if (originalJobRef.current) {
        setJob(prev => prev ? ({
          ...prev,
          title: originalJobRef.current!.title,
          description: originalJobRef.current!.description
        }) : null)
      }
      return
    }

    // Translate to target locale
    const translateJob = async () => {
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: 'job',
            title: originalJobRef.current?.title || job.title,
            description: originalJobRef.current?.description || job.description || '',
            toLanguage: locale,
            fromLanguage: 'en'
          })
        })

        if (response.ok) {
          const data = await response.json()
          setJob(prev => prev ? ({
            ...prev,
            title: data.title || prev.title,
            description: data.description || prev.description
          }) : null)
        }
      } catch (error) {
        console.error('Auto-translation error:', error)
      }
    }

    translateJob()
  }, [locale, job?.id]) // Only re-run when locale or job ID changes

  const handleImproveDescription = () => {
    setIsImproving(true)
    // Simulate AI processing
    setTimeout(() => {
      setImprovedDescription(`🚀 Join TechCorp GmbH as a Senior Frontend Developer and Shape the Future of Web Development!

Are you passionate about creating exceptional user experiences? We're seeking a talented Senior Frontend Developer to join our innovative team in Berlin and help build cutting-edge web applications that impact thousands of users daily.

🎯 What You'll Do:
• Lead frontend development using React, TypeScript, and the latest web technologies
• Collaborate with our world-class design and backend teams to create seamless user experiences
• Architect scalable, high-performance applications that delight our users
• Mentor junior developers and contribute to our engineering culture
• Drive technical decisions and best practices across the frontend stack

✨ What Makes You Perfect:
• 5+ years of frontend mastery with React, TypeScript, HTML5, and CSS3
• Experience with modern tooling (Webpack, Vite, Next.js)
• Passion for responsive design and pixel-perfect implementations
• Git expertise and collaborative development experience
• Problem-solving mindset with keen attention to detail

🌟 Why You'll Love Working Here:
• Competitive €70,000 - €90,000 salary package
• Flexible hybrid work model - work from our modern Berlin office or remotely
• Unlimited learning budget for conferences, courses, and certifications
• State-of-the-art equipment and tools
• Vibrant team culture with regular team events and hackathons
• Comprehensive health benefits and wellness programs

Ready to make your mark in tech? Apply now and let's build something amazing together! 🚀`)
      setIsImproving(false)
    }, 2000)
  }

  const handleShare = async () => {
    if (!job) return

    const shareData = {
      title: job.title,
      text: `Check out this job at ${job.company}: ${job.title}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied",
          description: "Job link copied to clipboard",
        })
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        })
      }
    }
  }

  if (loadingJob) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-28 md:pt-32 lg:pt-36 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">{t('jobs.detail.loadingTitle')}</h1>
          <p className="text-muted-foreground mb-6">{t('jobs.detail.loadingDescription')}</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-28 md:pt-32 lg:pt-36 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">{t('jobs.detail.notFoundTitle')}</h1>
          <p className="text-muted-foreground mb-6">{t('jobs.detail.notFoundDescription')}</p>
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/jobs">{t('jobs.detail.backToJobs')}</Link>
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  // Derive display fields from aggregator job
  const salaryText = job.salary?.text || (
    job.salary?.min || job.salary?.max
      ? `${job.salary?.min ? `€${job.salary.min.toLocaleString()}` : ''}${job.salary?.min && job.salary?.max ? ' - ' : ''}${job.salary?.max ? `€${job.salary.max.toLocaleString()}` : ''}`
      : undefined
  )
  const jobType = job.employmentType ? job.employmentType.replace('_', ' ') : undefined
  const postedDate = job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : undefined
  const cleanedDescription = sanitizeJobDescription(job.description || "")

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-28 md:pt-32 lg:pt-36 container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground">
            <Link href="/jobs" className="inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('jobs.detail.backToJobs')}
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <img
                      src={"/placeholder-logo.svg"}
                      alt={`${job.company} logo`}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-2xl">{job.title}</CardTitle>
                        <TranslateButton
                          text={job.title}
                          onTranslate={(t) => setJob(prev => prev ? ({ ...prev, title: t }) : null)}
                          className="text-gray-400 hover:text-blue-600"
                        />
                      </div>
                      <CardDescription className="text-lg flex items-center mt-1">
                        <Building2 className="h-4 w-4 mr-1" />
                        {job.company}
                      </CardDescription>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </div>
                        {salaryText && (
                          <div className="flex items-center">
                            <Euro className="h-4 w-4 mr-1" />
                            {salaryText}
                          </div>
                        )}
                        {jobType && (
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-1" />
                            {jobType}
                          </div>
                        )}
                        {postedDate && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {postedDate}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!job) return

                        if (!user) {
                          router.push('/login')
                          return
                        }

                        try {
                          const response = await fetch('/api/saved/jobs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: job.id,
                              title: job.title,
                              description: cleanedDescription,
                              company: job.company,
                              location: job.location,
                              employmentType: job.employmentType,
                              experienceLevel: job.experienceLevel,
                              salaryMin: job.salary?.min,
                              salaryMax: job.salary?.max,
                              salaryCurrency: job.salary?.currency || 'EUR',
                              salaryPeriod: 'yearly',
                              isRemote: false,
                              skills: job.skills,
                              applicationUrl: job.applicationUrl,
                              source: job.source
                            }),
                          })
                          const data = await response.json()
                          if (data.success) {
                            toast({
                              title: t('jobs.detail.savedTitle'),
                              description: t('jobs.detail.savedDescription')
                            })
                          } else {
                            toast({
                              title: t('jobs.detail.saveErrorTitle'),
                              description: data.error || t('jobs.detail.saveErrorDescription'),
                              variant: 'destructive'
                            })
                          }
                        } catch (error) {
                          console.error('Error saving job:', error)
                          toast({
                            title: t('notifications.error'),
                            description: t('jobs.detail.saveErrorDescription'),
                            variant: 'destructive'
                          })
                        }
                      }}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  {jobType && <Badge variant="secondary" className="capitalize">{jobType}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">{t('jobs.detail.descriptionTitle')}</h3>
                      <TranslateButton
                        text={cleanedDescription}
                        onTranslate={(t) => setJob(prev => prev ? ({ ...prev, description: t }) : null)}
                        contentType="job_description"
                        className="text-gray-400 hover:text-blue-600"
                      />
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{cleanedDescription}</pre>
                    </div>
                  </div>

                  {/* AI Improve Description */}
                  <div className={`border rounded-lg p-4 bg-muted/50 ${!canUseAI ? 'opacity-60' : ''}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                      <h4 className="font-semibold flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-accent" />
                        {t('jobs.detail.aiEnhancedTitle')}
                      </h4>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto">
                        {!canUseAI && (
                          <Link
                            href="/pricing"
                            className="text-xs text-muted-foreground hover:underline text-left sm:text-right"
                          >
                            {t('jobs.detail.upgradeToUse')}
                          </Link>
                        )}
                        <Button
                          onClick={handleImproveDescription}
                          disabled={isImproving || !canUseAI}
                          size="sm"
                          className="w-full sm:w-auto bg-accent text-accent-foreground"
                          aria-disabled={!canUseAI}
                          title={!canUseAI ? t('jobs.detail.subscribersOnly') : undefined}
                        >
                          {isImproving ? t('jobs.detail.improving') : t('jobs.detail.improveWithAI')}
                        </Button>
                      </div>
                    </div>
                    {improvedDescription ? (
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-background p-4 rounded border">
                          {improvedDescription}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {canUseAI
                          ? t('jobs.detail.aiHelpText')
                          : t('jobs.detail.aiUpgradeText')}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {Array.isArray((job as any).benefits) && (job as any).benefits.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">{t('jobs.detail.benefitsTitle')}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {(job as any).benefits.map((benefit: string) => (
                          <Badge key={benefit} variant="secondary" className="justify-center py-2">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}

          <div className="space-y-6">
            {/* Apply Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('jobs.detail.applyTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.applicationUrl && (
                  <Button asChild className="w-full" size="lg">
                    <a href={job.applicationUrl}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('jobs.apply')}
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={async () => {
                    if (!job) return

                    if (!user) {
                      router.push('/login')
                      return
                    }

                    try {
                      const response = await fetch('/api/saved/jobs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: job.id,
                          title: job.title,
                          description: cleanedDescription,
                          company: job.company,
                          location: job.location,
                          employmentType: job.employmentType,
                          experienceLevel: job.experienceLevel,
                          salaryMin: job.salary?.min,
                          salaryMax: job.salary?.max,
                          salaryCurrency: job.salary?.currency || 'EUR',
                          salaryPeriod: 'yearly',
                          isRemote: false,
                          skills: job.skills,
                          applicationUrl: job.applicationUrl,
                          source: job.source
                        }),
                      })
                      const data = await response.json()
                      if (data.success) {
                        toast({
                          title: t('jobs.detail.savedTitle'),
                          description: t('jobs.detail.savedDescription')
                        })
                      } else {
                        toast({
                          title: t('jobs.detail.saveErrorTitle'),
                          description: data.error || t('jobs.detail.saveErrorDescription'),
                          variant: 'destructive'
                        })
                      }
                    } catch (error) {
                      console.error('Error saving job:', error)
                      toast({
                        title: t('notifications.error'),
                        description: t('jobs.detail.saveErrorDescription'),
                        variant: 'destructive'
                      })
                    }
                  }}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {t('jobs.detail.saveJobButton')}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t('jobs.detail.termsNotice')}
                </p>
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t('jobs.detail.aboutCompany')} {job.company}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  {job.companySize}
                </div>
                <div className="flex items-center text-sm">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  {job.industry}
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  {t('jobs.detail.foundedIn')} 2015
                </div>
                {(job as any).website && (
                  <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
                    <Link href={(job as any).website} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('jobs.detail.visitWebsite')}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Related Jobs moved to full-width section below */}
          </div>
        </div >
        {/* Recommended Jobs - full width, 3 in a row */}
        < section className="mt-8" >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t('jobs.detail.recommendedTitle')}</h2>
            <Button variant="outline" className="bg-transparent" asChild>
              <Link href="/jobs">{t('common.viewAll')}</Link>
            </Button>
          </div>
          {
            loadingRelated ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t('jobs.detail.loadingRecommended')}</p>
            ) : relatedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t('jobs.detail.noRecommendations')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedJobs.map((relatedJob) => {
                  const salaryText = relatedJob.salary?.text || (
                    relatedJob.salary?.min || relatedJob.salary?.max
                      ? `€${relatedJob.salary?.min?.toLocaleString() || ''} - €${relatedJob.salary?.max?.toLocaleString() || ''}`
                      : null
                  )
                  return (
                    <Card key={`${relatedJob.source}-${relatedJob.externalId || relatedJob.id}`} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <Link
                          href={`/jobs/${encodeURIComponent(relatedJob.externalId || relatedJob.id)}?source=${encodeURIComponent(relatedJob.source)}`}
                          onClick={() => {
                            try {
                              const key = `job:${relatedJob.source}:${relatedJob.externalId || relatedJob.id}`
                              sessionStorage.setItem(key, JSON.stringify(relatedJob))
                            } catch { }
                          }}
                        >
                          <h4 className="font-medium hover:text-accent transition-colors line-clamp-2">{relatedJob.title}</h4>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">{relatedJob.company}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground truncate mr-2">{relatedJob.location}</span>
                          {salaryText && (
                            <span className="text-sm font-medium text-accent">{salaryText}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
          }
        </section >
      </main >

      <Footer />
    </div >
  )
}

export default function JobDetailPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <JobDetailContent {...props} />
    </Suspense>
  )
}
