'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/contexts/i18n-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface WriteTabProps {
    onSuccess: () => void
}

export function WriteTab({ onSuccess }: WriteTabProps) {
    const { toast } = useToast()
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        category: 'job-tips',
    })

    const handleSave = async (status: 'draft' | 'published') => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/blog/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    status,
                    categorySlug: 'career-tips', // Simplified for now
                }),
            })
            if (!res.ok) throw new Error('Failed to save')

            toast({ title: t('blog.admin.draftSaved') })
            onSuccess()
            setFormData({ title: '', content: '', excerpt: '', category: 'job-tips' })
        } catch (e) {
            toast({ title: t('common.error'), variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('blogger.write.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>{t('blog.admin.create.title')}</Label>
                    <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>

                <div className="space-y-2">
                    <Label>{t('blog.admin.create.category')}</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="job-tips">Job Tips</SelectItem>
                            <SelectItem value="news">News</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>{t('blog.admin.create.excerpt')}</Label>
                    <Textarea value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })} />
                </div>

                <div className="space-y-2">
                    <Label>{t('blog.admin.create.articleContent')}</Label>
                    <Textarea
                        className="min-h-[300px] font-mono"
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Write your article here (Markdown supported)..."
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => handleSave('draft')} disabled={loading}>
                        {t('blog.admin.create.saveDraft')}
                    </Button>
                    <Button onClick={() => handleSave('published')} disabled={loading}>
                        {t('blog.admin.create.publish')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
