"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, Clock, ArrowRight, TrendingUp, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/contexts/i18n-context"
import { useAutoTranslatedContent } from "@/contexts/dynamic-translation-context"

export default function BlogPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; count: number }[]>([{ id: "all", name: t('blog.allPosts'), count: 0 }])
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const supabase = createClient()
      ; (async () => {
        setLoading(true)
        const { data } = await supabase
          .from('blog_posts')
          .select('id, title, slug, excerpt, content, featured_image_url, published_at, views_count, categories:categories(name,slug), profiles:profiles(full_name)')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
        const mapped = (data || []).map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt || '',
          content: p.content || '',
          author: p.profiles?.full_name || 'Admin',
          publishedDate: p.published_at || p.created_at,
          readTime: `${Math.max(1, Math.round(((p.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length) / 225))} min read`,
          category: p.categories?.name || 'General',
          categorySlug: p.categories?.slug || 'general',
          tags: [],
          image: p.featured_image_url || '/blog-market-trends.png',
          featured: false,
          views: p.views_count || 0,
        }))
        setPosts(mapped)
        const counts: Record<string, { name: string; count: number }> = {}
        mapped.forEach((m) => {
          const key = m.categorySlug
          if (!counts[key]) counts[key] = { name: m.category, count: 0 }
          counts[key].count++
        })
        setCategories([{ id: 'all', name: t('blog.allPosts'), count: mapped.length }, ...Object.entries(counts).map(([id, v]) => ({ id, name: v.name, count: v.count }))])
        setLoading(false)
      })()
  }, [])

  const featuredPost = useMemo(() => posts[0], [posts])
  const allPosts = posts

  const filteredPosts = allPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === "all" || post.category.toLowerCase().replace(/\s+/g, "-") === selectedCategory
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.publishedDate).getTime() - new Date(b.publishedDate).getTime()
      case "popular":
        return b.views - a.views
      case "newest":
      default:
        return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    }
  })


  // Prepare content items for auto-translation (using stable ID-based comparison)
  const contentItemsIdKey = useMemo(() => sortedPosts.map((p: any) => p.id).join(','), [sortedPosts])
  const contentItems = useMemo(() => {
    return sortedPosts.map((post: any) => ({
      id: `blog-${post.id}`,
      type: 'blog' as const,
      fields: {
        title: post.title || '',
        excerpt: post.excerpt || '',
      }
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentItemsIdKey, sortedPosts]) // Using contentItemsIdKey for stable comparison

  // Register blog posts for auto-translation when locale changes
  const { getTranslated, isTranslating } = useAutoTranslatedContent(contentItems)

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast({
        title: t('blog.invalidEmail'),
        description: t('blog.enterValidEmail'),
        variant: 'destructive',
      })
      return
    }

    setIsSubscribing(true)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newsletterEmail }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: t('blog.subscribed'),
          description: t('blog.subscribeSuccess')
        })
        setNewsletterEmail('')
      } else {
        toast({
          title: t('common.error'),
          description: data.error || t('blog.subscribeError'),
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      toast({
        title: t('common.error'),
        description: t('blog.subscribeErrorLater'),
        variant: 'destructive',
      })
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-28 md:pt-32 lg:pt-36 container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground">
            <Link href="/" className="inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('blog.backToHome')}
            </Link>
          </Button>
        </div>

        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('blog.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('blog.description')}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('blog.searchPlaceholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder={t('blog.allCategories')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t('blog.sort.newestFirst')}</SelectItem>
              <SelectItem value="oldest">{t('blog.sort.oldestFirst')}</SelectItem>
              <SelectItem value="popular">{t('blog.sort.mostPopular')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Featured Post */}
        {selectedCategory === "all" && !searchQuery && featuredPost && (
          <Card className="mb-12 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative">
                <img
                  src={featuredPost.image || "/placeholder.svg?height=400&width=600&query=remote work office"}
                  alt={featuredPost.title}
                  className="w-full h-64 lg:h-full object-contain bg-white"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-accent text-accent-foreground">{t('blog.featured')}</Badge>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center space-x-4 mb-4">
                  <Badge variant="secondary">{featuredPost.category}</Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(featuredPost.publishedDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {featuredPost.readTime}
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-4">{getTranslated(`blog-${featuredPost.id}`, 'title', featuredPost.title)}</h2>
                <p className="text-muted-foreground mb-6">{getTranslated(`blog-${featuredPost.id}`, 'excerpt', featuredPost.excerpt)}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {featuredPost.author
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{featuredPost.author}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {featuredPost.views} views
                      </div>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/blog/${featuredPost.slug}`}>
                      {t('blog.readMore')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <div className="relative">
                <img
                  src={post.image || "/placeholder.svg?height=200&width=400&query=blog post"}
                  alt={post.title}
                  className="w-full h-48 object-contain bg-white"
                />
                {post.featured && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-accent text-accent-foreground">{t('blog.featured')}</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-3">
                  <Badge variant="secondary">{post.category}</Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {post.readTime}
                  </div>
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="text-lg font-semibold mb-3 hover:text-accent transition-colors line-clamp-2">
                    {getTranslated(`blog-${post.id}`, 'title', post.title)}
                  </h3>
                </Link>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{getTranslated(`blog-${post.id}`, 'excerpt', post.excerpt)}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {post.author
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{post.author}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(post.publishedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {post.views}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        {sortedPosts.length > 9 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="bg-transparent">
              {t('blog.loadMoreArticles')}
            </Button>
          </div>
        )}

        {/* Newsletter Signup */}
        <Card className="mt-16 bg-muted/50">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">{t('blog.stayUpdated')}</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t('blog.newsletterDescription')}
            </p>
            <form onSubmit={handleNewsletterSubscribe} className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder={t('blog.enterEmailPlaceholder')}
                className="flex-1"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={isSubscribing}
                required
              />
              <Button type="submit" disabled={isSubscribing}>
                {isSubscribing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('blog.subscribing')}
                  </>
                ) : (
                  t('blog.subscribe')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
