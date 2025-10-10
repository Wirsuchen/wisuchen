"use client"

import type React from "react"

import { useState } from "react"
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
import { Upload, Eye, CreditCard, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PostJobPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
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

  const handleSubmit = () => {
    // Simulate payment processing
    setTimeout(() => {
      setStep(4)
      setTimeout(() => {
        router.push("/jobs")
      }, 3000)
    }, 2000)
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-24 container mx-auto px-4 py-8">
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
                <CardTitle>Job Details</CardTitle>
                <CardDescription>Provide the basic information about your job posting</CardDescription>
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
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
                <CardDescription>Provide detailed information about the role and requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                    className="min-h-32"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    placeholder="List the required skills, experience, and qualifications..."
                    className="min-h-24"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange("requirements", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="benefits">Benefits & Perks</Label>
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
                    Preview & Pay
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Preview */}
              <div className="lg:col-span-2">
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
                          <p className="text-sm mt-3 line-clamp-3">{formData.description}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment */}
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
                      <Button onClick={handleSubmit} className="w-full">
                        Pay & Publish Job
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
