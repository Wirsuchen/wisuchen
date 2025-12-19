'use client'

import { useRef, useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
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
import { Sparkles, Save, Eye, Languages } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/contexts/i18n-context'

export default function CreateBlogPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
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
      title: '✨ ' + t('admin.blogCreate.contentGenerated'),
      description: t('admin.blogCreate.aiCreatedArticle'),
    })
  }

  const onPickImage = () => fileInputRef.current?.click()

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: t('admin.blogCreate.invalidFile'), description: t('admin.blogCreate.selectImageFile'), variant: 'destructive' })
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

      await (supabase as any).from('media_files').insert({
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
      toast({ title: t('admin.blogCreate.imageUploaded'), description: t('admin.blogCreate.featuredImageSet') })
    } catch (err: any) {
      toast({ title: t('admin.blogCreate.uploadFailed'), description: err?.message || t('admin.blogCreate.couldNotUploadImage'), variant: 'destructive' })
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleTranslated = (translation: string, targetLang: 'de' | 'en' | 'fr' | 'it') => {
    setFormData((prev) => ({ ...prev, content: translation }))
    setLanguage(targetLang)
    toast({
      title: t('admin.blogCreate.translatedTo', { lang: targetLang.toUpperCase() }),
      description: t('admin.blogCreate.contentTranslated'),
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
        const { error } = await res.json().catch(() => ({ error: t('admin.blogCreate.failedToSave') }))
        throw new Error(error || t('admin.blogCreate.failedToSave'))
      }
      const data = await res.json()
      toast({
        title: status === 'draft' ? t('admin.blogCreate.draftSaved') : t('admin.blogCreate.published'),
        description: t('admin.blogCreate.postSavedWithSlug', { status, slug: data.slug }),
      })
      setTimeout(() => {
        router.push('/admin')
      }, 1200)
    } catch (e: any) {
      toast({ title: t('admin.blogCreate.saveFailed'), description: e?.message || t('admin.blogCreate.unableToSavePost'), variant: 'destructive' })
    }
  }

  return (
    <PageLayout showBackButton={true} containerClassName="max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('admin.blogCreate.title')}</h1>
            <p className="text-muted-foreground">{t('admin.blogCreate.subtitle')}</p>
          </div>
          <Button variant="outline" onClick={() => setShowAI(!showAI)}>
            <Sparkles className="h-4 w-4 mr-2" />
            {showAI ? t('admin.blogCreate.hideAI') : t('admin.blogCreate.showAIGenerator')}
          </Button>
        </div>

        {/* AI Generator Section */}
        {showAI && (
          <BlogGenerator onGenerated={handleAIGenerated} />
        )}

        {/* Manual Editor */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.blogCreate.blogContent')}</CardTitle>
            <CardDescription>
              {t('admin.blogCreate.writeOrEdit')} {formData.content && `(${t('admin.blogCreate.language')}: ${language.toUpperCase()})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('admin.blogCreate.titleLabel')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t('admin.blogCreate.titlePlaceholder')}
              />
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t('admin.blogCreate.category')}</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job-tips">{t('admin.blogCreate.categories.jobTips')}</SelectItem>
                    <SelectItem value="recruiting">{t('admin.blogCreate.categories.recruiting')}</SelectItem>
                    <SelectItem value="market-insights">{t('admin.blogCreate.categories.marketInsights')}</SelectItem>
                    <SelectItem value="career-advice">{t('admin.blogCreate.categories.careerAdvice')}</SelectItem>
                    <SelectItem value="deals">{t('admin.blogCreate.categories.deals')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">{t('admin.blogCreate.author')}</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                  placeholder={t('admin.blogCreate.authorPlaceholder')}
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">{t('admin.blogCreate.excerpt')}</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder={t('admin.blogCreate.excerptPlaceholder')}
                rows={3}
              />
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
              <Label>{t('admin.blogCreate.featuredImage')}</Label>
              {featuredImageUrl ? (
                <div className="space-y-2">
                  <div className="w-full h-48 border rounded-md overflow-hidden bg-muted">
                    <img src={featuredImageUrl} alt="Featured" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" type="button" onClick={onPickImage} disabled={uploadingImage}>
                      {uploadingImage ? t('admin.blogCreate.uploading') : t('admin.blogCreate.changeImage')}
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setFeaturedImageUrl('')}
                      disabled={uploadingImage}
                    >
                      {t('admin.blogCreate.remove')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="outline" type="button" onClick={onPickImage} disabled={uploadingImage}>
                    {uploadingImage ? t('admin.blogCreate.uploading') : t('admin.blogCreate.uploadFeaturedImage')}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-green-600">{t('admin.blogCreate.imageInfo')}</span> {t('admin.blogCreate.imageFormats')}
                  </p>
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
                <Label htmlFor="content">{t('admin.blogCreate.articleContent')} *</Label>
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
                placeholder={t('admin.blogCreate.articleContentPlaceholder')}
              />
              {formData.content && (
                <p className="text-sm text-muted-foreground">
                  {formData.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length} {t('admin.blogCreate.words')}, {formData.content.replace(/<[^>]+>/g, '').length} {t('admin.blogCreate.characters')}
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">{t('admin.blogCreate.tags')}</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder={t('admin.blogCreate.tagsPlaceholder')}
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
              <CardTitle>{t('admin.blogCreate.seoMetadata')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.metaDescription && (
                <div className="space-y-2">
                  <Label>{t('admin.blogCreate.metaDescription')}</Label>
                  <Textarea
                    value={formData.metaDescription}
                    onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                    rows={2}
                  />
                </div>
              )}
              {formData.keywords.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('admin.blogCreate.seoKeywords')}</Label>
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
                {t('admin.blogCreate.saveDraft')}
              </Button>
              <Button onClick={() => handleSave('published')}>
                <Eye className="h-4 w-4 mr-2" />
                {t('admin.blogCreate.publish')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
