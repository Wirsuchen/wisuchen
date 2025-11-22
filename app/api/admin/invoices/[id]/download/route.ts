import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

const translations = {
  en: {
    invoice: "INVOICE",
    date: "Date",
    dueDate: "Due Date",
    billTo: "Bill To",
    from: "From",
    description: "Description",
    price: "Price",
    quantity: "Qty",
    total: "Total",
    subtotal: "Subtotal",
    vat: "VAT",
    grandTotal: "Grand Total",
    thankYou: "Thank you for your business!",
  },
  de: {
    invoice: "RECHNUNG",
    date: "Datum",
    dueDate: "Fällig am",
    billTo: "Rechnung an",
    from: "Von",
    description: "Beschreibung",
    price: "Preis",
    quantity: "Menge",
    total: "Gesamt",
    subtotal: "Zwischensumme",
    vat: "MwSt",
    grandTotal: "Gesamtbetrag",
    thankYou: "Vielen Dank für Ihr Vertrauen!",
  }
}

function generateInvoiceHTML(invoice: any, lang: string = 'de') {
  const t = translations[lang as keyof typeof translations] || translations.de
  const locale = lang === 'de' ? 'de-DE' : 'en-US'

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString(locale)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const itemsHtml = invoice.invoice_items?.map((item: any) => `
    <tr class="item">
      <td>${item.description}</td>
      <td>${formatCurrency(item.unit_price)}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.total_price)}</td>
    </tr>
  `).join('') || ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #000; }
        .invoice-details { text-align: right; }
        .invoice-details h1 { margin: 0 0 10px; font-size: 32px; color: #1a1a1a; }
        .addresses { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .address-box h3 { font-size: 14px; text-transform: uppercase; color: #666; margin-bottom: 10px; }
        .address-box p { margin: 0; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; color: #666; font-weight: 600; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .totals { width: 300px; margin-left: auto; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .total-row.final { font-weight: bold; font-size: 18px; border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">TALENTPLUS</div>
        <div class="invoice-details">
          <h1>${t.invoice}</h1>
          <p>Nr. ${invoice.invoice_number}</p>
          <p>${t.date}: ${formatDate(invoice.issued_at)}</p>
          <p>${t.dueDate}: ${formatDate(invoice.due_date)}</p>
        </div>
      </div>

      <div class="addresses">
        <div class="address-box">
          <h3>${t.billTo}:</h3>
          <p>${invoice.billing_name || ''}</p>
          <p>${invoice.billing_email || ''}</p>
          <p>${(invoice.billing_address || '').replace(/\n/g, '<br>')}</p>
        </div>
        <div class="address-box" style="text-align: right;">
          <h3>${t.from}:</h3>
          <p>TalentPlus GmbH</p>
          <p>Musterstraße 123</p>
          <p>12345 Berlin</p>
          <p>Deutschland</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>${t.description}</th>
            <th>${t.price}</th>
            <th>${t.quantity}</th>
            <th>${t.total}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>${t.subtotal}:</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        <div class="total-row">
          <span>${t.vat} (${invoice.tax_rate}%):</span>
          <span>${formatCurrency(invoice.tax_amount)}</span>
        </div>
        <div class="total-row final">
          <span>${t.grandTotal}:</span>
          <span>${formatCurrency(invoice.total_amount)}</span>
        </div>
      </div>

      <div class="footer">
        <p>${t.thankYou}</p>
        <p>TalentPlus GmbH • IBAN: DE12 3456 7890 1234 5678 90 • BIC: ABCDEFGH</p>
      </div>
    </body>
    </html>
  `
}

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { searchParams } = new URL(req.url)
  const lang = searchParams.get('lang') || 'de'

  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get invoice with items
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', params.id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check if user has access (either admin or invoice owner)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isAdmin = profile?.role && ['admin', 'supervisor'].includes(profile.role)
    const isOwner = invoice.user_id === profile?.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const fullHtml = generateInvoiceHTML(invoice, lang)

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    })
    
    const page = await browser.newPage()
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    })
    
    await browser.close()

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
