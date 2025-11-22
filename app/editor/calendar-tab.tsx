'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from '@/contexts/i18n-context'
import { Calendar as CalendarIcon } from "lucide-react"

export function CalendarTab() {
    const { t } = useTranslation()
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('editor.calendar.title')}</CardTitle>
                <CardDescription>{t('editor.calendar.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CalendarIcon className="h-16 w-16 mb-4 opacity-20" />
                <p>{t('editor.calendar.comingSoon')}</p>
            </CardContent>
        </Card>
    )
}
