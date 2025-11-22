"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Trash2, Plus, Save, Printer } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { InvoicePrintView } from "./invoice-print-view"
import { createClient } from "@/lib/supabase/client"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useTranslation } from "@/contexts/i18n-context"

const invoiceSchema = z.object({
    user_id: z.string().min(1, "Recipient is required"),
    status: z.enum(["draft", "sent", "paid", "cancelled", "overdue"]),
    tax_rate: z.number().min(0).max(100),
    notes: z.string().optional(),
    sender_details: z.object({
        name: z.string().min(1, "Name is required"),
        address: z.string().min(1, "Address is required"),
        email: z.string().email("Invalid email"),
        vat_id: z.string().optional(),
    }),
    recipient_details: z.object({
        name: z.string().min(1, "Name is required"),
        address: z.string().optional(),
        email: z.string().email("Invalid email"),
    }),
    payment_details: z.object({
        bank_name: z.string().optional(),
        iban: z.string().optional(),
        bic: z.string().optional(),
        paypal: z.string().optional(),
    }),
    items: z.array(z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(1),
        unit_price: z.number().min(0),
    })).min(1, "At least one item is required"),
})

type InvoiceFormValues = z.infer<typeof invoiceSchema>

interface InvoiceEditorProps {
    invoice?: any
    mode: "create" | "edit"
    onSuccess?: () => void
    onCancel?: () => void
}

