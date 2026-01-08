'use client'

import { PageLayout } from "@/components/layout/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, ShoppingBag, TrendingUp, Users, Star, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import CountUp from "@/components/count-up"
import RotatingText from "@/components/rotating-text"
import { ShimmerButton } from "@/components/magicui/shimmer-button"
import { DotPattern } from "@/components/magicui/dot-pattern"
import { formatEuroText, formatEuro } from "@/lib/utils"
import { fetchWithCache } from "@/lib/utils/client-cache"
import { useTranslation, useLocale } from "@/contexts/i18n-context"
import { useState, useEffect } from "react"
import { useTranslatedText, useTranslatedJob } from "@/hooks/use-auto-translate-content"
import type { Job } from "@/hooks/use-jobs"

interface Deal {
  id: string
  title: string
  currentPrice: number
  originalPrice: number
  discount: number
  store: string
  rating: number
  image: string
  description?: string
}

// Normalize various employment type shapes to our i18n keys
function normalizeEmploymentType(input: string): string {
  const key = input.toLowerCase().replace(/[\s-]+/g, '_').trim()
  const aliases: Record<string, string> = {
    fulltime: 'full_time',
    ft: 'full_time',
    parttime: 'part_time',
    pt: 'part_time',
    permanent: 'full_time',
    contract_full_time: 'full_time',
    contract_part_time: 'part_time',
  }
  return aliases[key] || key
}

