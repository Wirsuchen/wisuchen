import { format } from "date-fns"
import { useTranslation } from "@/contexts/i18n-context"

interface InvoicePrintViewProps {
    invoice: any
}

export function InvoicePrintView({ invoice }: InvoicePrintViewProps) {
    const { t } = useTranslation()

    if (!invoice) return null

    const sender = invoice.sender_details || {}
    const recipient = invoice.recipient_details || {}
    const payment = invoice.payment_details || {}
    const items = invoice.items || invoice.invoice_items || []

    // Ensure numbers are numbers
    const subtotal = Number(invoice.subtotal || 0)
    const taxRate = Number(invoice.tax_rate || 0)
    const taxAmount = Number(invoice.tax_amount || 0)
    const totalAmount = Number(invoice.total_amount || 0)

    return (
        <div className="hidden print:block p-8 max-w-[210mm] mx-auto bg-white text-black font-sans">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-red-600 mb-2">WIRsuchen</h1>
                    <p className="text-sm text-gray-600">{t("invoices.print.professionalServices")}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold mb-2">{t("invoices.print.invoice")}</h2>
                    <p className="text-sm">{t("invoices.print.invoiceNo")}: {invoice.invoice_number || 'DRAFT'}</p>
                    <p className="text-sm">{t("invoices.print.invoiceDate")}: {invoice.issue_date ? format(new Date(invoice.issue_date), 'dd.MM.yyyy') : format(new Date(), 'dd.MM.yyyy')}</p>
                </div>
            </div>

            {/* Addresses */}
            <div className="flex justify-between mb-12">
                <div className="w-1/2 pr-4">
                    <p className="font-bold text-sm text-gray-500 mb-2">{t("invoices.print.from")}:</p>
                    <div className="text-sm">
                        <p className="font-bold">{sender.name}</p>
                        <p className="whitespace-pre-line">{sender.address}</p>
                        <p>{sender.email}</p>
                        {sender.vat_id && <p>VAT ID: {sender.vat_id}</p>}
                    </div>
                </div>
                <div className="w-1/2 pl-4">
                    <p className="font-bold text-sm text-gray-500 mb-2">{t("invoices.print.to")}:</p>
                    <div className="text-sm">
                        <p className="font-bold">{recipient.name}</p>
                        <p className="whitespace-pre-line">{recipient.address}</p>
                        <p>{recipient.email}</p>
                    </div>
                </div>
            </div>

            {/* Payment Method */}
            <div className="mb-8">
                <p className="font-bold">{t("invoices.print.paymentMethod")}: Paypal</p>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8 border-collapse">
                <thead>
                    <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-2">{t("invoices.print.description")}</th>
                        <th className="text-center py-2">{t("invoices.print.quantity")}</th>
                        <th className="text-right py-2">{t("invoices.print.price")}</th>
                        <th className="text-right py-2">{t("invoices.print.total")}</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100">
                            <td className="py-2">{item.description}</td>
                            <td className="text-center py-2">{item.quantity}</td>
                            <td className="text-right py-2">{Number(item.unit_price).toFixed(2)} €</td>
                            <td className="text-right py-2">{(item.quantity * item.unit_price).toFixed(2)} €</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-1/2">
                    <div className="flex justify-between py-1">
                        <span>{t("invoices.print.subtotal")}:</span>
                        <span>{subtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>{t("invoices.print.vat")} ({taxRate}%):</span>
                        <span>{taxAmount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-lg border-t border-gray-300 mt-2">
                        <span>{t("invoices.print.total")}:</span>
                        <span>{totalAmount.toFixed(2)} €</span>
                    </div>
                </div>
            </div>

            {/* Footer / Payment Info */}
            <div className="border-t-2 border-red-600 pt-4 text-sm">
                <h3 className="font-bold mb-2">{t("invoices.print.paymentInfo")}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p>Bank: {payment.bank_name}</p>
                        <p>IBAN: {payment.iban}</p>
                        <p>BIC: {payment.bic}</p>
                    </div>
                    <div>
                        <p>Paypal: {payment.paypal}</p>
                        <p className="mt-2 text-gray-500">{t("invoices.print.paymentReference")}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