export function InvoiceEditor({ invoice, mode, onSuccess, onCancel }: InvoiceEditorProps) {
    const { t, tr } = useTranslation()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<any[]>([])
    const [openUserSelect, setOpenUserSelect] = useState(false)

    useEffect(() => {
        const fetchUsers = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, role')
                .order('full_name')

            if (data) setUsers(data)
        }
        fetchUsers()
    }, [])

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: invoice ? {
            user_id: invoice.user_id,
            status: invoice.status,
            tax_rate: invoice.tax_rate,
            notes: invoice.notes,
            sender_details: invoice.sender_details || { name: "", address: "", email: "" },
            recipient_details: invoice.recipient_details || { name: "", address: "", email: "" },
            payment_details: invoice.payment_details || {},
            items: invoice.invoice_items?.map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
            })),
        } : {
            status: "draft",
            tax_rate: 0,
            items: [{ description: "", quantity: 1, unit_price: 0 }],
            sender_details: { name: "", address: "", email: "" },
            recipient_details: { name: "", address: "", email: "" },
            payment_details: {},
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    })

    // Watch values for calculations
    const items = form.watch("items")
    const taxRate = form.watch("tax_rate")

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + taxAmount

    const onSubmit = async (data: InvoiceFormValues) => {
        setLoading(true)
        try {
            const url = mode === "create" ? "/api/admin/invoices" : `/api/admin/invoices/${invoice.id}`
            const method = mode === "create" ? "POST" : "PUT"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) throw new Error("Failed to save invoice")

            toast.success(mode === "create" ? t("invoices.editor.messages.created") : t("invoices.editor.messages.updated"))
            if (onSuccess) {
                onSuccess()
            } else {
                router.push("/dashboard/my-invoices")
                router.refresh()
            }
        } catch (error) {
            toast.error(t("invoices.editor.messages.error"))
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleUserSelect = (userId: string) => {
        const user = users.find((u) => u.id === userId)
        if (user) {
            form.setValue("user_id", userId)
            form.setValue("recipient_details.name", user.full_name || "")
            form.setValue("recipient_details.email", user.email || "")
        }
    }

    return (
        <>
            <div className="print:hidden">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto p-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">{mode === "create" ? t("invoices.editor.titleCreate") : tr("invoices.editor.titleEdit", { number: invoice?.invoice_number })}</h1>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => window.print()}>
                                <Printer className="w-4 h-4 mr-2" />
                                {t("invoices.editor.printPdf")}
                            </Button>
                            {onCancel && (
                                <Button type="button" variant="ghost" onClick={onCancel}>
                                    {t("invoices.form.cancel")}
                                </Button>
                            )}
                            <Button type="submit" disabled={loading}>
                                <Save className="w-4 h-4 mr-2" />
                                {t("invoices.editor.save")}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Sender Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("invoices.editor.sender.title")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t("invoices.editor.sender.name")}</Label>
                                    <Input {...form.register("sender_details.name")} />
                                    {form.formState.errors.sender_details?.name && (
                                        <p className="text-sm text-red-500">{form.formState.errors.sender_details.name.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("invoices.editor.sender.address")}</Label>
                                    <Textarea {...form.register("sender_details.address")} />
                                    {form.formState.errors.sender_details?.address && (
                                        <p className="text-sm text-red-500">{form.formState.errors.sender_details.address.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("invoices.editor.sender.email")}</Label>
                                    <Input {...form.register("sender_details.email")} />
                                    {form.formState.errors.sender_details?.email && (
                                        <p className="text-sm text-red-500">{form.formState.errors.sender_details.email.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("invoices.editor.sender.vatId")}</Label>
                                    <Input {...form.register("sender_details.vat_id")} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recipient Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("invoices.editor.recipient.title")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t("invoices.editor.recipient.selectUser")}</Label>
                                    <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openUserSelect}
                                                className="w-full justify-between"
                                            >
                                                {form.watch("user_id")
                                                    ? users.find((user) => user.id === form.watch("user_id"))?.email
                                                    : t("invoices.editor.recipient.selectUserPlaceholder")}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput placeholder={t("invoices.editor.recipient.searchUserPlaceholder")} />
                                                <CommandList>
                                                    <CommandEmpty>{t("invoices.editor.recipient.noUserFound")}</CommandEmpty>
                                                    <CommandGroup>
                                                        {users.map((user) => (
                                                            <CommandItem
                                                                key={user.id}
                                                                value={user.email}
                                                                onSelect={() => {
                                                                    handleUserSelect(user.id)
                                                                    setOpenUserSelect(false)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        form.watch("user_id") === user.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span>{user.email}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {user.full_name || "No name"} ({user.role})
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>{t("invoices.editor.recipient.name")}</Label>
                                    <Input {...form.register("recipient_details.name")} />
                                    {form.formState.errors.recipient_details?.name && (
                                        <p className="text-sm text-red-500">{form.formState.errors.recipient_details.name.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("invoices.editor.recipient.address")}</Label>
                                    <Textarea {...form.register("recipient_details.address")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("invoices.editor.recipient.email")}</Label>
                                    <Input {...form.register("recipient_details.email")} />
                                    {form.formState.errors.recipient_details?.email && (
                                        <p className="text-sm text-red-500">{form.formState.errors.recipient_details.email.message}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Invoice Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("invoices.editor.items.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-4 items-start">
                                    <div className="flex-1 space-y-2">
                                        <Label>{t("invoices.editor.items.description")}</Label>
                                        <Input {...form.register(`items.${index}.description`)} />
                                    </div>
                                    <div className="w-24 space-y-2">
                                        <Label>{t("invoices.editor.items.qty")}</Label>
                                        <Input
                                            type="number"
                                            {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                                        />
                                    </div>
                                    <div className="w-32 space-y-2">
                                        <Label>{t("invoices.editor.items.price")}</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            {...form.register(`items.${index}.unit_price`, { valueAsNumber: true })}
                                        />
                                    </div>
                                    <div className="w-32 pt-8 text-right font-mono">
                                        {((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.unit_price`) || 0)).toFixed(2)} €
                                    </div>
                                    <div className="pt-8">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t("invoices.editor.items.add")}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Totals & Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("invoices.editor.payment.title")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t("invoices.editor.payment.bankName")}</Label>
                                    <Input {...form.register("payment_details.bank_name")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("invoices.editor.payment.iban")}</Label>
                                    <Input {...form.register("payment_details.iban")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("invoices.editor.payment.bic")}</Label>
                                    <Input {...form.register("payment_details.bic")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("invoices.editor.payment.paypal")}</Label>
                                    <Input {...form.register("payment_details.paypal")} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("invoices.editor.summary.title")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span>{t("invoices.editor.summary.subtotal")}</span>
                                    <span>{subtotal.toFixed(2)} €</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <span>{t("invoices.editor.summary.taxRate")}</span>
                                    <div className="flex items-center gap-2 w-32">
                                        <Input
                                            type="number"
                                            {...form.register("tax_rate", { valueAsNumber: true })}
                                        />
                                        <span>%</span>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t("invoices.editor.summary.taxAmount")}</span>
                                    <span>{taxAmount.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-4 border-t">
                                    <span>{t("invoices.editor.summary.total")}</span>
                                    <span>{total.toFixed(2)} €</span>
                                </div>

                                <div className="pt-4 border-t space-y-2">
                                    <Label>{t("invoices.editor.summary.status")}</Label>
                                    <Select
                                        onValueChange={(value) => form.setValue("status", value as any)}
                                        defaultValue={form.watch("status")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("invoices.editor.status.selectStatus")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">{t("invoices.status.draft")}</SelectItem>
                                            <SelectItem value="sent">{t("invoices.status.sent")}</SelectItem>
                                            <SelectItem value="paid">{t("invoices.status.paid")}</SelectItem>
                                            <SelectItem value="overdue">{t("invoices.status.overdue")}</SelectItem>
                                            <SelectItem value="cancelled">{t("invoices.status.cancelled")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>

            <div className="hidden print:block">
                <InvoicePrintView invoice={{
                    ...form.getValues(),
                    invoice_number: invoice?.invoice_number || "DRAFT",
                    issued_at: invoice?.issued_at || new Date().toISOString(),
                    due_date: invoice?.due_date || new Date().toISOString(),
                    subtotal,
                    tax_amount: taxAmount,
                    total_amount: total,
                }} />
            </div>
        </>
    )
}
