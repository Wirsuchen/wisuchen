'use client'

import { useState } from 'react'
import { useTranslation } from '@/contexts/i18n-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, BarChart } from "lucide-react"

interface Campaign {
    id: string
    name: string
    status: string
    budget: string
    spent: string
    impressions: number
    clicks: number
    start_date: string
    end_date: string
}

export function CampaignsTab() {
    const { t } = useTranslation()
    const [campaigns, setCampaigns] = useState<Campaign[]>([
        { id: '1', name: 'Summer Hiring Drive', status: 'active', budget: '€500', spent: '€120', impressions: 1500, clicks: 45, start_date: '2023-11-01', end_date: '2023-11-30' },
        { id: '2', name: 'Senior Dev Promo', status: 'paused', budget: '€200', spent: '€50', impressions: 600, clicks: 12, start_date: '2023-10-15', end_date: '2023-11-15' },
    ])

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t('lister.campaigns.title')}</CardTitle>
                    <CardDescription>{t('lister.campaigns.description')}</CardDescription>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('lister.campaigns.create')}
                </Button>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('lister.campaigns.name')}</TableHead>
                                <TableHead>{t('lister.campaigns.status')}</TableHead>
                                <TableHead>{t('lister.campaigns.budget')}</TableHead>
                                <TableHead>{t('lister.campaigns.spent')}</TableHead>
                                <TableHead>{t('lister.campaigns.performance')}</TableHead>
                                <TableHead>{t('lister.campaigns.dates')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        {t('lister.campaigns.noCampaigns')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                campaigns.map((campaign) => (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-medium">{campaign.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                                                {campaign.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{campaign.budget}</TableCell>
                                        <TableCell>{campaign.spent}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-4 text-sm">
                                                <div className="flex items-center">
                                                    <BarChart className="h-3 w-3 mr-1 text-muted-foreground" />
                                                    {campaign.impressions} imp
                                                </div>
                                                <div>{campaign.clicks} clicks</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {campaign.start_date} - {campaign.end_date}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
