import React from 'react';

interface InvoiceItem {
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface Invoice {
    id: string;
    invoice_number: string;
    billing_name: string;
    billing_address: string;
    billing_email: string;
    issued_at: string;
    due_date: string;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
    items?: InvoiceItem[];
    sender_details?: any; // To be typed better if we have sender structure
}

interface CustomInvoiceTemplateProps {
    invoice: Invoice;
}

export const CustomInvoiceTemplate: React.FC<CustomInvoiceTemplateProps> = ({ invoice }) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('de-DE');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    // Default sender details
    const sender = {
        name: "Max Muster GmbH",
        address: "Industriestr. 11a, 80331 München",
        phone: "089/123456789",
        email: "contact@maxmuster.com",
        web: "www.maxmuster.com",
        taxId: "DE 123 456 789",
        bank: "Deutsche Testebank",
        iban: "DE11 1234 5678 9012 34",
        bic: "DEESTXXX12",
        mobile: "0171/23456789"
    };

    return (
        <div className="invoice-container">
            <style dangerouslySetInnerHTML={{
                __html: `
          @media print {
            transform: scale(0.85);
            transform-origin: top center;
            width: 100%;
            max-width: 210mm;
            height: auto;
            overflow: visible;
          }
          
          @page { size: auto; margin: 0mm; }

          .invoice-container {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 10pt;
            color: #000;
            -webkit-font-smoothing: antialiased;
            background: white;
            width: 210mm;
            min-height: 297mm;
            position: relative;
            padding: 20px;
            overflow: hidden;
            margin: 0 auto;
          }
          
          /* Override global variables to avoid oklch error in html2canvas */
          --background: #ffffff;
          --foreground: #000000;
          --card: #ffffff;
          --card-foreground: #000000;
          --popover: #ffffff;
          --popover-foreground: #000000;
          --primary: #000000;
          --primary-foreground: #ffffff;
          --secondary: #f5f5f5;
          --secondary-foreground: #000000;
          --muted: #f5f5f5;
          --muted-foreground: #737373;
          --accent: #f5f5f5;
          --accent-foreground: #000000;
          --destructive: #ef4444;
          --destructive-foreground: #ffffff;
          --border: #e5e5e5;
          --input: #e5e5e5;
          --ring: #000000;
        }

        /* * DECORATIVE ELEMENTS */
        .ribbon-top-right { 
            position: absolute; 
            top: 0; 
            right: 0; 
            width: 0; 
            height: 0; 
            border-style: solid; 
            border-width: 0 250px 150px 0; 
            border-color: transparent #1a2a40 transparent transparent; 
            z-index: 10; 
          }
           /* Logo inside ribbon - simplified as text for now */
          .ribbon-content {
            position: absolute;
            top: 25px;
            right: 15px;
            color: white;
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            z-index: 11;
            width: 200px;
          }

          .ribbon-bottom-left { 
            position: absolute; 
            bottom: 0; 
            left: 0; 
            width: 0; 
            height: 0; 
            border-style: solid; 
            border-width: 150px 0 0 250px; 
            border-color: transparent transparent transparent #1a2a40; 
            z-index: 10; 
          }
          
          /* Fold marks */
          .fold-mark { position: absolute; left: 20px; width: 8px; height: 1px; background-color: #aaa; }
          .fold-1 { top: 105mm; }
          .fold-2 { top: 210mm; }
          .center-mark { position: absolute; left: 20px; top: 148.5mm; width: 12px; height: 1px; background-color: #aaa; }

          /* * HEADER */
          header { margin-bottom: 40px; margin-top: 20px; }
          .company-name { font-size: 22pt; font-weight: 700; color: #000; letter-spacing: -0.5px; margin-bottom: 5px; }
          .slogan { font-size: 11pt; color: #333; }

          /* * ADDRESS BLOCK */
          .address-block { display: flex; justify-content: space-between; margin-bottom: 50px; align-items: flex-start; }
          .sender-tiny { font-size: 7pt; text-decoration: underline; margin-bottom: 12px; color: #000; }
          .recipient-box { font-size: 11pt; line-height: 1.3; }
          .recipient-name { font-weight: 700; }
          
          .sender-details-right { text-align: right; font-size: 9pt; line-height: 1.4; color: #333; margin-top: -10px; }
          .sender-details-right strong { font-weight: 700; color: #000; font-size: 10pt; }
          .detail-group { margin-bottom: 10px; }

          /* * INVOICE META */
          .invoice-title { font-size: 14pt; font-weight: 700; margin-bottom: 20px; margin-top: 20px; }
          .meta-grid { display: grid; grid-template-columns: auto auto auto; gap: 40px; margin-bottom: 25px; font-size: 10pt; }
          .meta-item span:first-child { margin-right: 5px; }
          .meta-item span:last-child { font-weight: 700; }

          /* * TABLE */
          .invoice-table { width: 100%; border-collapse: separate; border-spacing: 0 2px; margin-bottom: 30px; font-size: 10pt; background-color: #e6e6e6; padding: 2px; }
          .invoice-table th { background-color: #e6e6e6; padding: 8px 10px; text-align: left; font-weight: 600; color: #333; font-size: 9pt; }
          .invoice-table th.right { text-align: right; }
          .invoice-table th.center { text-align: center; }
          
          .invoice-table td { background-color: #fff; padding: 8px 10px; vertical-align: middle; }
          .invoice-table td.right { text-align: right; }
          .invoice-table td.center { text-align: center; }
          
          /* Totals */
          .totals-row td { background-color: transparent; padding: 5px 10px; }
          .totals-row .label { text-align: right; padding-right: 15px; }
          .totals-row .value { background-color: #fff; text-align: right; font-weight: 600; width: 120px; }
          .totals-row.final .value { font-weight: 700; border: 1px solid #ddd; }
          .totals-row.final .label { font-weight: 700; }

          /* * FOOTER TEXT */
          .footer-text { font-size: 9pt; margin-bottom: 40px; line-height: 1.5; }

          /* * PAGE FOOTER */
          .page-footer { 
            position: absolute; 
            bottom: 40px; 
            left: 55px; 
            right: 55px; 
            display: flex; 
            justify-content: center; 
            gap: 40px;
            font-size: 8pt; 
            color: #333;
            line-height: 1.4;
          }
          .footer-col { flex: 0 0 auto; }
      `}} />

            {/* Ribbons */}
            <div className="ribbon-top-right"></div>
            <div className="ribbon-content">
                vordrucke.de<br />
                <div style={{ borderTop: '1px solid white', width: '30px', margin: '5px 0 0 auto' }}></div>
            </div>
            <div className="ribbon-bottom-left"></div>

            {/* Fold Marks */}
            <div className="fold-mark fold-1"></div>
            <div className="fold-mark fold-2"></div>
            <div className="center-mark"></div>

            <header>
                <div className="company-name">{sender.name}</div>
                <div className="slogan">Ihr professioneller Dienstleister!</div>
            </header>

            <div className="address-block">
                <div className="left">
                    <div className="sender-tiny">{sender.name} – {sender.address}</div>
                    <div className="recipient-box">
                        <div className="recipient-name">{invoice.billing_name}</div>
                        {invoice.billing_address && invoice.billing_address.split('\n').map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                    </div>
                </div>
                <div className="sender-details-right">
                    <div className="detail-group">
                        <strong>{sender.name}</strong><br />
                        {sender.address.split(',')[0]}<br />
                        {sender.address.split(',')[1]}
                    </div>
                    <div className="detail-group">
                        Tel.: {sender.phone}<br />
                        Mobil: {sender.mobile}
                    </div>
                    <div className="detail-group">
                        Internet: {sender.web}<br />
                        E-Mail: {sender.email}
                    </div>
                </div>
            </div>

            <div className="invoice-title">Rechnung</div>

            <div className="meta-grid">
                <div className="meta-item">Rechnungsnummer: <span>{invoice.invoice_number}</span></div>
                <div className="meta-item">Kundennummer: <span>{invoice.id.substring(0, 8)}</span></div>
                <div className="meta-item" style={{ textAlign: 'right' }}><span>{formatDate(invoice.issued_at)}</span></div>
            </div>

            <table className="invoice-table">
                <thead>
                    <tr>
                        <th className="center" style={{ width: '40px' }}>#</th>
                        <th>Beschreibung</th>
                        <th className="right" style={{ width: '100px' }}>Einzelpreis</th>
                        <th className="center" style={{ width: '60px' }}>Anzahl</th>
                        <th className="right" style={{ width: '100px' }}>Gesamtpreis</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item, index) => (
                            <tr key={index}>
                                <td className="center">{index + 1}</td>
                                <td>{item.description}</td>
                                <td className="right">{formatCurrency(item.unit_price)}</td>
                                <td className="center">{item.quantity}</td>
                                <td className="right">{formatCurrency(item.total_price)}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="center">1</td>
                            <td>Dienstleistung</td>
                            <td className="right">{formatCurrency(invoice.subtotal)}</td>
                            <td className="center">1</td>
                            <td className="right">{formatCurrency(invoice.subtotal)}</td>
                        </tr>
                    )}

