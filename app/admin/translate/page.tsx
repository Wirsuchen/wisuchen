'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Languages, RefreshCw, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/contexts/i18n-context'

interface ContentItem {
    id: string
    title: string
    source: string
    translations: Record<string, boolean>
    fullyTranslated: boolean
}

interface ContentDetails {
    userJobs: ContentItem[]
    externalJobs: ContentItem[]
    blogs: ContentItem[]
    deals: ContentItem[]
}

interface TranslationStatus {
    status: string
    translations: Record<string, Record<string, number>>
    content: {
        jobs: number
        blogs: number
    }
    languages: string[]
    details?: ContentDetails
}

interface TranslationResult {
    success: boolean
    message: string
    results: {
        jobs?: { success: number; failed: number; skipped: number; total: number }
        blogs?: { success: number; failed: number; skipped: number; total: number }
        deals?: { success: number; failed: number; skipped: number; total: number; message?: string }
    }
}

export default function AdminTranslatePage() {
    const { user, loading: authLoading } = useAuth()
    const { t } = useTranslation()

    const [status, setStatus] = useState<TranslationStatus | null>(null)
    const [loading, setLoading] = useState(false)
    const [translating, setTranslating] = useState(false)
    const [result, setResult] = useState<TranslationResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showDetails, setShowDetails] = useState(false)
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        blogs: true,
        userJobs: false,
        externalJobs: true,
        deals: true
    })

    // Load status on mount
    useEffect(() => {
        loadStatus()
    }, [])

    const loadStatus = async (detailed = false) => {
        setLoading(true)
        setError(null)
        try {
            const url = detailed
                ? '/api/admin/translate-all?detailed=true'
                : '/api/admin/translate-all'
            const res = await fetch(url)
            if (!res.ok) {
                if (res.status === 401) {
                    setError('Unauthorized - Admin access required')
                    return
                }
                throw new Error('Failed to load status')
            }
            const data = await res.json()
            setStatus(data)
            if (detailed) setShowDetails(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const triggerTranslation = async (type: 'all' | 'job' | 'blog' | 'deal') => {
        setTranslating(true)
        setResult(null)
        setError(null)

        try {
            const res = await fetch('/api/admin/translate-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    limit: 100,
                    delayMs: 500
                })
            })

            if (!res.ok) {
                if (res.status === 401) {
                    setError('Unauthorized - Admin access required')
                    return
                }
                throw new Error('Translation failed')
            }

            const data = await res.json()
            setResult(data)

            // Refresh status after translation
            await loadStatus(showDetails)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setTranslating(false)
        }
    }

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    const renderContentList = (items: ContentItem[], title: string, sectionKey: string) => {
        if (!items || items.length === 0) return null

        const isExpanded = expandedSections[sectionKey]
        const allTranslated = items.every(i => i.fullyTranslated)
        const translatedCount = items.filter(i => i.fullyTranslated).length

        return (
            <div className="border rounded-lg overflow-hidden">
                <button
                    onClick={() => toggleSection(sectionKey)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="font-semibold">{title}</span>
                        <Badge variant={allTranslated ? "default" : "secondary"} className={allTranslated ? "bg-green-500" : ""}>
                            {translatedCount}/{items.length} {t('admin.translate.translated')}
                        </Badge>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {isExpanded && (
                    <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="text-left p-2 w-2/3">{t('admin.translate.titleColumn')}</th>
                                    <th className="text-center p-2">DE</th>
                                    <th className="text-center p-2">FR</th>
                                    <th className="text-center p-2">IT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="p-2 truncate max-w-xs" title={item.title}>
                                            {item.title || t('admin.translate.noTitle')}
                                            <span className="text-xs text-muted-foreground ml-2">({item.source})</span>
                                        </td>
                                        <td className="text-center p-2">
                                            {item.translations.de ? (
                                                <CheckCircle className="h-4 w-4 text-green-500 inline" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-gray-300 inline" />
                                            )}
                                        </td>
                                        <td className="text-center p-2">
                                            {item.translations.fr ? (
                                                <CheckCircle className="h-4 w-4 text-green-500 inline" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-gray-300 inline" />
                                            )}
                                        </td>
                                        <td className="text-center p-2">
                                            {item.translations.it ? (
                                                <CheckCircle className="h-4 w-4 text-green-500 inline" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-gray-300 inline" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Languages className="h-8 w-8 text-blue-600" />
                    {t('admin.translate.title')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t('admin.translate.description')}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <XCircle className="inline h-5 w-5 mr-2" />
                    {error}
                </div>
            )}

            {result && (
                <Card className="mb-6 border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="h-5 w-5" />
                            {t('admin.translate.complete')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            {result.results.jobs && (
                                <div className="p-3 bg-white rounded-lg border">
                                    <p className="font-semibold">{t('admin.translate.jobs')}</p>
                                    <p className="text-sm text-green-600">
                                        ✓ {result.results.jobs.success} {t('admin.translate.translated')}
                                    </p>
                                    {result.results.jobs.skipped > 0 && (
                                        <p className="text-sm text-blue-600">
                                            ⏭ {result.results.jobs.skipped} {t('admin.translate.skipped')}
                                        </p>
                                    )}
                                    {result.results.jobs.failed > 0 && (
                                        <p className="text-sm text-red-600">
                                            ✗ {result.results.jobs.failed} {t('admin.translate.failed')}
                                        </p>
                                    )}
                                </div>
                            )}
                            {result.results.blogs && (
                                <div className="p-3 bg-white rounded-lg border">
                                    <p className="font-semibold">{t('admin.translate.blogPosts')}</p>
                                    <p className="text-sm text-green-600">
                                        ✓ {result.results.blogs.success} {t('admin.translate.translated')}
                                    </p>
                                    {result.results.blogs.skipped > 0 && (
                                        <p className="text-sm text-blue-600">
                                            ⏭ {result.results.blogs.skipped} {t('admin.translate.skipped')}
                                        </p>
                                    )}
                                    {result.results.blogs.failed > 0 && (
                                        <p className="text-sm text-red-600">
                                            ✗ {result.results.blogs.failed} {t('admin.translate.failed')}
                                        </p>
                                    )}
                                </div>
                            )}
                            {result.results.deals && (
                                <div className="p-3 bg-white rounded-lg border">
                                    <p className="font-semibold">{t('admin.translate.deals')}</p>
                                    <p className="text-sm text-green-600">
                                        ✓ {result.results.deals.success} {t('admin.translate.translated')}
                                    </p>
                                    {result.results.deals.skipped > 0 && (
                                        <p className="text-sm text-blue-600">
                                            ⏭ {result.results.deals.skipped} {t('admin.translate.skipped')}
                                        </p>
                                    )}
                                    {result.results.deals.failed > 0 && (
                                        <p className="text-sm text-red-600">
                                            ✗ {result.results.deals.failed} {t('admin.translate.failed')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Status Card */}
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('admin.translate.status')}</CardTitle>
                        <CardDescription>{t('admin.translate.statusDesc')}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => loadStatus(true)} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            {t('admin.translate.loadDetails')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : status ? (
                        <div className="space-y-6">
                            {/* Content Counts */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">{t('admin.translate.jobsToTranslate')}</p>
                                    <p className="text-2xl font-bold">{status.content.jobs}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">{t('admin.translate.blogsToTranslate')}</p>
                                    <p className="text-2xl font-bold">{status.content.blogs}</p>
                                </div>
                            </div>

                            {/* Translation Progress Summary */}
                            <div>
                                <p className="font-semibold mb-3">{t('admin.translate.progress')}</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2">{t('admin.translate.type')}</th>
                                                {status.languages.map(lang => (
                                                    <th key={lang} className="text-center py-2">
                                                        <Badge variant="outline">{lang.toUpperCase()}</Badge>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {['job', 'blog', 'deal'].map(type => (
                                                <tr key={type} className="border-b">
                                                    <td className="py-2 font-medium capitalize">{type}s</td>
                                                    {status.languages.map(lang => (
                                                        <td key={lang} className="text-center py-2">
                                                            {status.translations[type]?.[lang] || 0}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Languages */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{t('admin.translate.targetLanguages')}:</span>
                                {status.languages.map(lang => (
                                    <Badge key={lang} variant="secondary">{lang.toUpperCase()}</Badge>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">{t('admin.translate.noData')}</p>
                    )}
                </CardContent>
            </Card>

            {/* Detailed Content List */}
            {showDetails && status?.details && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>{t('admin.translate.detailsTitle')}</CardTitle>
                        <CardDescription>
                            {t('admin.translate.detailsDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {renderContentList(status.details.blogs, t('admin.translate.blogPosts'), 'blogs')}
                        {renderContentList(status.details.userJobs, t('admin.translate.userPostedJobs'), 'userJobs')}
                        {renderContentList(status.details.externalJobs, t('admin.translate.externalJobs'), 'externalJobs')}
                        {renderContentList(status.details.deals, t('admin.translate.deals'), 'deals')}

                        {!status.details.blogs?.length &&
                            !status.details.userJobs?.length &&
                            !status.details.externalJobs?.length &&
                            !status.details.deals?.length && (
                                <p className="text-muted-foreground text-center py-4">
                                    {t('admin.translate.noContentFound')}
                                </p>
                            )}
                    </CardContent>
                </Card>
            )}

            {/* Actions Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('admin.translate.triggerTitle')}</CardTitle>
                    <CardDescription>
                        {t('admin.translate.triggerDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <Button
                            onClick={() => triggerTranslation('all')}
                            disabled={translating}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {translating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('admin.translate.translating')}
                                </>
                            ) : (
                                <>
                                    <Languages className="h-4 w-4 mr-2" />
                                    {t('admin.translate.translateAll')}
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => triggerTranslation('job')}
                            disabled={translating}
                        >
                            {t('admin.translate.translateJobsOnly')}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => triggerTranslation('blog')}
                            disabled={translating}
                        >
                            {t('admin.translate.translateBlogsOnly')}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => triggerTranslation('deal')}
                            disabled={translating}
                        >
                            {t('admin.translate.translateDealsOnly')}
                        </Button>
                    </div>

                    {translating && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                                {t('admin.translate.inProgress')}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
