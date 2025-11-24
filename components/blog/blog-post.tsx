"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  User,
  TrendingUp,
  Share2,
  Heart,
  Twitter,
  Facebook,
  Linkedin,
  LinkIcon,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { useTranslation } from '@/contexts/i18n-context'

interface BlogPostProps {
  post: {
    id: string
    title: string
    excerpt: string
    content: string
    author: string
    publishedDate: string
    readTime: string
    category: string
    tags: string[]
    image: string
    views: number
  }
}

export function BlogPost({ post }: BlogPostProps) {
  const { t } = useTranslation()
  const [isLiked, setIsLiked] = useState(false)
  const [likes, setLikes] = useState(Math.floor(Math.random() * 100) + 50)
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { toast } = useToast()

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
  }

  const handleShare = async (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = `${t('blogPost.shareText', 'Check out this article:')} ${post.title}`

    try {
      switch (platform) {
        case "native": {
          if (navigator.share) {
            await navigator.share({ title: post.title, text, url })
            toast({
              title: t('blogPost.shareSharedTitle', 'Shared'),
              description: t('blogPost.shareSharedDescription', 'Thanks for sharing this article.'),
            })
          } else {
            await navigator.clipboard.writeText(url)
            toast({
              title: t('blogPost.linkCopiedTitle', 'Link copied'),
              description: t('blogPost.linkCopiedDescription', 'Share it with your friends.'),
            })
          }
          break
        }
        case "twitter":
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)
          break
        case "facebook":
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
          break
        case "linkedin":
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)
          break
        case "copy":
          await navigator.clipboard.writeText(url)
          toast({
            title: t('blogPost.linkCopiedTitle', 'Link copied'),
            description: t('blogPost.linkCopiedClipboard', 'URL copied to clipboard.'),
          })
          break
      }
    } catch (e: any) {
      toast({
        title: t('blogPost.shareErrorTitle', 'Share failed'),
        description: e?.message || t('blogPost.shareErrorDescription', 'Unable to share right now.'),
        variant: 'destructive',
      })
    }
  }

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast({
        title: t('blog.invalidEmail', 'Invalid email'),
        description: t('blog.enterValidEmail', 'Please enter a valid email address'),
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
          title: t('blog.subscribed', 'Subscribed!'),
          description: t('blog.subscribeSuccess', 'Thank you for subscribing to our newsletter'),
        })
        setNewsletterEmail('')
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: data.error || t('blog.subscribeError', 'Failed to subscribe. Please try again.'),
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      toast({
        title: t('common.error', 'Error'),
        description: t('blog.subscribeErrorLater', 'Failed to subscribe. Please try again later.'),
        variant: 'destructive',
      })
    } finally {
      setIsSubscribing(false)
    }
  }

  const relatedPosts = [
    {
      id: 3,
      title: "How to Build an Effective Recruitment Strategy in 2024",
      category: "Recruiting",
      readTime: "10 min read",
      image: "/blog-career-growth.png",
    },
    {
      id: 4,
      title: "Salary Negotiation: A Complete Guide for German Job Market",
      category: "Career Advice",
      readTime: "7 min read",
      image: "/blog-salary-negotiation.png",
    },
    {
      id: 5,
      title: "The Rise of AI in Recruitment: What Job Seekers Need to Know",
      category: "Market Insights",
      readTime: "9 min read",
      image: "/blog-ai-recruiting.png",
    },
  ]

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link href="/blog" className="text-accent hover:underline flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('blogPost.backToBlog', 'Back to Blog')}
        </Link>
      </nav>

      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Badge variant="secondary">{post.category}</Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(post.publishedDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {post.readTime}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 mr-1" />
            {post.views} {t('blogPost.viewsLabel', 'views')}
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{post.title}</h1>

        <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
              {post.author
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <p className="font-medium">{post.author}</p>
              <p className="text-sm text-muted-foreground">{t('blogPost.authorRole')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLike}
              className={`bg-transparent ${isLiked ? "text-red-600 border-red-600" : ""}`}
            >
              <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
              {likes}
            </Button>
            <Button variant="outline" size="sm" className="bg-transparent" onClick={() => handleShare("native")}>
              <Share2 className="h-4 w-4 mr-2" />
              {t('blogPost.share')}
            </Button>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="mb-8">
        <img
          src={post.image || "/placeholder.svg?height=400&width=800&query=blog post hero"}
          alt={post.title}
          className="w-full h-64 md:h-96 object-contain bg-white rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Article Content */}
        <div className="lg:col-span-3">
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

          {/* Tags */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4">{t('blogPost.tags')}</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Share Buttons */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4">
              {t('blogPost.shareSectionTitle', 'Share this article')}
            </h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleShare("twitter")} className="bg-transparent">
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare("facebook")} className="bg-transparent">
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare("linkedin")} className="bg-transparent">
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare("copy")} className="bg-transparent">
                <LinkIcon className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Author Info */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto mb-4">
                    {post.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <h4 className="font-semibold mb-2">{post.author}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t(
                      'blogPost.authorBio',
                      'Content Writer specializing in career advice and market insights.'
                    )}
                  </p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <User className="h-4 w-4 mr-2" />
                    {t('blogPost.viewProfile')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Related Posts */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4">{t('blogPost.relatedArticles')}</h4>
                <div className="space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <div key={relatedPost.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <img
                        src={relatedPost.image || "/placeholder.svg?height=80&width=120&query=blog post"}
                        alt={relatedPost.title}
                        className="w-full h-20 object-contain bg-white rounded mb-2"
                      />
                      <Link href={`/blog/${relatedPost.id}`}>
                        <h5 className="font-medium text-sm hover:text-accent transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h5>
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          {relatedPost.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{relatedPost.readTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Newsletter Signup */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-2">{t('blogPost.newsletter.title')}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('blogPost.newsletter.description')}
                </p>
                <form onSubmit={handleNewsletterSubscribe} className="space-y-2">
                  <Input
                    type="email"
                    placeholder={t('blogPost.newsletter.placeholder')}
                    className="text-sm"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    disabled={isSubscribing}
                    required
                  />
                  <Button size="sm" className="w-full" type="submit" disabled={isSubscribing}>
                    {isSubscribing ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        {t('blogPost.newsletter.subscribing')}
                      </>
                    ) : (
                      t('blogPost.newsletter.subscribe')
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-16 pt-8 border-t">
        <Button variant="outline" asChild className="bg-transparent">
          <Link href="/blog/1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('blogPost.navigation.previous')}
          </Link>
        </Button>
        <Button variant="outline" asChild className="bg-transparent">
          <Link href="/blog/3">
            {t('blogPost.navigation.next')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </article>
  )
}
