'use client'

import { useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BlogGenerator } from '@/components/ai/blog-generator'
import { SEOGenerator } from '@/components/ai/seo-generator'
import { TranslateButton } from '@/components/ai/translate-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Save, Eye, Languages } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export default function CreateBlogPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showAI, setShowAI] = useState(true)
  const [language, setLanguage] = useState<'de' | 'en' | 'fr' | 'it'>('en')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'job-tips',
    author: '',
    tags: '',
    metaDescription: '',
    keywords: [] as string[],
  })

  const handleAIGenerated = (content: string) => {
    setFormData((prev) => ({ ...prev, content }))
    setShowAI(false)
    toast({
      title: '✨ Content Generated!',
      description: 'AI has created your blog article',
    })
  }

  const handleTranslated = (translation: string, targetLang: 'de' | 'en' | 'fr' | 'it') => {
    setFormData((prev) => ({ ...prev, content: translation }))
    setLanguage(targetLang)
    toast({
      title: `Translated to ${targetLang.toUpperCase()}`,
      description: 'Content has been translated',
    })
  }

  const handleSEOGenerated = (data: { metaDescription?: string; keywords?: string[] }) => {
    setFormData((prev) => ({
      ...prev,
      metaDescription: data.metaDescription || prev.metaDescription,
      keywords: data.keywords || prev.keywords,
    }))
  }

  const handleSave = async (status: 'draft' | 'published') => {
    // TODO: Implement save to database
    toast({
      title: status === 'draft' ? 'Draft Saved' : 'Published!',
      description: `Blog post has been ${status === 'draft' ? 'saved as draft' : 'published'}`,
    })
    
    // Redirect after save
    setTimeout(() => {
      router.push('/admin')
    }, 2000)
  }

  return (
    <PageLayout showBackButton={true} containerClassName="max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Blog Article</h1>
            <p className="text-muted-foreground">Use AI to generate content or write manually</p>
          </div>
          <Button variant="outline" onClick={() => setShowAI(!showAI)}>
            <Sparkles className="h-4 w-4 mr-2" />
            {showAI ? 'Hide AI' : 'Show AI Generator'}
          </Button>
        </div>

        {/* AI Generator Section */}
        {showAI && (
          <BlogGenerator onGenerated={handleAIGenerated} />
        )}

        {/* Manual Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Blog Content</CardTitle>
            <CardDescription>
              Write or edit your blog article {formData.content && `(Language: ${language.toUpperCase()})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Top 10 Interview Tips for 2025"
              />
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job-tips">Job Tips</SelectItem>
                    <SelectItem value="recruiting">Recruiting</SelectItem>
                    <SelectItem value="market-insights">Market Insights</SelectItem>
                    <SelectItem value="career-advice">Career Advice</SelectItem>
                    <SelectItem value="deals">Deals & Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                  placeholder="Author name"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt / Summary</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief summary of the article..."
                rows={3}
              />
            </div>

            {/* Content with Translation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Article Content *</Label>
                {formData.content && (
                  <TranslateButton
                    content={formData.content}
                    currentLanguage={language}
                    onTranslated={handleTranslated}
                    contentType="blog_article"
                  />
                )}
              </div>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write your article content here..."
                rows={20}
                className="font-mono text-sm"
              />
              {formData.content && (
                <p className="text-sm text-muted-foreground">
                  {formData.content.split(' ').length} words, {formData.content.length} characters
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="job search, career tips, remote work"
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO Section */}
        {formData.title && formData.content && (
          <SEOGenerator
            title={formData.title}
            content={formData.content}
            onGenerated={handleSEOGenerated}
          />
        )}

        {/* SEO Fields */}
        {(formData.metaDescription || formData.keywords.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>SEO Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.metaDescription && (
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={formData.metaDescription}
                    onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                    rows={2}
                  />
                </div>
              )}
              {formData.keywords.length > 0 && (
                <div className="space-y-2">
                  <Label>SEO Keywords</Label>
                  <Input
                    value={formData.keywords.join(', ')}
                    onChange={(e) => setFormData((prev) => ({ ...prev, keywords: e.target.value.split(',').map(k => k.trim()) }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => handleSave('draft')}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={() => handleSave('published')}>
                <Eye className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
