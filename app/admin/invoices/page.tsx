'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Edit, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useTranslation } from '@/contexts/i18n-context'

interface Invoice {
    id: string
    invoice_number: string
    issue_date: string | null
    total_amount: number
    status: string
    profiles: {
        full_name: string | null
        email: string | null
    } | null
}

export default function InvoicesPage() {
    const { t } = useTranslation()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchInvoices = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('invoices')
                .select('*, profiles(full_name, email)')
                .order('created_at', { ascending: false })

            if (error) {
                setError(error.message)
            } else {
                setInvoices(data || [])
            }
            setLoading(false)
        }
        fetchInvoices()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error) {
        return <div>{t('common.error')}: {error}</div>
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{t('admin.invoices.title')}</h1>
                <Button asChild>
                    <Link href="/admin/invoices/create">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('admin.invoices.create')}
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('admin.invoices.allInvoices')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('admin.invoices.invoiceNumber')}</TableHead>
                                <TableHead>{t('admin.invoices.date')}</TableHead>
                                <TableHead>{t('admin.invoices.recipient')}</TableHead>
                                <TableHead>{t('admin.invoices.amount')}</TableHead>
                                <TableHead>{t('admin.invoices.status')}</TableHead>
                                <TableHead className="text-right">{t('admin.invoices.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices?.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                    <TableCell>{invoice.issue_date ? format(new Date(invoice.issue_date), 'dd.MM.yyyy') : '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{invoice.profiles?.full_name || t('common.unknown')}</span>
                                            <span className="text-xs text-muted-foreground">{invoice.profiles?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{invoice.total_amount.toFixed(2)} €</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            invoice.status === 'paid' ? 'default' :
                                                invoice.status === 'sent' ? 'secondary' :
                                                    invoice.status === 'overdue' ? 'destructive' : 'outline'
                                        }>
                                            {t(`admin.invoices.statuses.${invoice.status}`)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/admin/invoices/${invoice.id}`}>
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {invoices?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {t('admin.invoices.noInvoices')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
