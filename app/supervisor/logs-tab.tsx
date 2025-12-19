'use client'

import { useTranslation } from '@/contexts/i18n-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function LogsTab() {
    const { t } = useTranslation()

    const logs = [
        { id: 1, action: t('supervisor.logs.actions.userLogin'), user: "admin@talentplus.com", timestamp: "2023-10-27 10:30:00", status: "success" },
        { id: 2, action: t('supervisor.logs.actions.updateSettings'), user: "supervisor@talentplus.com", timestamp: "2023-10-27 11:15:00", status: "success" },
        { id: 3, action: t('supervisor.logs.actions.deleteJob'), user: "admin@talentplus.com", timestamp: "2023-10-27 12:00:00", status: "success" },
        { id: 4, action: t('supervisor.logs.actions.failedLogin'), user: "unknown@ip.addr", timestamp: "2023-10-27 12:45:00", status: "failed" },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('supervisor.logs.title')}</CardTitle>
                <CardDescription>{t('supervisor.logs.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('supervisor.logs.action')}</TableHead>
                            <TableHead>{t('supervisor.logs.user')}</TableHead>
                            <TableHead>{t('supervisor.logs.timestamp')}</TableHead>
                            <TableHead>{t('supervisor.logs.status')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>{log.action}</TableCell>
                                <TableCell>{log.user}</TableCell>
                                <TableCell>{log.timestamp}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {log.status === 'success' ? t('supervisor.logs.statusSuccess') : t('supervisor.logs.statusFailed')}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