                    {/* Spacing Row */}
                    <tr><td colSpan={5} style={{ height: '10px', background: 'transparent' }}></td></tr>

                    {/* Totals */}
                    <tr className="totals-row">
                        <td colSpan={3}></td>
                        <td className="label">Summe der Nettobeträge</td>
                        <td className="value">{formatCurrency(invoice.subtotal)}</td>
                    </tr>
                    <tr className="totals-row">
                        <td colSpan={3}></td>
                        <td className="label">zzgl. {invoice.tax_rate}% Umsatzsteuer</td>
                        <td className="value">{formatCurrency(invoice.tax_amount)}</td>
                    </tr>
                    <tr><td colSpan={5} style={{ height: '5px', background: 'transparent' }}></td></tr>
                    <tr className="totals-row final">
                        <td colSpan={3}></td>
                        <td className="label">Gesamtbetrag</td>
                        <td className="value">{formatCurrency(invoice.total_amount)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="footer-text">
                Wir bitten Sie den Gesamtbetrag innerhalb von 14 Tagen auf unser unten angegebenes Konto zu überweisen.
                Das Leistungsdatum entspricht dem Rechnungsdatum.
            </div>

            <div className="page-footer">
                <div className="footer-col">
                    Steuernummer: {sender.taxId}<br />
                    USt.IdNr.: {sender.taxId}
                </div>
                <div className="footer-col">
                    {sender.bank}<br />
                    IBAN {sender.iban}<br />
                    BIC: {sender.bic}
                </div>
            </div>
        </div>
    );
};
