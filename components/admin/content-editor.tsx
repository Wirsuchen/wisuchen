"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save } from "lucide-react"

const contentSchema = z.object({
    slug: z.string().min(1, "Slug is required"),
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    is_published: z.boolean().default(false),
})

type ContentFormValues = z.infer<typeof contentSchema>

export function ContentEditor() {
    const [loading, setLoading] = useState(false)
    const [pages, setPages] = useState<any[]>([])
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null)

    const form = useForm<ContentFormValues>({
        resolver: zodResolver(contentSchema),
        defaultValues: {
            slug: "",
            title: "",
            content: "",
            is_published: false,
        },
    })

    useEffect(() => {
        fetchPages()
    }, [])

    const fetchPages = async () => {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('content_pages')
            .select('*')
            .order('title')

        if (error) {
            console.error('Error fetching pages:', error)
            toast.error("Failed to load pages")
            return
        }

        setPages(data || [])
    }

    const handlePageSelect = (pageId: string) => {
        setSelectedPageId(pageId)
        const page = pages.find(p => p.id === pageId)
        if (page) {
            form.reset({
                slug: page.slug,
                title: page.title,
                content: page.content,
                is_published: page.is_published,
            })
        }
    }

    const onSubmit = async (data: ContentFormValues) => {
        setLoading(true)
        try {
            const supabase = createClient()

            if (selectedPageId) {
                const { error } = await supabase
                    .from('content_pages')
                    .update({
                        title: data.title,
                        content: data.content,
                        is_published: data.is_published,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', selectedPageId)

                if (error) throw error
                toast.success("Page updated successfully")
            } else {
                // Create new page (optional, but for now we focus on editing existing ones)
                const { error } = await supabase
                    .from('content_pages')
                    .insert({
                        slug: data.slug,
                        title: data.title,
                        content: data.content,
                        is_published: data.is_published,
                    })

                if (error) throw error
                toast.success("Page created successfully")
                fetchPages()
            }

            // Refresh pages list
            fetchPages()
        } catch (error) {
            console.error('Error saving page:', error)
            toast.error("Failed to save page")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Select Page to Edit</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={handlePageSelect} value={selectedPageId || ""}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a page..." />
                        </SelectTrigger>
                        <SelectContent>
                            {pages.map((page) => (
                                <SelectItem key={page.id} value={page.id}>
                                    {page.title} ({page.slug})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedPageId && (
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Slug (URL Path)</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Content</FormLabel>
                                            <FormControl>
                                                <RichTextEditor
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
