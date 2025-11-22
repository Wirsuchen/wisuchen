import { CustomInvoiceTemplate } from "@/components/admin/custom-invoice-template"
import ReactDOMServer from "react-dom/server"

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
  items?: any[]
}

const mapToTemplateInvoice = (data: InvoiceData) => {
  return {
    id: data.id,
    invoice_number: data.id, // Assuming ID is the invoice number for now
    billing_name: data.clientName,
    billing_address: data.clientAddress,
    billing_email: data.clientEmail || '',
    issued_at: data.createdDate,
    due_date: data.dueDate,
    subtotal: data.amount,
    tax_rate: data.vatRate,
    tax_amount: data.vatAmount,
    total_amount: data.amount + data.vatAmount,
    items: data.items || [
      {
        description: data.description,
        quantity: 1,
        unit_price: data.amount,
        total_price: data.amount
      }
    ]
  }
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<void> {
  if (typeof window === 'undefined') return

  const templateInvoice = mapToTemplateInvoice(invoice)
  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <CustomInvoiceTemplate invoice={templateInvoice} />
  )

  // We need to wrap the content in a basic HTML structure with the styles included
  // The styles are already inside the component, but we need a container
  const container = document.createElement('div')
  container.innerHTML = htmlContent

  // html2pdf options
  const opt = {
    margin: 0,
    filename: `invoice-${invoice.id}.pdf`,
    image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as 'portrait' }
  }

  // Dynamic import for client-side only library
  const html2pdf = (await import('html2pdf.js')).default

  await html2pdf().set(opt).from(container).save()
}

export async function generateInvoiceHTML(invoice: InvoiceData): Promise<void> {
  const templateInvoice = mapToTemplateInvoice(invoice)
  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <CustomInvoiceTemplate invoice={templateInvoice} />
  )

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rechnung ${invoice.id}</title>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `

  const blob = new Blob([fullHtml], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `invoice-${invoice.id}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

