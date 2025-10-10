"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, Clock, ArrowRight, TrendingUp, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  const categories = [
    { id: "all", name: "All Posts", count: 24 },
    { id: "job-tips", name: "Job Tips", count: 8 },
    { id: "recruiting", name: "Recruiting", count: 6 },
    { id: "market-insights", name: "Market Insights", count: 5 },
    { id: "career-advice", name: "Career Advice", count: 3 },
    { id: "deals", name: "Deals & Savings", count: 2 },
  ]

  const featuredPost = {
    id: 1,
    title: "The Future of Remote Work in Germany: Trends and Opportunities for 2024",
    excerpt:
      "Explore how remote work is reshaping the German job market and what it means for both employers and job seekers in the coming year.",
    content: "Remote work has fundamentally changed the employment landscape in Germany...",
    author: "Sarah Mueller",
    publishedDate: "2024-01-20",
    readTime: "8 min read",
    category: "Market Insights",
    tags: ["Remote Work", "Germany", "Trends", "2024"],
    image: "/blog-remote-work.jpg",
    featured: true,
    views: 2456,
  }

  const blogPosts = [
    {
      id: 2,
      title: "10 Essential Interview Tips That Will Land You Your Dream Job",
      excerpt:
        "Master the art of interviewing with these proven strategies that have helped thousands of candidates succeed.",
      content: "Job interviews can be nerve-wracking, but with the right preparation...",
      author: "Michael Schmidt",
      publishedDate: "2024-01-18",
      readTime: "6 min read",
      category: "Job Tips",
      tags: ["Interview", "Career", "Tips"],
      image: "/blog-interview-tips.jpg",
      featured: false,
      views: 1834,
    },
    {
      id: 3,
      title: "How to Build an Effective Recruitment Strategy in 2024",
      excerpt:
        "Learn the latest recruitment techniques and tools that top companies are using to attract the best talent.",
      content: "The recruitment landscape is evolving rapidly...",
      author: "Anna Weber",
      publishedDate: "2024-01-15",
      readTime: "10 min read",
      category: "Recruiting",
      tags: ["Recruitment", "HR", "Strategy"],
      image: "/blog-recruitment-strategy.jpg",
      featured: false,
      views: 1567,
    },
    {
      id: 4,
      title: "Salary Negotiation: A Complete Guide for German Job Market",
      excerpt:
        "Navigate salary negotiations with confidence using these expert tips tailored for the German employment market.",
      content: "Salary negotiation is a crucial skill that can significantly impact your career...",
      author: "Thomas Bauer",
      publishedDate: "2024-01-12",
      readTime: "7 min read",
      category: "Career Advice",
      tags: ["Salary", "Negotiation", "Germany"],
      image: "/blog-salary-negotiation.jpg",
      featured: false,
      views: 2103,
    },
    {
      id: 5,
      title: "Best Tech Deals for Remote Workers: January 2024 Edition",
      excerpt:
        "Discover the top technology deals and discounts that can enhance your remote work setup without breaking the bank.",
      content: "Working from home requires the right tools and equipment...",
      author: "Lisa Chen",
      publishedDate: "2024-01-10",
      readTime: "5 min read",
      category: "Deals & Savings",
      tags: ["Tech", "Deals", "Remote Work"],
      image: "/blog-tech-deals.jpg",
      featured: false,
      views: 987,
    },
    {
      id: 6,
      title: "The Rise of AI in Recruitment: What Job Seekers Need to Know",
      excerpt:
        "Understand how artificial intelligence is changing the hiring process and how to adapt your job search strategy.",
      content: "Artificial intelligence is revolutionizing many industries...",
      author: "David Kim",
      publishedDate: "2024-01-08",
      readTime: "9 min read",
      category: "Market Insights",
      tags: ["AI", "Recruitment", "Technology"],
      image: "/blog-ai-recruitment.jpg",
      featured: false,
      views: 1456,
    },
    {
      id: 7,
      title: "Building Your Personal Brand as a Professional",
      excerpt:
        "Learn how to create and maintain a strong personal brand that will help you stand out in today's competitive job market.",
      content: "In today's digital age, personal branding has become essential...",
      author: "Emma Johnson",
      publishedDate: "2024-01-05",
      readTime: "8 min read",
      category: "Career Advice",
      tags: ["Personal Brand", "LinkedIn", "Networking"],
      image: "/blog-personal-brand.jpg",
      featured: false,
      views: 1789,
    },
  ]

  const allPosts = [featuredPost, ...blogPosts]

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

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-24 container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground">
            <Link href="/" className="inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">WIRsuchen Blog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest insights on careers, recruitment, market trends, and exclusive deals.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="All Categories" />
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
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Featured Post */}
        {selectedCategory === "all" && !searchQuery && (
          <Card className="mb-12 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative">
                <img
                  src={featuredPost.image || "/placeholder.svg?height=400&width=600&query=remote work office"}
                  alt={featuredPost.title}
                  className="w-full h-64 lg:h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-accent text-accent-foreground">Featured</Badge>
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
                <h2 className="text-2xl font-bold mb-4">{featuredPost.title}</h2>
                <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {featuredPost.author
                        .split(" ")
                        .map((n) => n[0])
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
                    <Link href={`/blog/${featuredPost.id}`}>
                      Read More
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
          {sortedPosts.slice(selectedCategory === "all" && !searchQuery ? 1 : 0).map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <div className="relative">
                <img
                  src={post.image || "/placeholder.svg?height=200&width=400&query=blog post"}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                {post.featured && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-accent text-accent-foreground">Featured</Badge>
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
                <Link href={`/blog/${post.id}`}>
                  <h3 className="text-lg font-semibold mb-3 hover:text-accent transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {post.author
                        .split(" ")
                        .map((n) => n[0])
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
              Load More Articles
            </Button>
          </div>
        )}

        {/* Newsletter Signup */}
        <Card className="mt-16 bg-muted/50">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter and get the latest career insights, job market trends, and exclusive deals
              delivered to your inbox.
            </p>
            <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
              <Input type="email" placeholder="Enter your email address" className="flex-1" />
              <Button>Subscribe</Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
