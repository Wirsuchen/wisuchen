'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, Copy, Check, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/contexts/i18n-context'

interface BlogGeneratorProps {
  onGenerated?: (content: string) => void
}

export function BlogGenerator({ onGenerated }: BlogGeneratorProps) {
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('job_market')
  const [targetAudience, setTargetAudience] = useState<'job_seekers' | 'employers' | 'general'>('general')
  const [tone, setTone] = useState<'professional' | 'casual' | 'informative'>('professional')
  const [language, setLanguage] = useState<'de' | 'en' | 'fr' | 'it'>('en')
  const [keywords, setKeywords] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleGenerate = async () => {
    if (!topic) {
      toast({
        title: t('ai.blogGenerator.missingInfoTitle', 'Missing Information'),
        description: t('ai.blogGenerator.missingInfoDescription', 'Please provide a topic for the article'),
        variant: 'destructive',
      })
      return
    }

    setGeneratedContent('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          category,
          targetAudience,
          tone,
          language,
          keywords: keywords.split(',').map((k) => k.trim()).filter((k) => k),
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
          const line = msg.split('\n').find(l => l.startsWith('data: ')) || ''
          if (line) {
            try {
              const payload = JSON.parse(line.replace('data: ', ''))
              if (payload?.text) {
                fullText += payload.text
                setGeneratedContent(fullText)
              }
            } catch {}
          }
        }
      }
      if (fullText) {
        onGenerated?.(fullText)
        toast({
          title: t('ai.blogGenerator.generatedTitle', '✨ Article Generated!'),
          description: t('ai.blogGenerator.generatedDescription', 'AI has created your blog article'),
        })
      }
    } catch (error) {
      console.error('Error generating article:', error)
      toast({
        title: t('common.error', 'Error'),
        description: t('ai.blogGenerator.errorConnecting', 'Failed to connect to AI service'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent)
    setCopied(true)
    toast({
      title: t('ai.blogGenerator.copiedTitle', 'Copied!'),
      description: t('ai.blogGenerator.copiedDescription', 'Article content copied to clipboard'),
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              {t('ai.blogGenerator.title', 'AI Blog Article Generator')}
            </CardTitle>
            <CardDescription>
              {t('ai.blogGenerator.description', 'Generate comprehensive blog articles with AI assistance')}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">{t('ai.blogGenerator.form.topic', 'Article Topic *')}</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t(
                'ai.blogGenerator.form.topicPlaceholder',
                'e.g., Top 10 Interview Tips for Software Engineers in 2025'
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t('ai.blogGenerator.form.category', 'Category')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job_market">
                    {t('ai.blogGenerator.categories.job_market', 'Job Market Trends')}
                  </SelectItem>
                  <SelectItem value="career_advice">
                    {t('ai.blogGenerator.categories.career_advice', 'Career Advice')}
                  </SelectItem>
                  <SelectItem value="recruiting">
                    {t('ai.blogGenerator.categories.recruiting', 'Recruiting Tips')}
                  </SelectItem>
                  <SelectItem value="industry_news">
                    {t('ai.blogGenerator.categories.industry_news', 'Industry News')}
                  </SelectItem>
                  <SelectItem value="how_to">
                    {t('ai.blogGenerator.categories.how_to', 'How-To Guides')}
                  </SelectItem>
                  <SelectItem value="comparisons">
                    {t('ai.blogGenerator.categories.comparisons', 'Comparisons')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">{t('ai.blogGenerator.form.targetAudience', 'Target Audience')}</Label>
              <Select value={targetAudience} onValueChange={(v) => setTargetAudience(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job_seekers">
                    {t('ai.blogGenerator.audiences.job_seekers', 'Job Seekers')}
                  </SelectItem>
                  <SelectItem value="employers">
                    {t('ai.blogGenerator.audiences.employers', 'Employers/Recruiters')}
                  </SelectItem>
                  <SelectItem value="general">
                    {t('ai.blogGenerator.audiences.general', 'General Audience')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">{t('ai.blogGenerator.form.tone', 'Tone')}</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">
                    {t('ai.blogGenerator.tones.professional', 'Professional')}
                  </SelectItem>
                  <SelectItem value="casual">
                    {t('ai.blogGenerator.tones.casual', 'Casual')}
                  </SelectItem>
                  <SelectItem value="informative">
                    {t('ai.blogGenerator.tones.informative', 'Informative')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t('ai.blogGenerator.form.language', 'Language')}</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="de">🇩🇪 German (Deutsch)</SelectItem>
                  <SelectItem value="fr">🇫🇷 French (Français)</SelectItem>
                  <SelectItem value="it">🇮🇹 Italian (Italiano)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">
              {t('ai.blogGenerator.form.keywords', 'SEO Keywords (comma-separated)')}
            </Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={t(
                'ai.blogGenerator.form.keywordsPlaceholder',
                'e.g., job interview, career tips, software developer'
              )}
            />
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('ai.blogGenerator.generating', 'Generating Article...')}
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                {t('ai.blogGenerator.generateButton', 'Generate Blog Article')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('ai.blogGenerator.generatedTitleShort', 'Generated Article')}</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t('ai.blogGenerator.copiedTitle', 'Copied!')}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    {t('ai.blogGenerator.copyButton', 'Copy')}
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none bg-muted/50 p-6 rounded-lg">
              <div className="whitespace-pre-wrap">{generatedContent}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
