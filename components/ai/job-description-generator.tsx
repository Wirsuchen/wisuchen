'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/contexts/i18n-context'

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
  const { t } = useTranslation()
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
        title: t('jobDescriptionGenerator.errors.missingInfo.title'),
        description: t('jobDescriptionGenerator.errors.missingInfo.description'),
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
        toast({ 
          title: t('jobDescriptionGenerator.success.generated.title'), 
          description: t('jobDescriptionGenerator.success.generated.description') 
        })
      }
    } catch (error) {
      console.error('Error generating description:', error)
      toast({ 
        title: t('jobDescriptionGenerator.errors.aiService.title'), 
        description: t('jobDescriptionGenerator.errors.aiService.description'), 
        variant: 'destructive' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedDescription)
    setCopied(true)
    toast({
      title: t('jobDescriptionGenerator.success.copied.title'),
      description: t('jobDescriptionGenerator.success.copied.description'),
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t('jobDescriptionGenerator.title')}
          </CardTitle>
          <CardDescription>
            {t('jobDescriptionGenerator.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">{t('jobDescriptionGenerator.form.jobTitle')} *</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={t('jobDescriptionGenerator.form.jobTitlePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">{t('jobDescriptionGenerator.form.companyName')} *</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t('jobDescriptionGenerator.form.companyNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t('jobDescriptionGenerator.form.location')}</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('jobDescriptionGenerator.form.locationPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType">{t('jobDescriptionGenerator.form.employmentType')}</Label>
              <Input
                id="employmentType"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                placeholder={t('jobDescriptionGenerator.form.employmentTypePlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">{t('jobDescriptionGenerator.form.requirements')}</Label>
            <Textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder={t('jobDescriptionGenerator.form.requirementsPlaceholder')}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefits">{t('jobDescriptionGenerator.form.benefits')}</Label>
            <Textarea
              id="benefits"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder={t('jobDescriptionGenerator.form.benefitsPlaceholder')}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="existing">{t('jobDescriptionGenerator.form.existingDescription')}</Label>
            <Textarea
              id="existing"
              value={existingDescription}
              onChange={(e) => setExistingDescription(e.target.value)}
              placeholder={t('jobDescriptionGenerator.form.existingDescriptionPlaceholder')}
              rows={6}
            />
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('jobDescriptionGenerator.form.generating')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t('jobDescriptionGenerator.form.generate')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedDescription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('jobDescriptionGenerator.results.title')}</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t('jobDescriptionGenerator.results.copied')}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    {t('jobDescriptionGenerator.results.copy')}
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
