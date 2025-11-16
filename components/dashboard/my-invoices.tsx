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
import { FileText, Download, Eye, Plus, Euro, Calendar, Printer, Loader2 } from "lucide-react"
import { generateInvoicePDF } from "@/lib/invoice-generator"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/contexts/i18n-context"

export function MyInvoices() {
  const { t, tr } = useTranslation()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [canCreateInvoices, setCanCreateInvoices] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [invoiceData, setInvoiceData] = useState({
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    description: "",
    amount: "",
    vatRate: "19",
    includeWatermark: true,
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id
        if (!userId) {
          setInvoices([])
          return
        }

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
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('user_id', userId)
          .single()

        if (!profile?.id) {
          setInvoices([])
          return
        }

        const role = profile.role as string | null
        setCanCreateInvoices(Boolean(role && ['admin', 'supervisor'].includes(role)))

        const { data } = await supabase
          .from('invoices')
          .select('id, invoice_number, status, subtotal, tax_amount, total_amount, currency, billing_name, billing_email, billing_address, issued_at, due_date, pdf_url, tax_rate')
          .eq('user_id', profile.id)
          .order('issued_at', { ascending: false })

        setInvoices(data || [])
      } catch (e) {
        console.error('Load invoices error:', e)
        setInvoices([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "pending":
      case "sent":
        return "secondary"
      case "overdue":
        return "destructive"
      case "draft":
        return "outline"
      default:
        return "secondary"
    }
  }

  const totalRevenue = invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
  const pendingAmount = invoices.filter((inv) => inv.status === "pending" || inv.status === 'sent').reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
  const overdueAmount = invoices.filter((inv) => inv.status === "overdue").reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

  const handleCreateInvoice = async () => {
    if (!canCreateInvoices) {
      console.warn('Invoice creation is restricted to admin users.')
      return
    }
    const newInvoice = {
      id: `INV-${String(invoices.length + 1).padStart(3, "0")}`,
      clientName: invoiceData.clientName,
      clientEmail: invoiceData.clientEmail,
      clientAddress: invoiceData.clientAddress,
      description: invoiceData.description,
      amount: Number.parseFloat(invoiceData.amount),
      vatRate: Number.parseFloat(invoiceData.vatRate),
      vatAmount: (Number.parseFloat(invoiceData.amount) * Number.parseFloat(invoiceData.vatRate)) / 100,
      status: "Draft",
      createdDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      includeWatermark: invoiceData.includeWatermark,
    }

    try {
      await generateInvoicePDF(newInvoice)
      console.log("Invoice created and PDF generated:", newInvoice)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }

    setIsCreateDialogOpen(false)
    // Reset form
    setInvoiceData({
      clientName: "",
      clientEmail: "",
      clientAddress: "",
      description: "",
      amount: "",
      vatRate: "19",
      includeWatermark: true,
    })
  }

  const handleDownloadPDF = async (invoice: any) => {
    try {
      const mapped = {
        id: String(invoice.invoice_number || invoice.id),
        clientName: invoice.billing_name || '-',
        clientEmail: invoice.billing_email || undefined,
        clientAddress: invoice.billing_address || '',
        description: 'Invoice',
        amount: Number(invoice.subtotal || 0),
        vatRate: Number(invoice.tax_rate || 0),
        vatAmount: Number(invoice.tax_amount || 0),
        status: String(invoice.status || 'draft').toUpperCase(),
        createdDate: invoice.issued_at || new Date().toISOString(),
        dueDate: invoice.due_date || new Date().toISOString(),
        includeWatermark: true,
      }
      await generateInvoicePDF(mapped as any)
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  const handlePreviewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice)
    setIsPreviewDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.myInvoices")}</h1>
          <p className="text-muted-foreground">{t("invoices.subtitle")}</p>
        </div>
        {canCreateInvoices ? (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("invoices.createInvoiceButton")}
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("invoices.createDialog.title")}</DialogTitle>
              <DialogDescription>{t("invoices.createDialog.description")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">{t("invoices.form.clientNameLabel")}</Label>
                  <Input
                    id="clientName"
                    value={invoiceData.clientName}
                    onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                    placeholder={t("invoices.form.clientNamePlaceholder")}
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">{t("invoices.form.clientEmailLabel")}</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={invoiceData.clientEmail}
                    onChange={(e) => setInvoiceData({ ...invoiceData, clientEmail: e.target.value })}
                    placeholder={t("invoices.form.clientEmailPlaceholder")}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="clientAddress">{t("invoices.form.clientAddressLabel")}</Label>
                <Textarea
                  id="clientAddress"
                  value={invoiceData.clientAddress}
                  onChange={(e) => setInvoiceData({ ...invoiceData, clientAddress: e.target.value })}
                  placeholder={t("invoices.form.clientAddressPlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="description">{t("invoices.form.descriptionLabel")}</Label>
                <Textarea
                  id="description"
                  value={invoiceData.description}
                  onChange={(e) => setInvoiceData({ ...invoiceData, description: e.target.value })}
                  placeholder={t("invoices.form.descriptionPlaceholder")}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">{t("invoices.form.amountLabel")}</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={invoiceData.amount}
                    onChange={(e) => setInvoiceData({ ...invoiceData, amount: e.target.value })}
                    placeholder={t("invoices.form.amountPlaceholder")}
                  />
                </div>
                <div>
                  <Label htmlFor="vatRate">{t("invoices.form.vatRateLabel")}</Label>
                  <Select
                    value={invoiceData.vatRate}
                    onValueChange={(value) => setInvoiceData({ ...invoiceData, vatRate: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t("invoices.form.vatRateOption0")}</SelectItem>
                      <SelectItem value="7">{t("invoices.form.vatRateOption7")}</SelectItem>
                      <SelectItem value="19">{t("invoices.form.vatRateOption19")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="watermark"
                  checked={invoiceData.includeWatermark}
                  onCheckedChange={(checked) =>
                    setInvoiceData({ ...invoiceData, includeWatermark: checked as boolean })
                  }
                />
                <Label htmlFor="watermark">{t("invoices.form.includeWatermark")}</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="bg-transparent">
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleCreateInvoice}
                disabled={!invoiceData.clientName || !invoiceData.description || !invoiceData.amount}
              >
                {t("invoices.form.createAndDownload")}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        ) : (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            {t("invoices.adminOnlyNotice")}
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("invoices.stats.totalInvoices")}</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("invoices.stats.totalRevenue")}</p>
                <p className="text-2xl font-bold text-green-600">€{totalRevenue.toFixed(2)}</p>
              </div>
              <Euro className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("invoices.stats.pending")}</p>
                <p className="text-2xl font-bold text-yellow-600">€{pendingAmount.toFixed(2)}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("invoices.stats.overdue")}</p>
                <p className="text-2xl font-bold text-red-600">€{overdueAmount.toFixed(2)}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("invoices.table.title")}</CardTitle>
          <CardDescription>{t("invoices.table.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoices.table.headers.invoiceId")}</TableHead>
                  <TableHead>{t("invoices.table.headers.client")}</TableHead>
                  <TableHead>{t("invoices.table.headers.amount")}</TableHead>
                  <TableHead>{t("invoices.table.headers.vat")}</TableHead>
                  <TableHead>{t("invoices.table.headers.status")}</TableHead>
                  <TableHead>{t("invoices.table.headers.created")}</TableHead>
                  <TableHead>{t("invoices.table.headers.dueDate")}</TableHead>
                  <TableHead>{t("invoices.table.headers.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t("invoices.table.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number || invoice.id}</TableCell>
                      <TableCell>{invoice.billing_name || invoice.billing_email || '-'}</TableCell>
                      <TableCell>€{Number(invoice.total_amount || 0).toFixed(2)}</TableCell>
                      <TableCell>€{Number(invoice.tax_amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status) as any}>{formatStatus(String(invoice.status || '').toUpperCase())}</Badge>
                      </TableCell>
                      <TableCell>{invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent"
                            onClick={() => handlePreviewInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent"
                            onClick={() => handleDownloadPDF(invoice)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr("invoices.preview.title", { id: selectedInvoice?.id })}</DialogTitle>
            <DialogDescription>{t("invoices.preview.description")}</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="bg-white p-8 border rounded-lg">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-red-600">wirsuchen</h2>
                  <p className="text-sm text-gray-600">{t("invoices.preview.brandSubtitle")}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold">{t("invoices.preview.badge")}</h3>
                  <p className="text-sm text-gray-600">{selectedInvoice.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="font-semibold mb-2">{t("invoices.preview.from")}</h4>
                  <div className="text-sm text-gray-600">
                    <p>WIRsuchen GmbH</p>
                    <p>Musterstraße 1</p>
                    <p>10115 Berlin, Germany</p>
                    <p>contact@wirsuchen.com</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t("invoices.preview.to")}</h4>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{selectedInvoice.billing_name || '-'}</p>
                    {(selectedInvoice.billing_address || '').split("\n").map((line: string, index: number) => (
                      <p key={index}>{line}</p>
                    ))}
                    {selectedInvoice.billing_email && <p>{selectedInvoice.billing_email}</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">{t("invoices.preview.invoiceDate")}</span>{" "}
                    {selectedInvoice.issued_at ? new Date(selectedInvoice.issued_at).toLocaleDateString() : '—'}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">{t("invoices.preview.dueDate")}</span>{" "}
                    {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">{t("invoices.preview.status")}</span>{" "}
                    <Badge variant={getStatusColor(selectedInvoice.status) as any}>{formatStatus(String(selectedInvoice.status || '').toUpperCase())}</Badge>
                  </p>
                </div>
              </div>

              <div className="border rounded-lg mb-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("invoices.preview.lineItems.description")}</TableHead>
                      <TableHead className="text-right">{t("invoices.preview.lineItems.amount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{t("invoices.preview.lineItems.invoiceTotal")}</TableCell>
                      <TableCell className="text-right">€{Number(selectedInvoice.total_amount || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2">
                    <span>{t("invoices.preview.summary.subtotal")}</span>
                    <span>€{Number(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>{tr("invoices.preview.summary.vat", { rate: Number(selectedInvoice.tax_rate || 0).toFixed(2) })}</span>
                    <span>€{Number(selectedInvoice.tax_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t font-bold">
                    <span>{t("invoices.preview.summary.total")}</span>
                    <span>€{Number(selectedInvoice.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8 pt-4 border-t">
                <p className="text-xs text-gray-400">{t("invoices.preview.footer")}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)} className="bg-transparent">
              {t("common.close")}
            </Button>
            <Button onClick={() => selectedInvoice && handleDownloadPDF(selectedInvoice)}>
              <Printer className="h-4 w-4 mr-2" />
              {t("invoices.preview.downloadPdf")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
