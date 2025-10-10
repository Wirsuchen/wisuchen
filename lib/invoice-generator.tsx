export interface InvoiceData {
  id: string
  clientName: string
  clientEmail?: string
  clientAddress: string
  description: string
  amount: number
  vatRate: number
  vatAmount: number
  status: string
  createdDate: string
  dueDate: string
  includeWatermark?: boolean
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<void> {
  // Create HTML content for the invoice
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.id}</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 2px solid #dc2626;
          padding-bottom: 20px;
        }
        .logo {
          color: #dc2626;
          font-size: 28px;
          font-weight: bold;
        }
        .invoice-title {
          text-align: right;
        }
        .invoice-title h1 {
          font-size: 24px;
          margin: 0;
          color: #333;
        }
        .invoice-number {
          color: #666;
          font-size: 14px;
        }
        .addresses {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .address-block {
          width: 45%;
        }
        .address-block h3 {
          font-size: 16px;
          margin-bottom: 10px;
          color: #333;
        }
        .address-block p {
          margin: 2px 0;
          font-size: 14px;
          color: #666;
        }
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
        }
        .details-column p {
          margin: 5px 0;
          font-size: 14px;
        }
        .details-column strong {
          color: #333;
        }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }
        .status.paid { background: #dcfce7; color: #166534; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .status.overdue { background: #fee2e2; color: #991b1b; }
        .status.draft { background: #f3f4f6; color: #374151; }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .items-table th {
          background: #f9fafb;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        .items-table td {
          padding: 15px;
          border-bottom: 1px solid #f3f4f6;
        }
        .items-table tr:last-child td {
          border-bottom: none;
        }
        .text-right {
          text-align: right;
        }
        .totals {
          width: 300px;
          margin-left: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid #f3f4f6;
        }
        .totals-row:last-child {
          border-bottom: none;
          background: #f9fafb;
          font-weight: bold;
          font-size: 16px;
        }
        .watermark {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 12px;
        }
        .payment-info {
          margin-top: 40px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #dc2626;
        }
        .payment-info h3 {
          margin-top: 0;
          color: #333;
        }
        .payment-info p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">WIRsuchen</div>
          <p style="margin: 0; color: #666; font-size: 14px;">Professional Services</p>
        </div>
        <div class="invoice-title">
          <h1>INVOICE</h1>
          <p class="invoice-number">${invoice.id}</p>
        </div>
      </div>

      <div class="addresses">
        <div class="address-block">
          <h3>From:</h3>
          <p><strong>WIRsuchen GmbH</strong></p>
          <p>Musterstraße 1</p>
          <p>10115 Berlin, Germany</p>
          <p>contact@wirsuchen.com</p>
          <p>VAT ID: DE123456789</p>
        </div>
        <div class="address-block">
          <h3>To:</h3>
          <p><strong>${invoice.clientName}</strong></p>
          ${invoice.clientAddress
            .split("\n")
            .map((line) => `<p>${line}</p>`)
            .join("")}
          ${invoice.clientEmail ? `<p>${invoice.clientEmail}</p>` : ""}
        </div>
      </div>

      <div class="invoice-details">
        <div class="details-column">
          <p><strong>Invoice Date:</strong> ${new Date(invoice.createdDate).toLocaleDateString("en-GB")}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString("en-GB")}</p>
        </div>
        <div class="details-column">
          <p><strong>Status:</strong> <span class="status ${invoice.status.toLowerCase()}">${invoice.status}</span></p>
          <p><strong>Payment Terms:</strong> Net 30 days</p>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${invoice.description}</td>
            <td class="text-right">${invoice.amount.toFixed(2)} €</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${invoice.amount.toFixed(2)} €</span>
        </div>
        <div class="totals-row">
          <span>VAT (${invoice.vatRate}%):</span>
          <span>${invoice.vatAmount.toFixed(2)} €</span>
        </div>
        <div class="totals-row">
          <span>Total:</span>
          <span>${(invoice.amount + invoice.vatAmount).toFixed(2)} €</span>
        </div>
      </div>

      <div class="payment-info">
        <h3>Payment Information</h3>
        <p><strong>Bank:</strong> Deutsche Bank AG</p>
        <p><strong>IBAN:</strong> DE89 3704 0044 0532 0130 00</p>
        <p><strong>BIC:</strong> COBADEFFXXX</p>
        <p><strong>Reference:</strong> ${invoice.id}</p>
        <p style="margin-top: 15px; font-style: italic;">Please include the invoice number as payment reference.</p>
      </div>

      ${
        invoice.includeWatermark
          ? `
        <div class="watermark">
          <p>Generated by WIRsuchen Invoice System</p>
        </div>
      `
          : ""
      }
    </body>
    </html>
  `

  // Create a blob and download the HTML as PDF (mock implementation)
  // In a real application, you would use a PDF generation library like jsPDF or Puppeteer
  const blob = new Blob([htmlContent], { type: "text/html" })
  const url = URL.createObjectURL(blob)

  // Create a temporary link to download the file
  const link = document.createElement("a")
  link.href = url
  link.download = `invoice-${invoice.id}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  // Show success message
  console.log(`Invoice ${invoice.id} generated successfully!`)
}
