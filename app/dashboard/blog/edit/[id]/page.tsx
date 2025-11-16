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
import { useTranslation } from '@/contexts/i18n-context'

export default function EditBlogPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
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
        const error = await res.json().catch(() => ({ error: t('blog.admin.loadError') }))
        throw new Error(error.error || t('blog.admin.loadError'))
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
        title: t('common.error'),
        description: error.message || t('blog.admin.loadError'),
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
      toast({ title: t('blog.admin.image.invalid'), description: t('blog.admin.image.selectImage'), variant: 'destructive' })
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
      toast({ title: t('blog.admin.image.uploaded'), description: t('blog.admin.image.set') })
    } catch (err: any) {
      toast({ title: t('blog.admin.image.uploadFailed'), description: err?.message || t('blog.admin.image.uploadError'), variant: 'destructive' })
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleTranslated = (translation: string, targetLang: 'de' | 'en' | 'fr' | 'it') => {
    setFormData((prev) => ({ ...prev, content: translation }))
    setLanguage(targetLang)
    toast({
      title: t('blog.admin.translate.translatedTo', { lang: targetLang.toUpperCase() }),
      description: t('blog.admin.translate.translated'),
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
        const { error } = await res.json().catch(() => ({ error: t('blog.admin.saveError') }))
        throw new Error(error || t('blog.admin.saveError'))
      }
      const data = await res.json()
      toast({
        title: finalStatus === 'draft' ? t('blog.admin.edit.draftUpdated') : t('blog.admin.published'),
        description: t('blog.admin.edit.postUpdated', { slug: data.post.slug }),
      })
      setTimeout(() => {
        router.push('/dashboard/blog')
      }, 1200)
    } catch (e: any) {
      toast({ title: t('blog.admin.saveFailed'), description: e?.message || t('blog.admin.unableToSave'), variant: 'destructive' })
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
                {t('blog.admin.edit.backToBlogs')}
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{t('blog.admin.edit.title')}</h1>
          <p className="text-muted-foreground">{t('blog.admin.edit.description')}</p>
        </div>
      </div>

      {/* Manual Editor */}
      <Card>
        <CardHeader>
          <CardTitle>{t('blog.admin.create.content')}</CardTitle>
          <CardDescription>
            {t('blog.admin.edit.editArticle')} {formData.content && t('blog.admin.create.language', { lang: language.toUpperCase() })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('blog.admin.create.title')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder={t('blog.admin.create.titlePlaceholder')}
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t('blog.admin.create.category')}</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job-tips">{t('blog.admin.create.categories.jobTips')}</SelectItem>
                  <SelectItem value="recruiting">{t('blog.admin.create.categories.recruiting')}</SelectItem>
                  <SelectItem value="market-insights">{t('blog.admin.create.categories.marketInsights')}</SelectItem>
                  <SelectItem value="career-advice">{t('blog.admin.create.categories.careerAdvice')}</SelectItem>
                  <SelectItem value="deals">{t('blog.admin.create.categories.deals')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t('blog.admin.edit.status')}</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t('blog.admin.filter.draft')}</SelectItem>
                  <SelectItem value="published">{t('blog.admin.filter.published')}</SelectItem>
                  <SelectItem value="archived">{t('blog.admin.edit.archived')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">{t('blog.admin.create.excerpt')}</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              placeholder={t('blog.admin.create.excerptPlaceholder')}
              rows={3}
            />
          </div>

          {/* Featured Image */}
          <div className="space-y-2">
            <Label>{t('blog.admin.create.featuredImage')}</Label>
            {featuredImageUrl ? (
              <div className="space-y-2">
                <div className="w-full h-48 border rounded-md overflow-hidden bg-muted">
                  <img src={featuredImageUrl} alt={t('blog.admin.create.featured')} className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={onPickImage} disabled={uploadingImage}>
                    {uploadingImage ? t('blog.admin.create.uploading') : t('blog.admin.create.changeImage')}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setFeaturedImageUrl('')}
                    disabled={uploadingImage}
                  >
                    {t('common.remove')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="outline" type="button" onClick={onPickImage} disabled={uploadingImage}>
                  {uploadingImage ? t('blog.admin.create.uploading') : t('blog.admin.create.uploadImage')}
                </Button>
                <p className="text-sm text-muted-foreground">{t('blog.admin.create.imageInfo')}</p>
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
              <Label htmlFor="content">{t('blog.admin.create.articleContent')} *</Label>
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
              placeholder={t('blog.admin.create.contentPlaceholder')}
            />
            {formData.content && (
              <p className="text-sm text-muted-foreground">
                {t('blog.admin.create.wordCount', { 
                  words: formData.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length,
                  characters: formData.content.replace(/<[^>]+>/g, '').length
                })}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">{t('blog.admin.create.tags')}</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder={t('blog.admin.create.tagsPlaceholder')}
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
          <CardTitle>{t('blog.admin.create.seoMetadata')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('blog.admin.create.metaDescription')}</Label>
            <Textarea
              value={formData.metaDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('blog.admin.create.seoKeywords')}</Label>
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
                  {t('blog.admin.edit.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('blog.admin.create.saveDraft')}
                </>
              )}
            </Button>
            <Button onClick={() => handleSave('published')} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('blog.admin.edit.publishing')}
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  {t('blog.admin.create.publish')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

