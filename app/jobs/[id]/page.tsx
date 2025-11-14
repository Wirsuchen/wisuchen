"use client"

import { useEffect, useState } from "react"
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
import { useSearchParams } from "next/navigation"
import type { Job } from "@/hooks/use-jobs"
import { fetchWithCache } from "@/lib/utils/client-cache"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [isImproving, setIsImproving] = useState(false)
  const [improvedDescription, setImprovedDescription] = useState("")
  const searchParams = useSearchParams()
  const [jobId, setJobId] = useState<string | null>(null)
  const { user } = useAuth()
  const canUseAI = !!(user && (user.isSubscribed || ['pro','premium'].includes(user.plan || '')))

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

  // Unwrap params
  useEffect(() => {
    params.then(p => setJobId(p.id))
  }, [params])

  useEffect(() => {
    if (!jobId) return
    const source = searchParams.get('source') || 'rapidapi'
    const storageKey = `job:${source}:${jobId}`
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as ExtJob
        setJob(parsed)
      }
    } catch {}
  }, [jobId, searchParams])

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

  if (!job) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-28 md:pt-32 lg:pt-36 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Job not found</h1>
          <p className="text-muted-foreground mb-6">Open a job from the jobs list to view its details.</p>
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/jobs">Back to Jobs</Link>
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

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-28 md:pt-32 lg:pt-36 container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground">
            <Link href="/jobs" className="inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
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
                      <CardTitle className="text-2xl">{job.title}</CardTitle>
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
                        try {
                          const response = await fetch('/api/saved/jobs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: job.id,
                              title: job.title,
                              description: job.description,
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
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
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
                    <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{job.description}</pre>
                    </div>
                  </div>

                  {/* AI Improve Description */}
                  <div className={`border rounded-lg p-4 bg-muted/50 ${!canUseAI ? 'opacity-60' : ''}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                      <h4 className="font-semibold flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-accent" />
                        AI-Enhanced Description
                      </h4>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto">
                        {!canUseAI && (
                          <Link
                            href="/pricing"
                            className="text-xs text-muted-foreground hover:underline text-left sm:text-right"
                          >
                            Upgrade to use
                          </Link>
                        )}
                        <Button
                          onClick={handleImproveDescription}
                          disabled={isImproving || !canUseAI}
                          size="sm"
                          className="w-full sm:w-auto bg-accent text-accent-foreground"
                          aria-disabled={!canUseAI}
                          title={!canUseAI ? 'Available for subscribers only' : undefined}
                        >
                          {isImproving ? "Improving..." : "Improve with AI"}
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
                          ? 'Click "Improve with AI" to see an enhanced version of this job description with better formatting and more engaging language.'
                          : 'This feature is available for subscribers. Upgrade to unlock AI-enhanced descriptions.'}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {Array.isArray((job as any).benefits) && (job as any).benefits.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Benefits & Perks</h3>
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
                <CardTitle>Apply for this position</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.applicationUrl && (
                  <Button asChild className="w-full" size="lg">
                    <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apply Now
                    </a>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent"
                  onClick={async () => {
                    if (!job) return
                    try {
                      const response = await fetch('/api/saved/jobs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: job.id,
                          title: job.title,
                          description: job.description,
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
                  <Heart className="h-4 w-4 mr-2" />
                  Save Job
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By applying, you agree to our Terms of Service and Privacy Policy
                </p>
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>About {job.company}</CardTitle>
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
                  Founded in 2015
                </div>
                {(job as any).website && (
                  <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
                    <Link href={(job as any).website} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Website
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Related Jobs moved to full-width section below */}
          </div>
        </div>
        {/* Recommended Jobs - full width, 3 in a row */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recommended Jobs</h2>
            <Button variant="outline" className="bg-transparent" asChild>
              <Link href="/jobs">View All</Link>
            </Button>
          </div>
          {loadingRelated ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading recommended jobs...</p>
          ) : relatedJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recommendations available</p>
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
                          } catch {}
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
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
