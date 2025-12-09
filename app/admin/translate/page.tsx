'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Languages, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

interface TranslationStatus {
    status: string
    translations: Record<string, Record<string, number>>
    content: {
        jobs: number
        blogs: number
    }
    languages: string[]
}

interface TranslationResult {
    success: boolean
    message: string
    results: {
        jobs?: { success: number; failed: number; total: number }
        blogs?: { success: number; failed: number; total: number }
        deals?: { success: number; failed: number; total: number; message?: string }
    }
}

export default function AdminTranslatePage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    const [status, setStatus] = useState<TranslationStatus | null>(null)
    const [loading, setLoading] = useState(false)
    const [translating, setTranslating] = useState(false)
    const [result, setResult] = useState<TranslationResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Load status on mount
    useEffect(() => {
        loadStatus()
    }, [])

    const loadStatus = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/admin/translate-all')
            if (!res.ok) {
                if (res.status === 401) {
                    setError('Unauthorized - Admin access required')
                    return
                }
                throw new Error('Failed to load status')
            }
            const data = await res.json()
            setStatus(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const triggerTranslation = async (type: 'all' | 'job' | 'blog') => {
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
            await loadStatus()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setTranslating(false)
        }
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Languages className="h-8 w-8 text-blue-600" />
                    Translation Manager
                </h1>
                <p className="text-muted-foreground mt-2">
                    Bulk translate all content to German, French, and Italian
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
                            Translation Complete
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            {result.results.jobs && (
                                <div>
                                    <p className="font-semibold">Jobs</p>
                                    <p className="text-sm text-muted-foreground">
                                        ✓ {result.results.jobs.success} success,
                                        ✗ {result.results.jobs.failed} failed
                                    </p>
                                </div>
                            )}
                            {result.results.blogs && (
                                <div>
                                    <p className="font-semibold">Blog Posts</p>
                                    <p className="text-sm text-muted-foreground">
                                        ✓ {result.results.blogs.success} success,
                                        ✗ {result.results.blogs.failed} failed
                                    </p>
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
                        <CardTitle>Translation Status</CardTitle>
                        <CardDescription>Current translation coverage</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadStatus} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
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
                                    <p className="text-sm text-muted-foreground">Jobs to Translate</p>
                                    <p className="text-2xl font-bold">{status.content.jobs}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Blog Posts to Translate</p>
                                    <p className="text-2xl font-bold">{status.content.blogs}</p>
                                </div>
                            </div>

                            {/* Translation Progress */}
                            <div>
                                <p className="font-semibold mb-3">Translation Progress</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2">Type</th>
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
                                <span className="text-sm text-muted-foreground">Target Languages:</span>
                                {status.languages.map(lang => (
                                    <Badge key={lang} variant="secondary">{lang.toUpperCase()}</Badge>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No data available</p>
                    )}
                </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Trigger Translation</CardTitle>
                    <CardDescription>
                        Translate content to all languages (de, fr, it). Uses 500ms delay between items.
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
                                    Translating...
                                </>
                            ) : (
                                <>
                                    <Languages className="h-4 w-4 mr-2" />
                                    Translate All
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => triggerTranslation('job')}
                            disabled={translating}
                        >
                            Translate Jobs Only
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => triggerTranslation('blog')}
                            disabled={translating}
                        >
                            Translate Blogs Only
                        </Button>
                    </div>

                    {translating && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <Loader2 className="inline h-4 w-4 mr-2 animate-spin" />
                                Translation in progress... This may take a few minutes for large amounts of content.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
