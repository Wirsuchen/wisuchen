import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Metadata } from "next"
import { PageLayout } from "@/components/layout/page-layout"

interface PageProps {
    params: {
        slug: string
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const supabase = await createClient()
    const { data: page } = await supabase
        .from('content_pages')
        .select('title')
        .eq('slug', params.slug)
        .single()

    if (!page) {
        return {
            title: 'Page Not Found',
        }
    }

    return {
        title: `${page.title} | WIRsuchen`,
    }
}

export default async function ContentPage({ params }: PageProps) {
    const supabase = await createClient()
    const { data: page } = await supabase
        .from('content_pages')
        .select('*')
        .eq('slug', params.slug)
        .eq('is_published', true)
        .single()

    if (!page) {
        notFound()
    }

    return (
        <PageLayout containerClassName="max-w-4xl py-12">
            <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
            <div
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: page.content }}
            />
        </PageLayout>
    )
}
