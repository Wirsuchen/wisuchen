'use client'

import { useState } from 'react'
import { useTranslation } from '@/contexts/i18n-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, PenTool, Image as ImageIcon } from "lucide-react"
import { ArticlesTab } from './articles-tab'
import { WriteTab } from './write-tab'
import { MediaTab } from './media-tab'

export function BloggerContent() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState('articles')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('blogger.panel.title')}</h1>
                <p className="text-muted-foreground">{t('blogger.panel.description')}</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="articles">
                        <FileText className="h-4 w-4 mr-2" />
                        {t('blogger.tabs.articles')}
                    </TabsTrigger>
                    <TabsTrigger value="write">
                        <PenTool className="h-4 w-4 mr-2" />
                        {t('blogger.tabs.write')}
                    </TabsTrigger>
                    <TabsTrigger value="media">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {t('blogger.tabs.media')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="articles" className="space-y-4">
                    <ArticlesTab onEdit={() => setActiveTab('write')} />
                </TabsContent>

                <TabsContent value="write" className="space-y-4">
                    <WriteTab onSuccess={() => setActiveTab('articles')} />
                </TabsContent>

                <TabsContent value="media" className="space-y-4">
                    <MediaTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
