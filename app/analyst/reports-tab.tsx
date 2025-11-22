'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Download, FileBarChart } from 'lucide-react'
import { useTranslation } from '@/contexts/i18n-context'
import { toast } from '@/hooks/use-toast'

export function ReportsTab() {
    const { t } = useTranslation()
    const [reports] = useState([
        { id: '1', name: 'Monthly User Growth', date: '2023-10-01', type: 'PDF', size: '1.2 MB' },
        { id: '2', name: 'Ad Performance Q3', date: '2023-10-05', type: 'CSV', size: '450 KB' },
        { id: '3', name: 'Content Engagement Report', date: '2023-10-10', type: 'XLSX', size: '2.1 MB' },
    ])

    const handleDownload = (name: string) => {
        toast({
            title: t('analyst.reports.downloadStarted'),
            description: t('analyst.reports.downloading', { name }),
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('analyst.reports.title')}</CardTitle>
                <CardDescription>{t('analyst.reports.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('analyst.reports.name')}</TableHead>
                            <TableHead>{t('analyst.reports.date')}</TableHead>
                            <TableHead>{t('analyst.reports.type')}</TableHead>
                            <TableHead>{t('analyst.reports.size')}</TableHead>
                            <TableHead className="text-right">{t('analyst.reports.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map((report) => (
                            <TableRow key={report.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center">
                                        <FileBarChart className="h-4 w-4 mr-2 text-muted-foreground" />
                                        {report.name}
                                    </div>
                                </TableCell>
                                <TableCell>{report.date}</TableCell>
                                <TableCell>{report.type}</TableCell>
                                <TableCell>{report.size}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleDownload(report.name)}>
                                        <Download className="h-4 w-4 mr-2" />
                                        {t('common.download')}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
