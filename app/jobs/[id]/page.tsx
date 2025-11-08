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

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [isImproving, setIsImproving] = useState(false)
  const [improvedDescription, setImprovedDescription] = useState("")
  const searchParams = useSearchParams()

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

  useEffect(() => {
    const source = searchParams.get('source') || 'rapidapi'
    const storageKey = `job:${source}:${params.id}`
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as ExtJob
        setJob(parsed)
      }
    } catch {}
  }, [params.id, searchParams])

  const relatedJobs = [
    {
      id: 2,
      title: "Frontend Developer",
      company: "StartupXYZ",
      location: "Munich, Germany",
      salary: "€55,000 - €70,000",
      type: "Full-time",
    },
    {
      id: 3,
      title: "React Developer",
      company: "WebTech Solutions",
      location: "Hamburg, Germany",
      salary: "€60,000 - €75,000",
      type: "Full-time",
    },
    {
      id: 4,
      title: "Full Stack Developer",
      company: "DigitalCorp",
      location: "Frankfurt, Germany",
      salary: "€65,000 - €85,000",
      type: "Full-time",
    },
  ]

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
        <main className="pt-24 container mx-auto px-4 py-16 text-center">
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

      <main className="pt-24 container mx-auto px-4 py-8">
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
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  {jobType && <Badge variant="secondary" className="capitalize">{jobType}</Badge>}
                  <Badge variant="outline">Source: {job.source}</Badge>
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
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-accent" />
                        AI-Enhanced Description
                      </h4>
                      <Button
                        onClick={handleImproveDescription}
                        disabled={isImproving}
                        size="sm"
                        className="bg-accent text-accent-foreground"
                      >
                        {isImproving ? "Improving..." : "Improve with AI"}
                      </Button>
                    </div>
                    {improvedDescription ? (
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-background p-4 rounded border">
                          {improvedDescription}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click "Improve with AI" to see an enhanced version of this job description with better
                        formatting and more engaging language.
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
                <Button variant="outline" className="w-full bg-transparent">
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

            {/* Related Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedJobs.map((relatedJob) => (
                  <div key={relatedJob.id} className="border rounded-lg p-3">
                    <Link href={`/jobs/${relatedJob.id}`}>
                      <h4 className="font-medium hover:text-accent transition-colors">{relatedJob.title}</h4>
                    </Link>
                    <p className="text-sm text-muted-foreground">{relatedJob.company}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">{relatedJob.location}</span>
                      <span className="text-sm font-medium text-accent">{formatEuroText(relatedJob.salary)}</span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/jobs">View All Jobs</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
