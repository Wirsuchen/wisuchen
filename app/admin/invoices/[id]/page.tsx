import { createClient } from '@/lib/supabase/server'
import { InvoiceEditor } from "@/components/admin/invoice-editor"
import { notFound } from "next/navigation"

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', id)
        .single()

    if (error || !invoice) {
        notFound()
    }

    return <InvoiceEditor mode="edit" invoice={invoice} />
}
