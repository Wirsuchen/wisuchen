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
        { id: 1, action: "User Login", user: "admin@talentplus.com", timestamp: "2023-10-27 10:30:00", status: "Success" },
        { id: 2, action: "Update Settings", user: "supervisor@talentplus.com", timestamp: "2023-10-27 11:15:00", status: "Success" },
        { id: 3, action: "Delete Job", user: "admin@talentplus.com", timestamp: "2023-10-27 12:00:00", status: "Success" },
        { id: 4, action: "Failed Login", user: "unknown@ip.addr", timestamp: "2023-10-27 12:45:00", status: "Failed" },
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
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${log.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {log.status}
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
