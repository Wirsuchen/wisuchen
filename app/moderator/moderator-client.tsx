'use client'

import { useTranslation } from '@/contexts/i18n-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShieldCheck, Flag, Activity } from "lucide-react"
import { ContentApprovalTab } from './content-approval-tab'
import { ReportsTab } from './reports-tab'
import { OverviewTab } from '@/app/supervisor/overview-tab' // Reusing for now, can be customized later

export function ModeratorClient() {
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('moderator.panel.title')}</h1>
                <p className="text-muted-foreground">{t('moderator.panel.description')}</p>
            </div>

            <Tabs defaultValue="approval" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="approval">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        {t('moderator.tabs.approval')}
                    </TabsTrigger>
                    <TabsTrigger value="reports">
                        <Flag className="h-4 w-4 mr-2" />
                        {t('moderator.tabs.reports')}
                    </TabsTrigger>
                    <TabsTrigger value="overview">
                        <Activity className="h-4 w-4 mr-2" />
                        {t('moderator.tabs.overview')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="approval" className="space-y-4">
                    <ContentApprovalTab />
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <ReportsTab />
                </TabsContent>

                <TabsContent value="overview" className="space-y-4">
                    <OverviewTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
