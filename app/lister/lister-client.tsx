'use client'

import { useTranslation } from '@/contexts/i18n-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Megaphone, BarChart3 } from "lucide-react"
import { AdsTab } from './ads-tab'
import { CampaignsTab } from './campaigns-tab'

export function ListerClient() {
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('lister.panel.title')}</h1>
                <p className="text-muted-foreground">{t('lister.panel.description')}</p>
            </div>

            <Tabs defaultValue="ads" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="ads">
                        <Megaphone className="h-4 w-4 mr-2" />
                        {t('lister.tabs.ads')}
                    </TabsTrigger>
                    <TabsTrigger value="campaigns">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        {t('lister.tabs.campaigns')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ads" className="space-y-4">
                    <AdsTab />
                </TabsContent>

                <TabsContent value="campaigns" className="space-y-4">
                    <CampaignsTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
