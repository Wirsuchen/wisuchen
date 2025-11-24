"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { FileText, Download, Eye, Plus, Euro, Calendar, Printer, Loader2, AlertCircle, Edit, Trash2, ArrowLeft } from "lucide-react"
import { generateInvoiceHTML } from "@/lib/invoice-generator"
import { CustomInvoiceTemplate } from "@/components/admin/custom-invoice-template"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useTranslation, useLocale } from "@/contexts/i18n-context"
import { InvoiceEditor } from "@/components/admin/invoice-editor"

export function MyInvoices() {
  const { t, tr } = useTranslation()
  const locale = useLocale()

  // Safety check for translation context
  if (!t || !tr) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [canCreateInvoices, setCanCreateInvoices] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])

  // Editor State
  const [isCreating, setIsCreating] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)

  const formatStatus = (status: string) => {
    const normalized = String(status || "").toLowerCase()
    switch (normalized) {
      case "paid":
        return t("invoices.status.paid")
      case "pending":
        return t("invoices.status.pending")
      case "sent":
        return t("invoices.status.sent")
      case "overdue":
        return t("invoices.status.overdue")
      case "draft":
        return t("invoices.status.draft")
      default:
        return status
    }
  }

  const fetchInvoices = async (isRetry = false, retryCount = 0) => {
    const maxRetries = 3
    try {
      setLoading(true)
      if (!isRetry) setError(null)

      // Add delay for retries to allow services to warm up
      if (isRetry) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }

      // Check if Supabase client is available
      let supabase
      try {
        supabase = createClient()
      } catch (err) {
        console.error('Supabase client initialization error:', err)
        if (retryCount < maxRetries) {
          return fetchInvoices(true, retryCount + 1)
        }
        throw new Error(t("invoices.errors.databaseConnection"))
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('Auth error:', authError)
        throw new Error(t("invoices.errors.authentication"))
      }

      // Check if user is admin/supervisor
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        throw new Error(t("invoices.errors.userProfile"))
      }

      const isAdmin = profile?.role && ['admin', 'supervisor'].includes(profile.role)
      setCanCreateInvoices(isAdmin)

      // Fetch invoices
      let query = supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (*),
          profiles:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false })

      // If not admin, only show own invoices
      if (!isAdmin) {
        query = query.eq('user_id', user.id)
      }

      const { data, error: dbError } = await query

      if (dbError) {
        console.error('Database error:', dbError)
        if (retryCount < maxRetries) {
          return fetchInvoices(true, retryCount + 1)
        }
        throw new Error(t("invoices.errors.loadInvoices"))
      }

      setInvoices(data || [])
    } catch (err: any) {
      console.error('Error loading invoices:', err)
      setError(err.message || t("invoices.errors.unexpected"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handleCreateInvoice = async () => {
    setIsCreating(true)
  }

  const [invoiceToPrint, setInvoiceToPrint] = useState<any>(null)

  useEffect(() => {
    if (invoiceToPrint) {
      // Small delay to ensure render is complete before printing
      const timer = setTimeout(() => {
        window.print()
        // Reset after print dialog closes (or immediately, but user sees the dialog)
        // We keep it to avoid flickering if they cancel and try again quickly
        // But better to clear it after some time or on next action
        setInvoiceToPrint(null)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [invoiceToPrint])

  const handleDownloadPDF = async (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (invoice) {
      setInvoiceToPrint(invoice)
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm(t("invoices.deleteConfirm"))) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) throw error

      setInvoices(invoices.filter(inv => inv.id !== id))
      toast.success(t("invoices.messages.deleted"))
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error(t("invoices.messages.deleteError"))
    }
  }

  const totalRevenue = invoices.reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0)
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'sent').length
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length

  if (isCreating || editingInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              setIsCreating(false)
              setEditingInvoice(null)
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("invoices.form.cancel")}
          </Button>
        </div>
        <InvoiceEditor
          mode={isCreating ? "create" : "edit"}
          invoice={editingInvoice}
          onSuccess={() => {
            setIsCreating(false)
            setEditingInvoice(null)
            fetchInvoices()
          }}
          onCancel={() => {
            setIsCreating(false)
            setEditingInvoice(null)
          }}
        />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("dashboard.myInvoices")}</h1>
            <p className="text-muted-foreground">{t("invoices.subtitle")}</p>
          </div>
          {canCreateInvoices ? (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("invoices.createInvoiceButton")}
            </Button>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              {t("invoices.adminOnlyNotice")}
            </Badge>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("invoices.stats.totalRevenue")}
              </CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} €</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("invoices.stats.pending")}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvoices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("invoices.stats.overdue")}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueInvoices}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("invoices.table.title")}</CardTitle>
            <CardDescription>{t("invoices.table.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("invoices.table.empty")}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("invoices.table.headers.invoiceId")}</TableHead>
                    <TableHead>{t("invoices.table.headers.client")}</TableHead>
                    <TableHead>{t("invoices.table.headers.amount")}</TableHead>
                    <TableHead>{t("invoices.table.headers.status")}</TableHead>
                    <TableHead>{t("invoices.table.headers.created")}</TableHead>
                    <TableHead className="text-right">{t("invoices.table.headers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.billing_name || invoice.profiles?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{invoice.billing_email || invoice.profiles?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{Number(invoice.total_amount).toFixed(2)} €</TableCell>
                      <TableCell>
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' :
                            invoice.status === 'overdue' ? 'destructive' :
                              invoice.status === 'sent' ? 'secondary' : 'outline'
                        }>
                          {formatStatus(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setIsPreviewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(invoice.id)}
                            disabled={downloading === invoice.id}
                          >
                            {downloading === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          {canCreateInvoices && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingInvoice(invoice)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteInvoice(invoice.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{tr("invoices.preview.title", { id: selectedInvoice?.invoice_number })}</DialogTitle>
              <DialogDescription>
                {t("invoices.preview.description")}
              </DialogDescription>
            </DialogHeader>
            {selectedInvoice && (
              <div className="mt-4">
                <CustomInvoiceTemplate
                  invoice={{
                    id: selectedInvoice.id,
                    invoice_number: selectedInvoice.invoice_number,
                    billing_name: selectedInvoice.billing_name || selectedInvoice.profiles?.full_name || 'Unknown',
                    billing_address: selectedInvoice.billing_address || '',
                    billing_email: selectedInvoice.billing_email || selectedInvoice.profiles?.email || '',
                    issued_at: selectedInvoice.created_at,
                    due_date: selectedInvoice.due_date,
                    subtotal: Number(selectedInvoice.subtotal || 0),
                    tax_rate: Number(selectedInvoice.tax_rate || 0),
                    tax_amount: Number(selectedInvoice.tax_amount || 0),
                    total_amount: Number(selectedInvoice.total_amount || 0),
                    items: selectedInvoice.invoice_items?.map((item: any) => ({
                      description: item.description,
                      quantity: item.quantity,
                      unit_price: item.unit_price,
                      total_price: item.quantity * item.unit_price
                    })) || [],
                    sender_details: selectedInvoice.sender_details
                  }}
                />
                <div className="flex justify-end gap-4 mt-6">
                  <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
                    {t("invoices.form.cancel")}
                  </Button>
                  <Button onClick={() => handleDownloadPDF(selectedInvoice.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("invoices.preview.downloadPdf")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="hidden print:block">
        {invoiceToPrint && (
          <CustomInvoiceTemplate
            invoice={{
              id: invoiceToPrint.id,
              invoice_number: invoiceToPrint.invoice_number,
              billing_name: invoiceToPrint.billing_name || invoiceToPrint.profiles?.full_name || 'Unknown',
              billing_address: invoiceToPrint.billing_address || '',
              billing_email: invoiceToPrint.billing_email || invoiceToPrint.profiles?.email || '',
              issued_at: invoiceToPrint.created_at,
              due_date: invoiceToPrint.due_date,
              subtotal: Number(invoiceToPrint.subtotal || 0),
              tax_rate: Number(invoiceToPrint.tax_rate || 0),
              tax_amount: Number(invoiceToPrint.tax_amount || 0),
              total_amount: Number(invoiceToPrint.total_amount || 0),
              items: invoiceToPrint.invoice_items?.map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.quantity * item.unit_price
              })) || [],
              sender_details: invoiceToPrint.sender_details
            }}
          />
        )}
      </div>
    </>
  )
}

