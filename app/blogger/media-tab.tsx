'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from '@/contexts/i18n-context'

export function MediaTab() {
    const { t } = useTranslation()
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('blogger.media.title')}</CardTitle>
                <CardDescription>{t('blogger.media.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Media library integration coming soon.</p>
            </CardContent>
        </Card>
    )
}
