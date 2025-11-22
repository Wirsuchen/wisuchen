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

    // Default sender details if not present in invoice (can be passed as props too)
    const sender = {
        name: "WIRsuchen GmbH",
        address: "Musterstraße 1, 10115 Berlin",
        phone: "089/123456789",
        email: "contact@wirsuchen.com",
        web: "www.wirsuchen.com",
        taxId: "DE 123 456 789",
        bank: "Deutsche Testebank",
        iban: "DE11 1234 5678 9012 34",
        bic: "DEESTXXX12"
    };

    return (
        <div className="invoice-container">
            <style dangerouslySetInnerHTML={{
                __html: `
        /* * RESET & BASE STYLES */
        .invoice-container * { box-sizing: border-box; margin: 0; padding: 0; }
        .invoice-container {
          font-family: 'Arial', 'Helvetica', sans-serif;
          font-size: 11pt;
          color: #000;
          -webkit-font-smoothing: antialiased;
          background: white;
          width: 210mm;
          min-height: 297mm;
          position: relative;
          padding: 45px 50px;
          overflow: hidden;
          margin: 0 auto;
        }

        /* * DECORATIVE ELEMENTS (RIBBONS & FOLD MARKS) */
        .ribbon-top-right { position: absolute; top: 0; right: 0; width: 400px; height: 180px; background-color: #1d2d44; clip-path: polygon(0 0, 100% 0, 100% 100%); color: white; text-align: right; padding-right: 30px; padding-top: 25px; z-index: 10; }
        .ribbon-bottom-left { position: absolute; bottom: 0; left: 0; width: 350px; height: 200px; background-color: #1d2d44; clip-path: polygon(0 100%, 100% 100%, 0 0); z-index: 10; }
        
        /* Fold marks */
        .fold-mark { position: absolute; left: 15px; width: 10px; height: 1px; background-color: #000; }
        .fold-1 { top: 105mm; }
        .fold-2 { top: 210mm; }

        /* * HEADER CONTENT */
        .logo-text { font-family: 'Arial', sans-serif; font-size: 24pt; font-weight: 700; margin-top: 20px; letter-spacing: -0.5px; }
        .slogan { font-size: 12pt; margin-top: 5px; margin-bottom: 50px; }
        .vendor-logo { font-family: 'Arial', sans-serif; font-size: 22pt; font-weight: normal; margin-right: 15px; }
        .vendor-logo span { font-weight: bold; }

        /* Icon */
        .doc-icon { position: absolute; right: 65px; top: 65px; width: 30px; height: 20px; border: 2px solid white; border-top: none; }
        .doc-icon::before { content: ''; position: absolute; top: -10px; left: -25px; width: 80px; height: 2px; background: white; }
        .doc-icon::after { content: ''; position: absolute; top: -10px; right: 0; width: 2px; height: 10px; background: white; }
        .paper-icon { position: absolute; top: 62px; right: 70px; width: 20px; height: 25px; border: 2px solid white; border-radius: 0 0 5px 0; }

        /* * ADDRESS SECTION */
        .address-section { display: flex; justify-content: space-between; margin-bottom: 50px; font-size: 10pt; line-height: 1.3; }
        .sender-line { font-size: 7pt; text-decoration: underline; margin-bottom: 10px; color: #000; }
        .recipient { font-size: 11pt; line-height: 1.4; }
        .sender-info { text-align: right; margin-top: -15px; }
        .sender-info div { margin-bottom: 2px; }
        .info-spacer { margin-bottom: 10px !important; }

        /* * INVOICE META DATA */
        .doc-title { font-size: 14pt; font-weight: 700; margin-bottom: 15px; }
        .meta-row { display: flex; justify-content: space-between; font-size: 10.5pt; margin-bottom: 20px; }

        /* * TABLE GRID LAYOUT */
        .invoice-table { width: 100%; background-color: #efefef; display: grid; grid-template-columns: 40px 1fr 100px 80px 100px; gap: 2px; padding: 2px; margin-bottom: 30px; font-size: 10pt; }
        .cell { padding: 8px 10px; display: flex; align-items: center; }
        .cell.right { justify-content: flex-end; }
        .cell.center { justify-content: center; }
        .header-cell { font-weight: bold; background-color: #efefef; color: #000; padding-bottom: 10px; padding-top: 10px; }
        .white-cell { background-color: #fff; min-height: 35px; }
        .footer-label { grid-column: 2 / 5; display: flex; justify-content: flex-end; align-items: center; padding-right: 10px; background-color: #efefef; font-weight: normal; }
        .footer-value { background-color: #fff; font-weight: bold; }
        .total-label { font-weight: bold; }
        .spacer-cell { background-color: #efefef; }

        /* * BOTTOM TEXT & FOOTER */
        .terms-text { font-size: 10pt; margin-bottom: 50px; line-height: 1.4; }
        .page-footer { display: flex; justify-content: center; font-size: 9pt; position: absolute; bottom: 35px; left: 200px; width: calc(100% - 220px); }
        .footer-col { flex: 1; line-height: 1.4; }
      `}} />

            {/* Top Right Ribbon */}
            <div className="ribbon-top-right">
                <div className="vendor-logo">wir<span>suchen</span></div>
                <div className="doc-icon"></div>
                <div className="paper-icon"></div>
            </div>

            {/* Header */}
            <header>
                <div className="logo-text">{sender.name}</div>
                <div className="slogan">Ihr professioneller Dienstleister!</div>
            </header>

            {/* Address Section */}
            <section className="address-section">
                <div className="left-col">
                    <div className="sender-line">{sender.name} – {sender.address}</div>
                    <div className="recipient">
                        <strong>{invoice.billing_name}</strong><br />
                        {invoice.billing_address && invoice.billing_address.split('\n').map((line, i) => (
                            <React.Fragment key={i}>{line}<br /></React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="sender-info">
                    <div className="info-spacer"><strong>{sender.name}</strong><br />
                        {sender.address.split(',').map((line, i) => (
                            <React.Fragment key={i}>{line.trim()}<br /></React.Fragment>
                        ))}
                    </div>
                    <div>Tel.: {sender.phone}</div>
                    <div className="info-spacer">Web: {sender.web}</div>
                    <div>E-Mail: {sender.email}</div>
                </div>
            </section>

            {/* Fold Marks */}
            <div className="fold-mark fold-1"></div>
            <div className="fold-mark fold-2"></div>

            {/* Document Meta */}
            <div className="doc-title">Rechnung</div>
            <div className="meta-row">
                <span>Rechnungsnummer: {invoice.invoice_number}</span>
                <span>Kundennummer: {invoice.id.substring(0, 8)}</span>
                <span>{formatDate(invoice.issued_at)}</span>
            </div>

            {/* Table Grid */}
            <div className="invoice-table">
                {/* Headers */}
                <div className="cell header-cell center">#</div>
                <div className="cell header-cell">Beschreibung</div>
                <div className="cell header-cell right">Einzelpreis</div>
                <div className="cell header-cell center">Anzahl</div>
                <div className="cell header-cell right">Gesamtpreis</div>

                {/* Rows */}
                {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                        <React.Fragment key={index}>
                            <div className="cell white-cell center">{index + 1}</div>
                            <div className="cell white-cell">{item.description}</div>
                            <div className="cell white-cell right">{formatCurrency(item.unit_price)}</div>
                            <div className="cell white-cell center">{item.quantity}</div>
                            <div className="cell white-cell right">{formatCurrency(item.total_price)}</div>
                        </React.Fragment>
                    ))
                ) : (
                    // Fallback if no items (e.g. legacy invoice or not loaded)
                    <React.Fragment>
                        <div className="cell white-cell center">1</div>
                        <div className="cell white-cell">Dienstleistung</div>
                        <div className="cell white-cell right">{formatCurrency(invoice.subtotal)}</div>
                        <div className="cell white-cell center">1</div>
                        <div className="cell white-cell right">{formatCurrency(invoice.subtotal)}</div>
                    </React.Fragment>
                )}

                {/* Footer: Netto */}
                <div className="cell spacer-cell"></div>
                <div className="footer-label">Summe der Nettobeträge</div>
                <div className="cell white-cell right">{formatCurrency(invoice.subtotal)}</div>

                {/* Footer: Tax */}
                <div className="cell spacer-cell"></div>
                <div className="footer-label">zzgl. {invoice.tax_rate}% Umsatzsteuer</div>
                <div className="cell white-cell right">{formatCurrency(invoice.tax_amount)}</div>

                {/* Footer: Total */}
                <div className="cell spacer-cell"></div>
                <div className="footer-label total-label">Gesamtbetrag</div>
                <div className="cell white-cell right total-label">{formatCurrency(invoice.total_amount)}</div>
            </div>

            {/* Terms */}
            <div className="terms-text">
                Wir bitten Sie den Gesamtbetrag innerhalb von 14 Tagen auf unser unten angegebenes Konto zu überweisen.
                Das Leistungsdatum entspricht dem Rechnungsdatum.
            </div>

            {/* Bottom Footer Info */}
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

            {/* Bottom Left Ribbon */}
            <div className="ribbon-bottom-left"></div>
        </div>
    );
};
