'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SEOGeneratorProps {
  title: string
  content: string
  onGenerated?: (data: { metaDescription?: string; keywords?: string[] }) => void
}

export function SEOGenerator({ title, content, onGenerated }: SEOGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [metaDescription, setMetaDescription] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const { toast } = useToast()

  const handleGenerate = async (type: 'meta' | 'keywords' | 'both') => {
    if (!title || !content) {
      toast({ title: 'Missing Content', description: 'Title and content are required for SEO generation', variant: 'destructive' })
      return
    }

    setMetaDescription('')
    setKeywords([])
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: content.substring(0, 1000),
          type,
          maxLength: 160,
          maxKeywords: 10,
        }),
      })

      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let metaAccum = ''
      let kwAccum = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const messages = buffer.split('\n\n')
        buffer = messages.pop() || ''
        for (const msg of messages) {
          const lines = msg.split('\n')
          const event = lines.find(l => l.startsWith('event: '))?.replace('event: ', '')
          const dataLine = lines.find(l => l.startsWith('data: '))?.replace('data: ', '')
          if (!dataLine) continue
          try {
            const payload = JSON.parse(dataLine)
            const text = (payload?.text || '') as string
            if (!text) continue
            if (event === 'meta') {
              metaAccum += text
              setMetaDescription(metaAccum)
            } else if (event === 'keywords') {
              kwAccum += text
              const kws = kwAccum.split(',').map(k => k.trim()).filter(Boolean)
              setKeywords(kws)
            }
          } catch {}
        }
      }

      onGenerated?.({ metaDescription: metaAccum || undefined, keywords: kwAccum ? kwAccum.split(',').map(k => k.trim()).filter(Boolean) : undefined })
      toast({ title: '✨ SEO Generated!', description: 'AI has created your SEO metadata' })
    } catch (error) {
      console.error('Error generating SEO:', error)
      toast({ title: 'Error', description: 'Failed to connect to AI service', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-500" />
          AI SEO Generator
        </CardTitle>
        <CardDescription>
          Generate SEO-optimized meta descriptions and keywords
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => handleGenerate('meta')}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Meta Description
          </Button>

          <Button
            onClick={() => handleGenerate('keywords')}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Keywords
          </Button>

          <Button
            onClick={() => handleGenerate('both')}
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Both
          </Button>
        </div>

        {metaDescription && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Meta Description ({metaDescription.length}/160)</label>
            <div className="p-3 bg-muted/50 rounded-md text-sm">
              {metaDescription}
            </div>
          </div>
        )}

        {keywords.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">SEO Keywords ({keywords.length})</label>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
