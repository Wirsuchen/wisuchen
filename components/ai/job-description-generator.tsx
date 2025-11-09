'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface JobDescriptionGeneratorProps {
  onGenerated?: (description: string) => void
  initialData?: {
    jobTitle?: string
    company?: string
    location?: string
    employmentType?: string
    existingDescription?: string
  }
}

export function JobDescriptionGenerator({ onGenerated, initialData }: JobDescriptionGeneratorProps) {
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle || '')
  const [company, setCompany] = useState(initialData?.company || '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [employmentType, setEmploymentType] = useState(initialData?.employmentType || 'Full-time')
  const [requirements, setRequirements] = useState('')
  const [benefits, setBenefits] = useState('')
  const [existingDescription, setExistingDescription] = useState(initialData?.existingDescription || '')
  const [generatedDescription, setGeneratedDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const mdToHtmlBasic = (md: string) => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    let html = esc(md)
    html = html.replace(/^###\s+(.*)$/gm, '<h3>$1<\/h3>')
    html = html.replace(/^##\s+(.*)$/gm, '<h2>$1<\/h2>')
    html = html.replace(/^#\s+(.*)$/gm, '<h1>$1<\/h1>')
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1<\/strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1<\/em>')
    const lines = html.split('\n')
    let out: string[] = []
    let inList = false
    for (const line of lines) {
      if (/^\-\s+/.test(line)) {
        if (!inList) { out.push('<ul>'); inList = true }
        out.push(`<li>${line.replace(/^\-\s+/, '')}<\/li>`)
      } else {
        if (inList) { out.push('<\/ul>'); inList = false }
        if (line.trim().length) out.push(`<p>${line}<\/p>`)
      }
    }
    if (inList) out.push('<\/ul>')
    return out.join('\n')
  }

  const handleGenerate = async () => {
    if (!jobTitle || !company) {
      toast({
        title: 'Missing Information',
        description: 'Please provide at least job title and company name',
        variant: 'destructive',
      })
      return
    }

    setGeneratedDescription('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          company,
          location,
          employmentType,
          requirements: requirements.split('\n').filter((r) => r.trim()),
          benefits: benefits.split('\n').filter((b) => b.trim()),
          existingDescription,
        }),
      })

      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''
        for (const msg of parts) {
          // Expect lines like: data: {"text":"..."}
          const lines = msg.split('\n')
          let dataLine = lines.find((l) => l.startsWith('data: ')) || ''
          if (dataLine) {
            try {
              const payload = JSON.parse(dataLine.replace('data: ', ''))
              if (payload?.text) {
                fullText += payload.text
                setGeneratedDescription(fullText)
              }
            } catch {}
          }
        }
      }
      if (fullText) {
        onGenerated?.(fullText)
        toast({ title: '✨ Description Generated!', description: 'AI has created your job description' })
      }
    } catch (error) {
      console.error('Error generating description:', error)
      toast({ title: 'Error', description: 'Failed to connect to AI service', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedDescription)
    setCopied(true)
    toast({
      title: 'Copied!',
      description: 'Job description copied to clipboard',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Job Description Generator
          </CardTitle>
          <CardDescription>
            Generate professional job descriptions using AI or improve existing ones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Full Stack Developer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Tech Corp GmbH"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Berlin, Germany"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <Input
                id="employmentType"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                placeholder="e.g., Full-time"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements (one per line)</Label>
            <Textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="5+ years React experience&#10;TypeScript expertise&#10;Team leadership skills"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefits">Benefits (one per line)</Label>
            <Textarea
              id="benefits"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="Competitive salary&#10;Remote work options&#10;Health insurance"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="existing">Existing Description (optional - to improve)</Label>
            <Textarea
              id="existing"
              value={existingDescription}
              onChange={(e) => setExistingDescription(e.target.value)}
              placeholder="Paste your current job description here if you want to improve it..."
              rows={6}
            />
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Description
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedDescription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Description</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none bg-muted/50 p-4 rounded-lg" dangerouslySetInnerHTML={{ __html: mdToHtmlBasic(generatedDescription) }} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
