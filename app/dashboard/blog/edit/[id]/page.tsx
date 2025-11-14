'use client'

import { useRef, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SEOGenerator } from '@/components/ai/seo-generator'
import { TranslateButton } from '@/components/ai/translate-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Eye, Loader2, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function EditBlogPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const postId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    status: 'draft' as 'draft' | 'published' | 'archived',
  })
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    loadPost()
  }, [postId])

  const loadPost = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/blog/posts/${postId}`)
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to load' }))
        throw new Error(error.error || 'Failed to load post')
      }
      const data = await res.json()
      const post = data.post

      // Map category slug back to form category
      const categorySlugToForm: Record<string, string> = {
        'career-tips': 'job-tips',
        'industry-news': 'recruiting',
      }
      const formCategory = post.category_id 
        ? categorySlugToForm[post.category?.slug || ''] || 'job-tips'
        : 'job-tips'

      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        category: formCategory,
        author: post.author?.full_name || '',
        tags: '',
        metaDescription: post.seo_description || '',
        keywords: post.seo_keywords ? (typeof post.seo_keywords === 'string' ? post.seo_keywords.split(',').map(k => k.trim()) : post.seo_keywords) : [],
        status: post.status || 'draft',
      })
      setFeaturedImageUrl(post.featured_image_url || '')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load blog post',
        variant: 'destructive',
      })
      router.push('/dashboard/blog')
    } finally {
      setLoading(false)
    }
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

  const handleSave = async (status?: 'draft' | 'published') => {
    const categoryMap: Record<string, string | null> = {
      'job-tips': 'career-tips',
      'recruiting': 'industry-news',
      'market-insights': 'industry-news',
      'career-advice': 'career-tips',
      'deals': null,
    }
    const categorySlug = categoryMap[formData.category] ?? null
    const finalStatus = status || formData.status
    
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          status: finalStatus,
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
        title: finalStatus === 'draft' ? 'Draft Updated' : 'Published!',
        description: `Post updated with slug: ${data.post.slug}`,
      })
      setTimeout(() => {
        router.push('/dashboard/blog')
      }, 1200)
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Unable to save post', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blogs
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Edit Blog Article</h1>
          <p className="text-muted-foreground">Update your blog post content and settings</p>
        </div>
      </div>

      {/* Manual Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Content</CardTitle>
          <CardDescription>
            Edit your blog article {formData.content && `(Language: ${language.toUpperCase()})`}
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
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
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
      <Card>
        <CardHeader>
          <CardTitle>SEO Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Meta Description</Label>
            <Textarea
              value={formData.metaDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>SEO Keywords</Label>
            <Input
              value={formData.keywords.join(', ')}
              onChange={(e) => setFormData((prev) => ({ ...prev, keywords: e.target.value.split(',').map(k => k.trim()) }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>
            <Button onClick={() => handleSave('published')} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

