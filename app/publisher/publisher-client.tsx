'use client'

import { useTranslation } from '@/contexts/i18n-context'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, List } from "lucide-react"
import { QuickPostWizard } from './quick-post-wizard'
import { MyAds } from "@/components/dashboard/my-ads"

export function PublisherContent() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('publisher.panel.title')}</h1>
        <p className="text-muted-foreground">{t('publisher.panel.description')}</p>
      </div>

      <Tabs defaultValue="quick-post" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quick-post">
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('publisher.tabs.quickPost')}
          </TabsTrigger>
          <TabsTrigger value="my-listings">
            <List className="h-4 w-4 mr-2" />
            {t('publisher.tabs.myListings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick-post" className="space-y-4">
          <QuickPostWizard />
        </TabsContent>

        <TabsContent value="my-listings" className="space-y-4">
          <MyAds />
        </TabsContent>
      </Tabs>
    </div>
  )
}
