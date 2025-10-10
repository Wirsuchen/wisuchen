"use client"

import { useState } from "react"
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

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [isImproving, setIsImproving] = useState(false)
  const [improvedDescription, setImprovedDescription] = useState("")

  // Mock job data - in real app, fetch based on params.id
  const job = {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp GmbH",
    location: "Berlin, Germany",
    salary: "€70,000 - €90,000",
    type: "Full-time",
    category: "Technology",
    description: `We are looking for an experienced Frontend Developer to join our dynamic team and help build the next generation of web applications.

Key Responsibilities:
• Develop and maintain high-quality web applications using React, TypeScript, and modern frontend technologies
• Collaborate with designers and backend developers to implement user-friendly interfaces
• Optimize applications for maximum speed and scalability
• Write clean, maintainable, and well-documented code
• Participate in code reviews and contribute to team best practices

Requirements:
• 5+ years of experience in frontend development
• Strong proficiency in React, TypeScript, HTML5, and CSS3
• Experience with modern build tools and workflows (Webpack, Vite, etc.)
• Knowledge of responsive design and cross-browser compatibility
• Experience with version control systems (Git)
• Strong problem-solving skills and attention to detail

What We Offer:
• Competitive salary and benefits package
• Flexible working hours and remote work options
• Professional development opportunities
• Modern office in the heart of Berlin
• Great team culture and collaborative environment`,
    postedDate: "2 days ago",
    featured: true,
    logo: "/abstract-tech-logo.png",
    applicants: 45,
    companySize: "50-200 employees",
    industry: "Technology",
    website: "https://techcorp.example.com",
    benefits: ["Health Insurance", "Flexible Hours", "Remote Work", "Professional Development", "Free Lunch"],
  }

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
                      src={job.logo || "/placeholder.svg"}
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
                        <div className="flex items-center">
                          <Euro className="h-4 w-4 mr-1" />
                          {formatEuroText(job.salary)}
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {job.type}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {job.postedDate}
                        </div>
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
                  <Badge variant={job.featured ? "default" : "secondary"}>{job.category}</Badge>
                  {job.featured && <Badge className="bg-accent text-accent-foreground">Featured</Badge>}
                  <Badge variant="outline">{job.applicants} applicants</Badge>
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

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Benefits & Perks</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {job.benefits.map((benefit) => (
                        <Badge key={benefit} variant="secondary" className="justify-center py-2">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
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
                <Button className="w-full" size="lg">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apply Now
                </Button>
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
                <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
                  <Link href={job.website} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </Link>
                </Button>
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
