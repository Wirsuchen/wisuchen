'use client'

import { useTranslation } from '@/contexts/i18n-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, FileText } from "lucide-react"
import { ReportsTab } from './reports-tab'
import { OverviewTab } from '@/app/supervisor/overview-tab' // Reuse from supervisor

export function AnalystContent() {
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('analyst.panel.title')}</h1>
                <p className="text-muted-foreground">{t('analyst.panel.description')}</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">
                        <Activity className="h-4 w-4 mr-2" />
                        {t('analyst.tabs.overview')}
                    </TabsTrigger>
                    <TabsTrigger value="reports">
                        <FileText className="h-4 w-4 mr-2" />
                        {t('analyst.tabs.reports')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <OverviewTab />
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <ReportsTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
