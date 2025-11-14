"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Upload, Eye, CreditCard, CheckCircle, Sparkles, Loader2, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { JobDescriptionGenerator } from "@/components/ai/job-description-generator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

export default function PostJobPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [genReqLoading, setGenReqLoading] = useState(false)
  const [genBenLoading, setGenBenLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userJobCount, setUserJobCount] = useState<number | null>(null)
  const [loadingJobCount, setLoadingJobCount] = useState(false)
  const { toast } = useToast()
  
  // Check if user has a paid plan (pro, professional, or business - covers legacy and new values)
  const isPaidUser = !!(user && (user.isSubscribed || ['pro', 'professional', 'business'].includes(user.plan || '')))
  const isFreeUser = user && !isPaidUser && user.role === 'job_seeker'
  // Check if free user has used all 5 free jobs
  const requiresPayment = isFreeUser && userJobCount !== null && userJobCount >= 5
  const hasFreeJobsRemaining = isFreeUser && userJobCount !== null && userJobCount < 5
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    category: "",
    jobType: "",
    salaryMin: "",
    salaryMax: "",
    description: "",
    requirements: "",
    benefits: "",
    logo: null as File | null,
    featured: false,
  })

  const categories = ["Technology", "Marketing", "Sales", "Design", "Finance", "Healthcare", "Education", "Engineering"]

  const jobTypes = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"]

  const handleInputChange = (field: string, value: string | boolean | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const parseStreamToText = async (res: Response, onChunk: (t: string) => void) => {
    if (!res.body) throw new Error('No response body')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''
      for (const msg of parts) {
        const line = msg.split('\n').find(l => l.startsWith('data: ')) || ''
        if (line) {
          try {
            const payload = JSON.parse(line.replace('data: ', ''))
            if (payload?.text) onChunk(payload.text)
          } catch {}
        }
      }
    }
  }

  const handleGenerateRequirements = async () => {
    if (!isPaidUser) {
      toast({
        title: 'Upgrade Required',
        description: 'AI features are available for Professional and Business plan subscribers. Upgrade to unlock this feature.',
        variant: 'destructive',
      })
      return
    }
    
    try {
      setGenReqLoading(true)
      setFormData(prev => ({ ...prev, requirements: '' }))
      const res = await fetch('/api/ai/generate-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          company: formData.company,
          location: formData.location,
          employmentType: formData.jobType,
        })
      })
      let acc = ''
      await parseStreamToText(res, (t) => {
        acc += t
        setFormData(prev => ({ ...prev, requirements: acc }))
      })
      toast({ title: 'Requirements generated' })
    } catch (e) {
      toast({ title: 'Generation failed', variant: 'destructive' })
    } finally {
      setGenReqLoading(false)
    }
  }

  const handleGenerateBenefits = async () => {
    if (!isPaidUser) {
      toast({
        title: 'Upgrade Required',
        description: 'AI features are available for Professional and Business plan subscribers. Upgrade to unlock this feature.',
        variant: 'destructive',
      })
      return
    }
    
    try {
      setGenBenLoading(true)
      setFormData(prev => ({ ...prev, benefits: '' }))
      const res = await fetch('/api/ai/generate-benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          company: formData.company,
          location: formData.location,
          employmentType: formData.jobType,
        })
      })
      let acc = ''
      await parseStreamToText(res, (t) => {
        acc += t
        setFormData(prev => ({ ...prev, benefits: acc }))
      })
      toast({ title: 'Benefits & perks generated' })
    } catch (e) {
      toast({ title: 'Generation failed', variant: 'destructive' })
    } finally {
      setGenBenLoading(false)
    }
  }

  const mdToHtmlBasic = (md: string) => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    let html = esc(md)
    html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
    html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
    html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    const lines = html.split('\n')
    let out: string[] = []
    let inList = false
    for (const line of lines) {
      if (/^\-\s+/.test(line)) {
        if (!inList) { out.push('<ul>'); inList = true }
        out.push(`<li>${line.replace(/^\-\s+/, '')}</li>`)
      } else {
        if (inList) { out.push('</ul>'); inList = false }
        if (line.trim().length) out.push(`<p>${line}</p>`)
      }
    }
    if (inList) out.push('</ul>')
    return out.join('\n')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleInputChange("logo", file)
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  // Load user's job count on mount if free user
  useEffect(() => {
    if (isFreeUser && user) {
      loadUserJobCount()
    }
  }, [isFreeUser, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserJobCount = async () => {
    try {
      setLoadingJobCount(true)
      const res = await fetch('/api/user/ads?limit=100')
      if (res.ok) {
        const data = await res.json()
        setUserJobCount(data.ads?.length || 0)
      }
    } catch (error) {
      console.error('Error loading job count:', error)
    } finally {
      setLoadingJobCount(false)
    }
  }

  const handleSubmit = async () => {
    // Check free user limit before submitting
    if (requiresPayment) {
      // Payment is required but not processed yet
      // TODO: Integrate payment processing here
      toast({
        title: 'Payment Required',
        description: 'Please complete the payment to post your job. Payment processing will be integrated soon.',
        variant: 'destructive',
      })
      return
    }

    // Validate required fields
    if (!formData.title || !formData.description || !formData.company || !formData.location || !formData.category || !formData.jobType) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)

      // Map category name to category_id and company name to company_id
      // First, fetch categories and companies
      const [categoriesRes, companiesRes] = await Promise.all([
        fetch('/api/categories?type=job'),
        fetch('/api/companies'),
      ])

      const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { categories: [] }
      const companiesData = companiesRes.ok ? await companiesRes.json() : { companies: [] }

      // Find matching category (case-insensitive)
      const category = categoriesData.categories?.find(
        (c: any) => c.name.toLowerCase() === formData.category.toLowerCase()
      )
      const category_id = category?.id

      // Find or create company
      let company = companiesData.companies?.find(
        (c: any) => c.name.toLowerCase() === formData.company.toLowerCase()
      )
      let company_id = company?.id

      // If company doesn't exist, create it
      if (!company_id) {
        try {
          // Generate a unique slug to avoid conflicts
          const baseSlug = formData.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          const uniqueSlug = `${baseSlug}-${Date.now()}`
          
          const createCompanyRes = await fetch('/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.company.trim(),
              slug: uniqueSlug,
              is_active: true,
            }),
          })
          
          let companyResponse
          try {
            const responseText = await createCompanyRes.text()
            if (!responseText) {
              throw new Error('Empty response from server')
            }
            companyResponse = JSON.parse(responseText)
          } catch (jsonError: any) {
            console.error('Failed to parse company API response:', jsonError)
            throw new Error(`Invalid response from server. Status: ${createCompanyRes.status}. Please try again.`)
          }
          
          // Handle successful creation (201), existing company (200), or error
          if (createCompanyRes.ok || createCompanyRes.status === 200 || createCompanyRes.status === 201) {
            // Handle both new company creation and existing company cases
            // API returns { company: { id, name, slug } } for new companies (status 201)
            // API returns { company: { id }, message: 'Company already exists' } for existing (status 200)
            company_id = companyResponse.company?.id || companyResponse.id
            
            if (!company_id) {
              console.error('Company API response:', companyResponse)
              console.error('Response status:', createCompanyRes.status)
              throw new Error('Company created but no ID returned. Please try again.')
            }
            
            // Success - company_id is now set
            console.log('Company created/found successfully:', { company_id, name: formData.company })
          } else {
            // Extract the actual error message from the API response
            const errorMessage = companyResponse?.error || companyResponse?.message || `HTTP ${createCompanyRes.status}: Failed to create company`
            const errorDetails = companyResponse?.details || ''
            const errorCode = companyResponse?.code || ''
            
            // Combine error message and details for better debugging
            const fullErrorMessage = errorDetails 
              ? `${errorMessage}: ${errorDetails}${errorCode ? ` (Code: ${errorCode})` : ''}`
              : errorMessage
            
            // Provide more specific error messages based on status
            if (createCompanyRes.status === 401) {
              throw new Error('You must be logged in to create a company. Please log in and try again.')
            } else if (createCompanyRes.status === 400) {
              throw new Error(`Invalid company data: ${fullErrorMessage}`)
            } else if (createCompanyRes.status === 409) {
              // Conflict - company already exists, try to get the existing one
              if (companyResponse.company?.id) {
                company_id = companyResponse.company.id
              } else {
                // Try to fetch the company by name
                const searchRes = await fetch(`/api/companies?search=${encodeURIComponent(formData.company.trim())}`)
                if (searchRes.ok) {
                  const searchData = await searchRes.json()
                  const existingCompany = searchData.companies?.find(
                    (c: any) => c.name.toLowerCase() === formData.company.toLowerCase()
                  )
                  if (existingCompany?.id) {
                    company_id = existingCompany.id
                  } else {
                    throw new Error(`Company conflict detected but could not find existing company. Please try again.`)
                  }
                } else {
                  throw new Error(`Failed to create company: ${fullErrorMessage}`)
                }
              }
            } else if (createCompanyRes.status === 500) {
              // Check if it's a duplicate slug error
              if (errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorCode === '23505' || errorDetails.includes('23505')) {
                // Retry with a more unique slug
                const retrySlug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substring(7)}`
                const retryRes = await fetch('/api/companies', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: formData.company.trim(),
                    slug: retrySlug,
                    is_active: true,
                  }),
                })
                const retryResponse = await retryRes.json()
                if (retryRes.ok && retryResponse.company?.id) {
                  company_id = retryResponse.company.id
                } else {
                  const retryErrorDetails = retryResponse?.details || ''
                  const retryFullError = retryErrorDetails 
                    ? `${retryResponse.error || errorMessage}: ${retryErrorDetails}`
                    : retryResponse.error || errorMessage
                  throw new Error(`Failed to create company: ${retryFullError}`)
                }
              } else {
                throw new Error(`Failed to create company: ${fullErrorMessage}`)
              }
            } else {
              throw new Error(`Failed to create company: ${fullErrorMessage}`)
            }
          }
        } catch (error: any) {
          console.error('Error creating company:', error)
          // Re-throw if it's already our custom error
          if (error.message && (
              error.message.startsWith('Failed to create company') || 
              error.message.startsWith('You must be logged in') ||
              error.message.startsWith('Invalid company data') ||
              error.message.startsWith('Company created but no ID') ||
              error.message.startsWith('Invalid response from server')
            )) {
            throw error
          }
          // Otherwise wrap in a more user-friendly error
          throw new Error(`Failed to create company: ${error.message || 'Unknown error occurred. Please try again.'}`)
        }
      }
      
      // Ensure we have a company_id before proceeding
      if (!company_id) {
        throw new Error('Unable to get or create company. Please try again.')
      }

      if (!category_id) {
        throw new Error(`Category "${formData.category}" not found. Please select a valid category.`)
      }

      // Map job type to employment_type enum
      const employmentTypeMap: Record<string, string> = {
        'Full-time': 'full_time',
        'Part-time': 'part_time',
        'Contract': 'contract',
        'Freelance': 'freelance',
        'Internship': 'internship',
      }
      const employment_type = employmentTypeMap[formData.jobType] || 'full_time'

      // Prepare job data
      const jobData = {
        title: formData.title,
        description: formData.description + (formData.requirements ? `\n\n**Requirements:**\n${formData.requirements}` : '') + (formData.benefits ? `\n\n**Benefits:**\n${formData.benefits}` : ''),
        category_id,
        company_id,
        location: formData.location,
        employment_type,
        salary_min: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salary_max: formData.salaryMax ? parseInt(formData.salaryMax) : null,
        salary_currency: 'EUR',
        salary_period: 'yearly',
        featured: formData.featured,
      }

      // Submit job
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      })

      const data = await res.json()

      if (!res.ok) {
        // Handle job limit error
        if (res.status === 403 && data.error?.includes('Free users can create up to')) {
          toast({
            title: 'Job Limit Reached',
            description: data.error || 'Free users can create up to 5 jobs. Please upgrade to create more.',
            variant: 'destructive',
          })
          setUserJobCount(5) // Update local count
          return
        }
        throw new Error(data.error || 'Failed to create job')
      }

      toast({
        title: 'Job Created!',
        description: 'Your job posting has been submitted successfully.',
      })

      // Update job count for free users
      if (isFreeUser && userJobCount !== null) {
        setUserJobCount(userJobCount + 1)
      }

      // Show success step
      setStep(4)
      setTimeout(() => {
        router.push("/jobs")
      }, 3000)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create job. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-28 md:pt-32 lg:pt-36 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNumber ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-16 h-1 mx-2 ${step > stepNumber ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                <CardTitle>Job Details</CardTitle>
                <CardDescription>Provide the basic information about your job posting</CardDescription>
                  </div>
                  {isFreeUser && userJobCount !== null && (
                    <Badge variant={userJobCount >= 5 ? "destructive" : "secondary"}>
                      {userJobCount}/5 jobs used
                    </Badge>
                  )}
                </div>
                {isFreeUser && userJobCount !== null && userJobCount >= 5 && (
                  <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive font-medium">
                      You've reached the limit of 5 jobs for free users. Upgrade to create more jobs.
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Senior Frontend Developer"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company Name *</Label>
                    <Input
                      id="company"
                      placeholder="e.g. TechCorp GmbH"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Berlin, Germany"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="jobType">Job Type *</Label>
                    <Select value={formData.jobType} onValueChange={(value) => handleInputChange("jobType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="salaryMin">Minimum Salary (€)</Label>
                    <Input
                      id="salaryMin"
                      type="number"
                      placeholder="50000"
                      value={formData.salaryMin}
                      onChange={(e) => handleInputChange("salaryMin", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salaryMax">Maximum Salary (€)</Label>
                    <Input
                      id="salaryMax"
                      type="number"
                      placeholder="70000"
                      value={formData.salaryMax}
                      onChange={(e) => handleInputChange("salaryMax", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="logo">Company Logo</Label>
                  <div className="mt-2">
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {formData.logo ? formData.logo.name : "Click to upload logo (optional)"}
                        </p>
                      </div>
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNext} disabled={!formData.title || !formData.company || !formData.location}>
                    Next Step
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* AI Generator Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        AI Job Description Generator
                        {!isPaidUser && (
                          <Badge variant="secondary" className="ml-2">
                            <Lock className="h-3 w-3 mr-1" />
                            Pro Feature
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {isPaidUser 
                          ? 'Let AI create a professional job description for you'
                          : 'Upgrade to Professional or Business plan to unlock AI-powered job description generation'
                        }
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!isPaidUser) {
                          toast({
                            title: 'Upgrade Required',
                            description: 'AI features are available for Professional and Business plan subscribers.',
                            variant: 'destructive',
                          })
                          return
                        }
                        setShowAIGenerator(!showAIGenerator)
                      }}
                      disabled={!isPaidUser}
                    >
                      {showAIGenerator ? 'Hide AI Generator' : 'Use AI Generator'}
                    </Button>
                  </div>
                </CardHeader>
                {showAIGenerator && isPaidUser && (
                  <CardContent>
                    <JobDescriptionGenerator
                      initialData={{
                        jobTitle: formData.title,
                        company: formData.company,
                        location: formData.location,
                        employmentType: formData.jobType,
                        existingDescription: formData.description,
                      }}
                      onGenerated={(description) => {
                        handleInputChange("description", description)
                        setShowAIGenerator(false)
                        setShowPreview(true)
                      }}
                    />
                  </CardContent>
                )}
                {!isPaidUser && (
                  <CardContent>
                    <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                      <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">AI Features Locked</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upgrade to Professional or Business plan to unlock AI-powered job description generation
                      </p>
                      <Button asChild>
                        <Link href="/pricing">View Plans</Link>
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Manual Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                  <CardDescription>
                    {showAIGenerator 
                      ? 'Or write your own job description manually' 
                      : 'Provide detailed information about the role and requirements'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Job Description *</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="bg-transparent">
                        {showPreview ? 'Edit Description' : 'Preview'}
                      </Button>
                    </div>
                    {!showPreview ? (
                      <>
                        <Textarea
                          id="description"
                          placeholder="Describe the role, responsibilities, and what you're looking for..."
                          className="min-h-32"
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                        />
                        {formData.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {formData.description.length} characters
                          </p>
                        )}
                      </>
                    ) : (
                      formData.description && (
                        <div className="mt-2 p-4 border rounded-lg bg-muted/40 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: mdToHtmlBasic(formData.description) }} />
                      )
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requirements">Requirements</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGenerateRequirements} 
                        disabled={genReqLoading || !isPaidUser} 
                        className="bg-transparent"
                        title={!isPaidUser ? 'Upgrade to Professional or Business plan to use AI features' : ''}
                      >
                        {genReqLoading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
                        ) : (
                          <><Sparkles className="h-4 w-4 mr-2" />AI Generate {!isPaidUser && <Lock className="h-3 w-3 ml-1" />}</>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      id="requirements"
                      placeholder="List the required skills, experience, and qualifications..."
                      className="min-h-24"
                      value={formData.requirements}
                      onChange={(e) => handleInputChange("requirements", e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="benefits">Benefits & Perks</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGenerateBenefits} 
                        disabled={genBenLoading || !isPaidUser} 
                        className="bg-transparent"
                        title={!isPaidUser ? 'Upgrade to Professional or Business plan to use AI features' : ''}
                      >
                        {genBenLoading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
                        ) : (
                          <><Sparkles className="h-4 w-4 mr-2" />AI Generate {!isPaidUser && <Lock className="h-3 w-3 ml-1" />}</>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      id="benefits"
                      placeholder="Describe the benefits, perks, and what makes your company great..."
                      className="min-h-24"
                      value={formData.benefits}
                      onChange={(e) => handleInputChange("benefits", e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => handleInputChange("featured", checked as boolean)}
                    />
                    <Label htmlFor="featured" className="text-sm">
                      Make this a featured job (+€10)
                    </Label>
                    <Badge variant="secondary">Recommended</Badge>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleBack} className="bg-transparent">
                      Back
                    </Button>
                    <Button onClick={handleNext} disabled={!formData.description}>
                      {requiresPayment ? 'Preview & Pay' : 'Preview & Post'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 3 && (
            <div className={`grid grid-cols-1 ${requiresPayment ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
              {/* Preview */}
              <div className={requiresPayment ? 'lg:col-span-2' : ''}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center">
                      <Eye className="h-5 w-5 mr-2" />
                      <CardTitle>Job Preview</CardTitle>
                    </div>
                    <CardDescription>This is how your job posting will appear to candidates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          {formData.logo ? (
                            <img
                              src={URL.createObjectURL(formData.logo) || "/placeholder.svg"}
                              alt="Company logo"
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold">{formData.company.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{formData.title}</h3>
                          <p className="text-muted-foreground">{formData.company}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{formData.location}</span>
                            {formData.salaryMin && formData.salaryMax && (
                              <span>
                                €{formData.salaryMin} - €{formData.salaryMax}
                              </span>
                            )}
                            <span>{formData.jobType}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-3">
                            <Badge>{formData.category}</Badge>
                            {formData.featured && <Badge className="bg-accent text-accent-foreground">Featured</Badge>}
                          </div>
                          <div
                            className="text-sm mt-3 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: mdToHtmlBasic(formData.description) }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment - Only show if payment is required */}
              {requiresPayment && (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Job Posting (30 days)</span>
                        <span>€5.00</span>
                      </div>
                      {formData.featured && (
                        <div className="flex justify-between">
                          <span>Featured Listing</span>
                          <span>€10.00</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>€{formData.featured ? "15.00" : "5.00"}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="expiry">Expiry</Label>
                          <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" placeholder="123" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                        <Button 
                          onClick={handleSubmit} 
                          className="w-full"
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating Job...
                            </>
                          ) : (
                            'Pay & Publish Job'
                          )}
                      </Button>
                      <Button variant="outline" onClick={handleBack} className="w-full bg-transparent">
                        Back to Edit
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Your job will be live immediately after payment confirmation
                    </p>
                  </CardContent>
                </Card>
              </div>
              )}

              {/* Post Button - Show when free jobs are available or user is paid */}
              {(hasFreeJobsRemaining || isPaidUser || (!isFreeUser && user)) && (
                <div className="flex flex-col space-y-2">
                  {hasFreeJobsRemaining && userJobCount !== null && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Free Job Posting Available!</strong> You have {5 - userJobCount} free job{5 - userJobCount > 1 ? 's' : ''} remaining.
                      </p>
                    </div>
                  )}
                  <Button 
                    onClick={handleSubmit} 
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting Job...
                      </>
                    ) : (
                      'Post Job'
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleBack} className="w-full bg-transparent">
                    Back to Edit
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Your job will be live immediately after posting
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <Card className="text-center">
              <CardContent className="py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Job Posted Successfully!</h2>
                <p className="text-muted-foreground mb-6">
                  Your job posting is now live and visible to thousands of candidates.
                </p>
                <div className="space-y-2">
                  <Button asChild>
                    <a href="/jobs">View All Jobs</a>
                  </Button>
                  <p className="text-sm text-muted-foreground">Redirecting to jobs page...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
