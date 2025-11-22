'use client'

import { useTranslation } from '@/contexts/i18n-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListChecks, Calendar, FileText } from "lucide-react"
import { ReviewQueueTab } from './review-queue-tab'
import { CalendarTab } from './calendar-tab'
import { ArticlesTab } from '@/app/blogger/articles-tab' // Reuse from blogger

export function EditorContent() {
    const { t } = useTranslation()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('editor.panel.title')}</h1>
                <p className="text-muted-foreground">{t('editor.panel.description')}</p>
            </div>

            <Tabs defaultValue="review" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="review">
                        <ListChecks className="h-4 w-4 mr-2" />
                        {t('editor.tabs.review')}
                    </TabsTrigger>
                    <TabsTrigger value="calendar">
                        <Calendar className="h-4 w-4 mr-2" />
                        {t('editor.tabs.calendar')}
                    </TabsTrigger>
                    <TabsTrigger value="all-posts">
                        <FileText className="h-4 w-4 mr-2" />
                        {t('editor.tabs.allPosts')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="review" className="space-y-4">
                    <ReviewQueueTab />
                </TabsContent>

                <TabsContent value="calendar" className="space-y-4">
                    <CalendarTab />
                </TabsContent>

                <TabsContent value="all-posts" className="space-y-4">
                    <ArticlesTab onEdit={() => { }} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
