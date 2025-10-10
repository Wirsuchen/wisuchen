"use client"

import { useState } from "react"
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
import { FileText, Download, Eye, Plus, Euro, Calendar, Printer } from "lucide-react"
import { generateInvoicePDF } from "@/lib/invoice-generator"

export function MyInvoices() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [invoiceData, setInvoiceData] = useState({
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    description: "",
    amount: "",
    vatRate: "19",
    includeWatermark: true,
  })

  const invoices = [
    {
      id: "INV-001",
      clientName: "TechCorp GmbH",
      clientEmail: "billing@techcorp.de",
      clientAddress: "Musterstraße 123\n10115 Berlin\nGermany",
      description: "Web Development Services - Q4 2023",
      amount: 1500,
      vatAmount: 285,
      status: "Paid",
      createdDate: "2024-01-15",
      dueDate: "2024-02-15",
      vatRate: 19,
    },
    {
      id: "INV-002",
      clientName: "StartupXYZ",
      clientEmail: "finance@startupxyz.com",
      clientAddress: "Innovation Hub 45\n80331 München\nGermany",
      description: "Digital Marketing Campaign Setup",
      amount: 2500,
      vatAmount: 475,
      status: "Pending",
      createdDate: "2024-01-10",
      dueDate: "2024-02-10",
      vatRate: 19,
    },
    {
      id: "INV-003",
      clientName: "DesignStudio",
      clientEmail: "hello@designstudio.de",
      clientAddress: "Kreativstraße 67\n20095 Hamburg\nGermany",
      description: "UI/UX Design Services",
      amount: 800,
      vatAmount: 152,
      status: "Overdue",
      createdDate: "2023-12-15",
      dueDate: "2024-01-15",
      vatRate: 19,
    },
    {
      id: "INV-004",
      clientName: "MarketPro",
      clientEmail: "accounts@marketpro.com",
      clientAddress: "Business Center 89\n50667 Köln\nGermany",
      description: "SEO Optimization Services",
      amount: 1200,
      vatAmount: 228,
      status: "Draft",
      createdDate: "2024-01-20",
      dueDate: "2024-02-20",
      vatRate: 19,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "default"
      case "Pending":
        return "secondary"
      case "Overdue":
        return "destructive"
      case "Draft":
        return "outline"
      default:
        return "secondary"
    }
  }

  const totalRevenue = invoices.filter((inv) => inv.status === "Paid").reduce((sum, inv) => sum + inv.amount, 0)
  const pendingAmount = invoices.filter((inv) => inv.status === "Pending").reduce((sum, inv) => sum + inv.amount, 0)
  const overdueAmount = invoices.filter((inv) => inv.status === "Overdue").reduce((sum, inv) => sum + inv.amount, 0)

  const handleCreateInvoice = async () => {
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
      await generateInvoicePDF(invoice)
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  const handlePreviewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice)
    setIsPreviewDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Invoices</h1>
          <p className="text-muted-foreground">Create and manage your invoices</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>Fill in the details to generate a new invoice</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={invoiceData.clientName}
                    onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={invoiceData.clientEmail}
                    onChange={(e) => setInvoiceData({ ...invoiceData, clientEmail: e.target.value })}
                    placeholder="client@company.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="clientAddress">Client Address</Label>
                <Textarea
                  id="clientAddress"
                  value={invoiceData.clientAddress}
                  onChange={(e) => setInvoiceData({ ...invoiceData, clientAddress: e.target.value })}
                  placeholder="Street Address, City, Postal Code, Country"
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={invoiceData.description}
                  onChange={(e) => setInvoiceData({ ...invoiceData, description: e.target.value })}
                  placeholder="Describe the services or products..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={invoiceData.amount}
                    onChange={(e) => setInvoiceData({ ...invoiceData, amount: e.target.value })}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="vatRate">VAT Rate (%)</Label>
                  <Select
                    value={invoiceData.vatRate}
                    onValueChange={(value) => setInvoiceData({ ...invoiceData, vatRate: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (No VAT)</SelectItem>
                      <SelectItem value="7">7% (Reduced Rate)</SelectItem>
                      <SelectItem value="19">19% (Standard Rate)</SelectItem>
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
                <Label htmlFor="watermark">Include WIRsuchen watermark</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="bg-transparent">
                Cancel
              </Button>
              <Button
                onClick={handleCreateInvoice}
                disabled={!invoiceData.clientName || !invoiceData.description || !invoiceData.amount}
              >
                Create & Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
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
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">€{totalRevenue}</p>
              </div>
              <Euro className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">€{pendingAmount}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">€{overdueAmount}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>View and manage all your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>€{invoice.amount}</TableCell>
                    <TableCell>€{invoice.vatAmount}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(invoice.status) as any}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(invoice.createdDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview - {selectedInvoice?.id}</DialogTitle>
            <DialogDescription>Preview your invoice before downloading</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="bg-white p-8 border rounded-lg">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-red-600">TalentPlus</h2>
                  <p className="text-sm text-gray-600">Professional Services</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold">INVOICE</h3>
                  <p className="text-sm text-gray-600">{selectedInvoice.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="font-semibold mb-2">From:</h4>
                  <div className="text-sm text-gray-600">
                    <p>WIRsuchen GmbH</p>
                    <p>Musterstraße 1</p>
                    <p>10115 Berlin, Germany</p>
                    <p>contact@wirsuchen.com</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">To:</h4>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{selectedInvoice.clientName}</p>
                    {selectedInvoice.clientAddress.split("\n").map((line: string, index: number) => (
                      <p key={index}>{line}</p>
                    ))}
                    {selectedInvoice.clientEmail && <p>{selectedInvoice.clientEmail}</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">Invoice Date:</span>{" "}
                    {new Date(selectedInvoice.createdDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Due Date:</span>{" "}
                    {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">Status:</span>{" "}
                    <Badge variant={getStatusColor(selectedInvoice.status) as any}>{selectedInvoice.status}</Badge>
                  </p>
                </div>
              </div>

              <div className="border rounded-lg mb-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{selectedInvoice.description}</TableCell>
                      <TableCell className="text-right">€{selectedInvoice.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2">
                    <span>Subtotal:</span>
                    <span>€{selectedInvoice.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>VAT ({selectedInvoice.vatRate}%):</span>
                    <span>€{selectedInvoice.vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t font-bold">
                    <span>Total:</span>
                    <span>€{(selectedInvoice.amount + selectedInvoice.vatAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.includeWatermark && (
                <div className="text-center mt-8 pt-4 border-t">
                  <p className="text-xs text-gray-400">Generated by WIRsuchen Invoice System</p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)} className="bg-transparent">
              Close
            </Button>
            <Button onClick={() => selectedInvoice && handleDownloadPDF(selectedInvoice)}>
              <Printer className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
