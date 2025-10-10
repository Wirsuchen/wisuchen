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
} from "lucide-react"
import Link from "next/link"

interface BlogPostProps {
  post: {
    id: number
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
  const [isLiked, setIsLiked] = useState(false)
  const [likes, setLikes] = useState(Math.floor(Math.random() * 100) + 50)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = `Check out this article: ${post.title}`

    switch (platform) {
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
        navigator.clipboard.writeText(url)
        break
    }
  }

  const relatedPosts = [
    {
      id: 3,
      title: "How to Build an Effective Recruitment Strategy in 2024",
      category: "Recruiting",
      readTime: "10 min read",
      image: "/blog-recruitment-strategy.jpg",
    },
    {
      id: 4,
      title: "Salary Negotiation: A Complete Guide for German Job Market",
      category: "Career Advice",
      readTime: "7 min read",
      image: "/blog-salary-negotiation.jpg",
    },
    {
      id: 5,
      title: "The Rise of AI in Recruitment: What Job Seekers Need to Know",
      category: "Market Insights",
      readTime: "9 min read",
      image: "/blog-ai-recruitment.jpg",
    },
  ]

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link href="/blog" className="text-accent hover:underline flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
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
            {post.views} views
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
              <p className="text-sm text-muted-foreground">Content Writer</p>
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
            <Button variant="outline" size="sm" className="bg-transparent">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="mb-8">
        <img
          src={post.image || "/placeholder.svg?height=400&width=800&query=blog post hero"}
          alt={post.title}
          className="w-full h-64 md:h-96 object-cover rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Article Content */}
        <div className="lg:col-span-3">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed">
              {post.content.split("\n").map((paragraph, index) => {
                if (paragraph.startsWith("## ")) {
                  return (
                    <h2 key={index} className="text-2xl font-bold mt-8 mb-4">
                      {paragraph.replace("## ", "")}
                    </h2>
                  )
                } else if (paragraph.startsWith("### ")) {
                  return (
                    <h3 key={index} className="text-xl font-semibold mt-6 mb-3">
                      {paragraph.replace("### ", "")}
                    </h3>
                  )
                } else if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                  return (
                    <p key={index} className="font-semibold mt-4 mb-2">
                      {paragraph.replace(/\*\*/g, "")}
                    </p>
                  )
                } else if (paragraph.startsWith("- ")) {
                  return (
                    <li key={index} className="ml-4 mb-1">
                      {paragraph.replace("- ", "")}
                    </li>
                  )
                } else if (paragraph.trim() === "") {
                  return <br key={index} />
                } else {
                  return (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  )
                }
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4">Tags</h3>
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
            <h3 className="text-lg font-semibold mb-4">Share this article</h3>
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
                    Content Writer specializing in career advice and market insights.
                  </p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Related Posts */}
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4">Related Articles</h4>
                <div className="space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <div key={relatedPost.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <img
                        src={relatedPost.image || "/placeholder.svg?height=80&width=120&query=blog post"}
                        alt={relatedPost.title}
                        className="w-full h-20 object-cover rounded mb-2"
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
                <h4 className="font-semibold mb-2">Stay Updated</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Get the latest career insights delivered to your inbox.
                </p>
                <div className="space-y-2">
                  <input type="email" placeholder="Your email" className="w-full px-3 py-2 border rounded-md text-sm" />
                  <Button size="sm" className="w-full">
                    Subscribe
                  </Button>
                </div>
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
            Previous Post
          </Link>
        </Button>
        <Button variant="outline" asChild className="bg-transparent">
          <Link href="/blog/3">
            Next Post
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </article>
  )
}
