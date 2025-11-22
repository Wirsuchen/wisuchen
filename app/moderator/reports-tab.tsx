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
import { toast } from "@/hooks/use-toast"
import { ShieldAlert, CheckCircle } from "lucide-react"

interface Report {
    id: string
    target: string
    reason: string
    reporter: string
    status: string
    created_at: string
}

export function ReportsTab() {
    const { t } = useTranslation()
    const [reports, setReports] = useState<Report[]>([
        { id: '1', target: 'Spam Job Listing', reason: 'Misleading information', reporter: 'user@example.com', status: 'open', created_at: '2023-11-20' },
        { id: '2', target: 'Inappropriate Comment', reason: 'Harassment', reporter: 'anon', status: 'open', created_at: '2023-11-21' },
    ])

    const handleResolve = (id: string) => {
        setReports(reports.filter(r => r.id !== id))
        toast({ title: t('moderator.reports.resolved') })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('moderator.reports.title')}</CardTitle>
                <CardDescription>{t('moderator.reports.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('moderator.reports.target')}</TableHead>
                                <TableHead>{t('moderator.reports.reason')}</TableHead>
                                <TableHead>{t('moderator.reports.reporter')}</TableHead>
                                <TableHead>{t('moderator.reports.status')}</TableHead>
                                <TableHead>{t('moderator.reports.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        {t('moderator.reports.noReports')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">{report.target}</TableCell>
                                        <TableCell>{report.reason}</TableCell>
                                        <TableCell>{report.reporter}</TableCell>
                                        <TableCell>
                                            <Badge variant="destructive">
                                                {report.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button size="sm" variant="outline" onClick={() => handleResolve(report.id)}>
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                {t('moderator.reports.resolve')}
                                            </Button>
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
