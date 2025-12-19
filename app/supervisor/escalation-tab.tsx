'use client'

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

export function EscalationTab() {
    const { t } = useTranslation()

    const items = [
        { id: 1, type: t('supervisor.escalation.types.jobOffer'), title: "Senior React Developer", reason: t('supervisor.escalation.reasons.spam'), status: t('supervisor.escalation.statusPending') },
        { id: 2, type: t('supervisor.escalation.types.userProfile'), title: "John Doe", reason: t('supervisor.escalation.reasons.inappropriate'), status: t('supervisor.escalation.statusPending') },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('supervisor.escalation.title')}</CardTitle>
                <CardDescription>{t('supervisor.escalation.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('supervisor.escalation.type')}</TableHead>
                            <TableHead>{t('supervisor.escalation.title')}</TableHead>
                            <TableHead>{t('supervisor.escalation.reason')}</TableHead>
                            <TableHead>{t('supervisor.escalation.status')}</TableHead>
                            <TableHead>{t('supervisor.escalation.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.type}</TableCell>
                                <TableCell>{item.title}</TableCell>
                                <TableCell>{item.reason}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                                        {item.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="outline">{t('supervisor.escalation.approve')}</Button>
                                        <Button size="sm" variant="destructive">{t('supervisor.escalation.reject')}</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