function dedupeJobs(jobs: Job[]): Job[] {
  const normalize = (s?: string | null) =>
    (s || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ') // drop parenthetical like (all genders)
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

function FeaturedJobCard({ job }: { job: Job }) {
  const { t } = useTranslation()
  const { translatedJob } = useTranslatedJob(job)
  const title = translatedJob.title
  const description = translatedJob.description

  const salaryText = job.salary?.text || (
    job.salary?.min || job.salary?.max
      ? `${job.salary?.min ? `€${job.salary.min.toLocaleString()}` : ''}${job.salary?.min && job.salary?.max ? ' - ' : ''}${job.salary?.max ? `€${job.salary.max.toLocaleString()}` : ''}`
      : undefined
  )

  const typeKey = job.employmentType
    ? normalizeEmploymentType(job.employmentType)
    : undefined

  const jobTypeLabel = typeKey
    ? (() => {
      const tKey = `jobs.${typeKey}`
      const translated = t(tKey)
      return translated !== tKey ? translated : typeKey.replace(/_/g, ' ')
    })()
    : undefined

  const handleOpen = () => {
    try {
      const storageKey = `job:${job.source}:${job.externalId || job.id}`
      sessionStorage.setItem(storageKey, JSON.stringify({ ...job, title, description }))
    } catch { }
  }

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold line-clamp-2" title={title}>
              {title}
            </CardTitle>
            <CardDescription className="truncate mt-1" title={job.company}>
              {job.company}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2 text-red-500 shrink-0" />
            <span className="truncate" title={job.location}>{job.location}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {salaryText ? (
              <span className="font-semibold text-accent text-sm truncate max-w-[60%]" title={salaryText}>{salaryText}</span>
            ) : <span></span>}
            {jobTypeLabel && (
              <Badge variant="outline" className="capitalize shrink-0 text-xs font-normal">{jobTypeLabel}</Badge>
            )}
          </div>
        </div>
        <Button className="w-full bg-transparent mt-auto" variant="outline" asChild>
          <Link href={`/jobs/${encodeURIComponent(job.externalId || job.id)}?source=${encodeURIComponent(job.source)}`} onClick={handleOpen}>
            {t('home.viewDetails')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const { t, tr } = useTranslation()
  const locale = useLocale() // Get current locale for backend translations
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [topDeals, setTopDeals] = useState<Deal[]>([])
  const [dealsLoading, setDealsLoading] = useState(true)
  const [topJobs, setTopJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/jobs')
    }
  }

  // Real counts from APIs
  const [stats, setStats] = useState({
    activeJobs: 1000,
    dailyDeals: 100,
    happyUsers: 2000 // Hardcoded to 2k+
  })


  useEffect(() => {
    fetchTopDeals()
    fetchTopJobs()
    fetchStats()
  }, [locale]) // Refetch when locale changes to get translated content

  const fetchTopDeals = async () => {
    try {
      setDealsLoading(true)
      // Use cache with 1 hour TTL, include locale for backend translations
      // Backend will return translated content based on locale parameter
      const data = await fetchWithCache<any>(
        `/api/deals?page=1&limit=6&locale=${locale}`,
        undefined,
        { page: 1, limit: 6, locale },
        60 * 60 * 1000
      )
      const deals: Deal[] = data?.deals || []
      // Data is already translated by backend, use directly
      setTopDeals(deals.length > 0 ? deals.slice(0, 3) : [])
    } catch (error) {
      console.error('Error fetching deals:', error)
      setTopDeals([])
    } finally {
      setDealsLoading(false)
    }
  }

  const fetchTopJobs = async () => {
    try {
      setJobsLoading(true)
      // Use cache with 1 hour TTL, include locale for backend translations
      // Backend will return translated content based on locale parameter
      // Only show jobs that have all 4 language translations
      const data = await fetchWithCache<any>(
        `/api/v1/jobs/search?limit=9&useCache=true&countries=de,at,ch&locale=${locale}&useDatabase=true&requireFullTranslation=true`,
        undefined,
        { limit: 9, countries: ['de', 'at', 'ch'], locale, requireFullTranslation: true },
        60 * 60 * 1000
      )
      const jobs: Job[] = data?.data?.jobs || []
      const uniqueJobs = dedupeJobs(jobs)
      // Data is already translated by backend, use directly
      setTopJobs(uniqueJobs.length > 0 ? uniqueJobs.slice(0, 6) : [])
    } catch (e) {
      console.error('Error fetching jobs:', e)
      setTopJobs([])
    } finally {
      setJobsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch actual total jobs count from all sources (cached)
      // Request with limit=500 to get maximum jobs and use the total count
      const jobsResponse = await fetch('/api/v1/jobs/search?limit=500&useCache=true')
      const jobsData = await jobsResponse.json()

      // Get the actual total count from all aggregated sources
      const totalJobs = jobsData?.data?.pagination?.total || jobsData?.data?.total || 0
      console.log('📊 Jobs API response:', {
        total: totalJobs,
        sources: jobsData?.data?.meta?.sources,
        cached: jobsData?.data?.meta?.cached
      })

      // Fetch deals count - get larger sample since API might not return total count
      const dealsResponse = await fetch('/api/deals?page=1&limit=50')
      const dealsData = await dealsResponse.json()
      const totalDeals = dealsData?.pagination?.total || dealsData?.deals?.length || 0
      console.log('🛍️ Deals API response:', { total: totalDeals, pagination: dealsData?.pagination, dealsCount: dealsData?.deals?.length })

      // Show actual counts (no artificial minimums)
      // Note: happyUsers is hardcoded to 20000 (20k+)
      setStats({
        activeJobs: totalJobs || 50, // Show actual count, fallback to 50 if API fails
        dailyDeals: totalDeals || 100, // Show actual count, fallback to 100 if API fails
        happyUsers: 2000 // Hardcoded to 20k+
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Keep default values on error
    }
  }




  const blogPosts = [
    {
      id: 1,
      title: t('home.blogPost1Title'),
      excerpt: t('home.blogPost1Excerpt'),
      category: t('home.blogPost1Category'),
      readTime: t('home.blogPost1ReadTime'),
    },
    {
      id: 2,
      title: t('home.blogPost2Title'),
      excerpt: t('home.blogPost2Excerpt'),
      category: t('home.blogPost2Category'),
      readTime: t('home.blogPost2ReadTime'),
    },
    {
      id: 3,
      title: t('home.blogPost3Title'),
      excerpt: t('home.blogPost3Excerpt'),
      category: t('home.blogPost3Category'),
      readTime: t('home.blogPost3ReadTime'),
    },
  ]

  return (
    <PageLayout showBackButton={false} containerClassName="">
      <>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/50 py-8 sm:py-12 md:py-16">
          {/* Dot pattern background */}
          <DotPattern
            width={24}
            height={24}
            cx={1}
            cy={1}
            cr={1}
            className="text-neutral-400/30 [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_20%,transparent_80%)]"
          />
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight mb-4 sm:mb-6">
              {t('home.heroTitle')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              {t('home.heroDescription')}
            </p>

            {/* Hero Search */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6 sm:mb-8">
              <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('home.searchPlaceholder')}
                    className="h-11 sm:h-12 text-base sm:text-lg"
                  />
                </div>
                <ShimmerButton
                  type="submit"
                  shimmerColor="#ffffff"
                  background="var(--primary)"
                  className="h-11 sm:h-12 px-6 sm:px-8 w-full md:w-auto text-primary-foreground"
                >
                  <Search className="h-5 w-5 mr-2" />
                  {t('common.search')}
                </ShimmerButton>
              </div>
            </form>

            {/* Quick Location Links */}
            <div className="max-w-2xl mx-auto mb-2 sm:mb-4">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm">
                <Link
                  href="/jobs?location=Germany"
                  className="inline-flex items-center rounded-full border px-3 py-1 bg-background hover:bg-accent/50 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-1 text-red-500" />
                  {t('home.jobsIn')} {t('home.germany', 'Germany')}
                </Link>
                <Link
                  href="/jobs?location=Austria"
                  className="inline-flex items-center rounded-full border px-3 py-1 bg-background hover:bg-accent/50 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-1 text-red-500" />
                  {t('home.jobsIn')} {t('home.austria', 'Austria')}
                </Link>
                <Link
                  href="/jobs?location=Switzerland"
                  className="inline-flex items-center rounded-full border px-3 py-1 bg-background hover:bg-accent/50 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-1 text-red-500" />
                  {t('home.jobsIn')} {t('home.switzerland', 'Switzerland')}
                </Link>
              </div>
            </div>

            {/* Quick Stats - Real Counts from APIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">
                  <CountUp to={stats.activeJobs} from={0} duration={1.2} />+
                </div>
                <div className="text-sm text-muted-foreground">{t('home.activeJobs')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">
                  <CountUp to={stats.dailyDeals} from={0} duration={1.2} delay={0.1} />+
                </div>
                <div className="text-sm text-muted-foreground">{t('home.dailyDeals')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">
                  {t('home.happyUsersCount', '2k+')}
                </div>
                <div className="text-sm text-muted-foreground">{t('home.happyUsers')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Jobs Section */}
        <section className="py-10 sm:py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t('home.featuredJobs')}</h2>
                <p className="text-muted-foreground">{t('home.featuredJobsDesc')}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/jobs">
                  {t('home.viewAllJobs')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
              {jobsLoading ? (
                <div className="col-span-full flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
              ) : topJobs.length > 0 ? (
                topJobs.map((job) => {
                  const key = `${job.source}-${job.externalId || job.id}`
                  return <FeaturedJobCard key={key} job={job} />
                })
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  {t('common.notAvailable')}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Top Deals Section */}
        <section className="py-10 sm:py-12 md:py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t('home.topDeals')}</h2>
                <p className="text-muted-foreground">{t('home.topDealsDesc')}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/deals">
                  {t('home.viewAllDeals')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {dealsLoading ? (
                <div className="col-span-full flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : topDeals.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  {t('common.notAvailable')}
                </div>
              ) : (
                topDeals.map((deal) => (
                  <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">
                          {deal.title}
                        </CardTitle>
                        <Badge className="bg-accent text-accent-foreground shrink-0">{tr('deals.percentOff', { percent: deal.discount })}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Deal Image */}
                      {deal.image && (
                        <div className="mb-4">
                          <img
                            src={deal.image}
                            alt={deal.title}
                            className="w-full h-44 sm:h-40 object-cover rounded-md"
                          />
                        </div>
                      )}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-accent">{formatEuro(deal.currentPrice)}</span>
                          <span className="text-sm text-muted-foreground line-through">{formatEuro(deal.originalPrice)}</span>
                        </div>
                        <div className="flex items-center justify-end">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm">{deal.rating}</span>
                          </div>
                        </div>
                      </div>
                      <Button className="w-full mt-4" asChild>
                        <Link href={`/deals/${deal.id}`}>
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          {t('home.viewDeal')}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section className="py-10 sm:py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t('home.latestInsights')}</h2>
                <p className="text-muted-foreground">{t('home.latestInsightsDesc')}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/blog">
                  {t('home.viewAllPosts')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {blogPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <span className="text-sm text-muted-foreground">{post.readTime}</span>
                    </div>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                    <CardDescription>{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href={`/blog/${post.id}`}>{t('home.readMore')}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.readyToStart')}</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {t('home.readyToStartDesc')}
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="w-full md:w-auto" asChild>
                <Link href="/jobs">
                  <Users className="h-5 w-5 mr-2" />
                  {t('home.findJobs')}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full md:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
                asChild
              >
                <Link href="/deals">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  {t('home.browseDeals')}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </>
    </PageLayout>
  )
}
