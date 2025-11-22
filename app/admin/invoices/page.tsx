import { createClient } from '@/lib/supabase/server'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, FileText, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"

export default async function InvoicesPage() {
    const supabase = await createClient()

    // Fetch invoices
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })

    if (error) {
        return <div>Error loading invoices: {error.message}</div>
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Invoices</h1>
                <Button asChild>
                    <Link href="/admin/invoices/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Invoice
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices?.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                    <TableCell>{invoice.issue_date ? format(new Date(invoice.issue_date), 'dd.MM.yyyy') : '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{invoice.profiles?.full_name || 'Unknown'}</span>
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
                                            {invoice.status}
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
                                        No invoices found. Create one to get started.
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
