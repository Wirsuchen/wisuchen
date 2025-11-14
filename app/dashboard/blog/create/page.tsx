'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BlogGenerator } from '@/components/ai/blog-generator'
import { SEOGenerator } from '@/components/ai/seo-generator'
import { TranslateButton } from '@/components/ai/translate-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Save, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleAIGenerated = (content: string) => {
    setFormData((prev) => ({ ...prev, content }))
    setShowAI(false)
    toast({
      title: '✨ Content Generated!',
      description: 'AI has created your blog article',
    })
  }

  const onPickImage = () => fileInputRef.current?.click()

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' })
      return
    }
    setUploadingImage(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'png'
      const nameSanitized = file.name.replace(/[^a-zA-Z0-9_.-]+/g, '-')
      const path = `blog/featured/${Date.now()}-${Math.random().toString(36).slice(2)}-${nameSanitized}`
      const { error: uploadErr } = await supabase.storage.from('public-media').upload(path, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })
      if (uploadErr) throw uploadErr

      const { data: pub } = supabase.storage.from('public-media').getPublicUrl(path)
      const publicUrl = pub?.publicUrl
      if (!publicUrl) throw new Error('Failed to generate public URL')

      // Try setting uploaded_by to current profile if available
      let uploadedBy: string | null = null
      const { data: auth } = await supabase.auth.getUser()
      if (auth?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', auth.user.id)
          .maybeSingle()
        uploadedBy = profile?.id ?? null
      }

      await supabase.from('media_files').insert({
        filename: nameSanitized,
        original_filename: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: uploadedBy,
        bucket_name: 'public-media',
        is_public: true,
        alt_text: formData.title || null,
      })

      setFeaturedImageUrl(publicUrl)
      toast({ title: 'Image uploaded', description: 'Featured image is set.' })
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message || 'Could not upload image', variant: 'destructive' })
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
    const categoryMap: Record<string, string | null> = {
      'job-tips': 'career-tips',
      'recruiting': 'industry-news',
      'market-insights': 'industry-news',
      'career-advice': 'career-tips',
      'deals': null,
    }
    const categorySlug = categoryMap[formData.category] ?? null
    try {
      const res = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          status,
          seoTitle: formData.title,
          seoDescription: formData.metaDescription || formData.excerpt,
          seoKeywords: formData.keywords,
          categorySlug,
          featuredImageUrl: featuredImageUrl || null,
        }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Failed to save' }))
        throw new Error(error || 'Failed to save')
      }
      const data = await res.json()
      toast({
        title: status === 'draft' ? 'Draft Saved' : 'Published!',
        description: `Post ${status} with slug: ${data.slug}`,
      })
      setTimeout(() => {
        router.push('/dashboard')
      }, 1200)
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Unable to save post', variant: 'destructive' })
    }
  }

  return (
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

          {/* Featured Image */}
          <div className="space-y-2">
            <Label>Featured Image</Label>
            {featuredImageUrl ? (
              <div className="space-y-2">
                <div className="w-full h-48 border rounded-md overflow-hidden bg-muted">
                  <img src={featuredImageUrl} alt="Featured" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={onPickImage} disabled={uploadingImage}>
                    {uploadingImage ? 'Uploading...' : 'Change Image'}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setFeaturedImageUrl('')}
                    disabled={uploadingImage}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="outline" type="button" onClick={onPickImage} disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading...' : 'Upload Featured Image'}
                </Button>
                <p className="text-sm text-muted-foreground">PNG, JPG up to ~5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelected}
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
            <RichTextEditor
              value={formData.content}
              onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
              placeholder="Write your article content here..."
            />
            {formData.content && (
              <p className="text-sm text-muted-foreground">
                {formData.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length} words, {formData.content.replace(/<[^>]+>/g, '').length} characters
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
  )
}

