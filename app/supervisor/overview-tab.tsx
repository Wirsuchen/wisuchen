'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/contexts/i18n-context'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, DollarSign, Eye, MousePointer, UploadCloud } from "lucide-react"

interface Stats {
    totalJobs: number
    activeJobs: number
    totalCompanies: number
    totalUsers: number
    totalRevenue: number
    monthlyRevenue: number
    totalImports: number
    successfulImports: number
    totalViews: number
    totalClicks: number
}

export function OverviewTab() {
    const { t } = useTranslation()
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                if (!data.error) setStats(data)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div>{t('common.loading')}</div>
    if (!stats) return <div>{t('supervisor.stats.failedToLoad')}</div>

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('supervisor.stats.totalUsers')}</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">{stats.totalCompanies} {t('supervisor.stats.companies')}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('supervisor.stats.activeJobs')}</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeJobs}</div>
                    <p className="text-xs text-muted-foreground">{stats.totalJobs} {t('supervisor.stats.totalJobs')}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('supervisor.stats.revenue')}</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">€{stats.monthlyRevenue.toFixed(2)} {t('supervisor.stats.thisMonth')}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('supervisor.stats.impressions')}</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalViews}</div>
                    <p className="text-xs text-muted-foreground">{stats.totalClicks} {t('supervisor.stats.clicks')}</p>
                </CardContent>
            </Card>
        </div>
    )
}
