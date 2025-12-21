'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, Search, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface TranslationStats {
    statistics: {
        total_translations: number
        by_type: Record<string, any>
        by_language: Record<string, number>
        content_counts: {
            jobs_in_db: number
            expected_job_translations: number
            actual_job_translations: number
            coverage_percentage: number
        }
    }
    recent_translations?: any[]
    timestamp: string
}

interface ContentTranslation {
    content_id: string
    translations: any[]
    coverage: {
        total_languages: number
        translated: number
        missing: number
        languages: {
            en: boolean
            de: boolean
            fr: boolean
            it: boolean
        }
    }
}

export default function TranslationsPage() {
    const [stats, setStats] = useState<TranslationStats | null>(null)
    const [contentSearch, setContentSearch] = useState('')
    const [contentTranslation, setContentTranslation] = useState<ContentTranslation | null>(null)
    const [loading, setLoading] = useState(true)
    const [searching, setSearching] = useState(false)

    const fetchStats = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/translations/status?detailed=true')
            const data = await res.json()
            setStats(data)
        } catch (error) {
            console.error('Failed to fetch translation stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const searchContent = async () => {
        if (!contentSearch.trim()) return

        try {
            setSearching(true)
            const res = await fetch(`/api/translations/status?content_id=${encodeURIComponent(contentSearch)}`)
            const data = await res.json()
            setContentTranslation(data)
        } catch (error) {
            console.error('Failed to search content:', error)
        } finally {
            setSearching(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Translation Monitoring</h1>
                    <p className="text-muted-foreground">Track translation coverage and status</p>
                </div>
                <Button onClick={fetchStats} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Overall Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Translations</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.statistics.total_translations || 0}</div>
                        <p className="text-xs text-muted-foreground">Across all content types</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Job Coverage</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.statistics.content_counts.coverage_percentage || 0}%</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.statistics.content_counts.actual_job_translations || 0} / {stats?.statistics.content_counts.expected_job_translations || 0} translations
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Jobs in Database</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.statistics.content_counts.jobs_in_db || 0}</div>
                        <p className="text-xs text-muted-foreground">Active & pending jobs</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium">
                            {stats?.timestamp ? new Date(stats.timestamp).toLocaleTimeString() : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.timestamp ? new Date(stats.timestamp).toLocaleDateString() : ''}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Language Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Language Distribution</CardTitle>
                    <CardDescription>Translations available per language</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(stats?.statistics.by_language || {}).map(([lang, count]) => (
                            <div key={lang} className="flex flex-col items-center justify-center p-4 border rounded-lg">
                                <div className="text-3xl font-bold mb-2">{count}</div>
                                <Badge variant="outline" className="uppercase">{lang}</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Content Type Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Content Type Breakdown</CardTitle>
                    <CardDescription>Translations by content type and language</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(stats?.statistics.by_type || {}).map(([type, data]: [string, any]) => (
                            <div key={type} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold capitalize">{type}</h3>
                                    <Badge>{data.total} total</Badge>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="text-center">
                                        <div className="text-sm text-muted-foreground">EN</div>
                                        <div className="font-semibold">{data.en || 0}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-muted-foreground">DE</div>
                                        <div className="font-semibold">{data.de || 0}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-muted-foreground">FR</div>
                                        <div className="font-semibold">{data.fr || 0}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-muted-foreground">IT</div>
                                        <div className="font-semibold">{data.it || 0}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Content ID Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Search Specific Content</CardTitle>
                    <CardDescription>Check translation status for a specific job, deal, or blog post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter content_id (e.g., job-44db5a0c-f30c-4e19-a5e1-8f380640aa36)"
                            value={contentSearch}
                            onChange={(e) => setContentSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchContent()}
                        />
                        <Button onClick={searchContent} disabled={searching || !contentSearch.trim()}>
                            <Search className="h-4 w-4 mr-2" />
                            Search
                        </Button>
                    </div>

                    {contentTranslation && (
                        <div className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold">Content ID: {contentTranslation.content_id}</h4>
                                <Badge variant={contentTranslation.coverage.translated === 4 ? 'default' : 'secondary'}>
                                    {contentTranslation.coverage.translated}/4 Languages
                                </Badge>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {Object.entries(contentTranslation.coverage.languages).map(([lang, available]) => (
                                    <div key={lang} className="flex items-center gap-2 p-2 border rounded">
                                        {available ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="uppercase text-sm font-medium">{lang}</span>
                                    </div>
                                ))}
                            </div>

                            {contentTranslation.coverage.missing > 0 && (
                                <div className="text-sm text-amber-600 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Missing {contentTranslation.coverage.missing} translation(s)
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Translations */}
            {stats?.recent_translations && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Translations</CardTitle>
                        <CardDescription>Last 20 translations created</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {stats.recent_translations.map((trans: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2 border-b last:border-0">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="uppercase">{trans.language}</Badge>
                                        <Badge variant="secondary">{trans.type}</Badge>
                                        <span className="text-sm text-muted-foreground font-mono">{trans.content_id}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(trans.created_at).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
