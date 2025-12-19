'use client'

import { useState } from 'react'
import { useTranslation } from '@/contexts/i18n-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Save } from "lucide-react"

export function ConfigTab() {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [config, setConfig] = useState({
        domain: "talentplus.com",
        supportEmail: "support@talentplus.com",
        stripeKey: "pk_test_...",
        openaiKey: "sk_...",
        paypalClientId: "sb-...",
        maintenanceMode: false
    })

    const handleSave = async () => {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setLoading(false)
        toast({ title: t('supervisor.config.saveSuccess') })
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('supervisor.config.generalTitle')}</CardTitle>
                    <CardDescription>{t('supervisor.config.generalDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="domain">{t('supervisor.config.domain')}</Label>
                            <Input
                                id="domain"
                                value={config.domain}
                                onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supportEmail">{t('supervisor.config.supportEmail')}</Label>
                            <Input
                                id="supportEmail"
                                value={config.supportEmail}
                                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('supervisor.config.apiKeysTitle')}</CardTitle>
                    <CardDescription>{t('supervisor.config.apiKeysDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="stripeKey">{t('supervisor.config.stripeKey')}</Label>
                        <Input
                            id="stripeKey"
                            type="password"
                            value={config.stripeKey}
                            onChange={(e) => setConfig({ ...config, stripeKey: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="openaiKey">{t('supervisor.config.openaiKey')}</Label>
                        <Input
                            id="openaiKey"
                            type="password"
                            value={config.openaiKey}
                            onChange={(e) => setConfig({ ...config, openaiKey: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paypalClientId">{t('supervisor.config.paypalClientId')}</Label>
                        <Input
                            id="paypalClientId"
                            type="password"
                            value={config.paypalClientId}
                            onChange={(e) => setConfig({ ...config, paypalClientId: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? t('common.saving') : t('common.saveChanges')}
                </Button>
            </div>
        </div>
    )
}
