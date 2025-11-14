import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BlogPost } from "@/components/blog/blog-post"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

async function getPost(param: string) {
  const supabase = await createClient()
  const trySlug = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content, featured_image_url, published_at, created_at, seo_title, seo_description, views_count, profiles:profiles(full_name), categories:categories(name)')
    .eq('slug', param)
    .eq('status', 'published')
    .maybeSingle()
  if (trySlug.data) return trySlug.data

  const isUuid = /^[0-9a-fA-F-]{32,36}$/.test(param)
  if (isUuid) {
    const byId = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, content, featured_image_url, published_at, created_at, seo_title, seo_description, views_count, profiles:profiles(full_name), categories:categories(name)')
      .eq('id', param)
      .eq('status', 'published')
      .maybeSingle()
    if (byId.data) return byId.data
  }
  return null
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const row = await getPost(params.id)
  if (!row) {
    return { title: 'Post Not Found | WIRsuchen Blog', description: 'The requested blog post could not be found.' }
  }
  return {
    title: row.seo_title || row.title,
    description: row.seo_description || row.excerpt || undefined,
    openGraph: {
      title: row.title,
      description: row.excerpt || undefined,
      images: row.featured_image_url ? [row.featured_image_url] : undefined,
      type: 'article',
      publishedTime: row.published_at || undefined,
      authors: row.profiles?.full_name ? [row.profiles.full_name] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: row.title,
      description: row.excerpt || undefined,
      images: row.featured_image_url ? [row.featured_image_url] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: { params: { id: string } }) {
  const row = await getPost(params.id)
  if (!row) redirect('/blog')

  const contentText = (row.content || '').replace(/<[^>]+>/g, ' ').trim()
  const readTime = `${Math.max(1, Math.round(contentText.split(/\s+/).filter(Boolean).length / 225))} min read`
  const post = {
    id: row.id as string,
    title: row.title as string,
    excerpt: row.excerpt || '',
    content: row.content || '',
    author: row.profiles?.full_name || 'Admin',
    publishedDate: row.published_at || row.created_at || '',
    readTime,
    category: row.categories?.name || 'General',
    tags: [] as string[],
    image: row.featured_image_url || '/blog-market-trends.png',
    views: row.views_count || 0,
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-28 md:pt-32 lg:pt-36">
        <BlogPost post={post} />
      </main>
      <Footer />
    </div>
  )
}
