import { PageLayout } from "@/components/layout/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, ShoppingBag, TrendingUp, Users, Star, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import CountUp from "@/components/count-up"
import RotatingText from "@/components/rotating-text"
import { ShimmerButton } from "@/components/magicui/shimmer-button"
import { DotPattern } from "@/components/magicui/dot-pattern"
import { formatEuroText } from "@/lib/utils"

export default function HomePage() {
  const featuredJobs = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      company: "TechCorp",
      location: "Berlin, Germany",
      salary: "€70,000 - €90,000",
      type: "Full-time",
      featured: true,
    },
    {
      id: 2,
      title: "Product Manager",
      company: "StartupXYZ",
      location: "Munich, Germany",
      salary: "€60,000 - €80,000",
      type: "Full-time",
      featured: false,
    },
    {
      id: 3,
      title: "UX Designer",
      company: "DesignStudio",
      location: "Hamburg, Germany",
      salary: "€50,000 - €65,000",
      type: "Full-time",
      featured: false,
    },
  ]

  const topDeals = [
    {
      id: 1,
      title: "MacBook Pro M3",
      originalPrice: "€2,499",
      currentPrice: "€2,199",
      discount: "12%",
      store: "TechStore",
      rating: 4.8,
      image: "https://myshop.pk/pub/media/catalog/product/cache/26f8091d81cea4b38d820a1d1a4f62be/m/a/macbook-air-m2-myshop-pk_6__1_1.jpg",
    },
    {
      id: 2,
      title: "iPhone 15 Pro",
      originalPrice: "€1,199",
      currentPrice: "€1,099",
      discount: "8%",
      store: "MobileShop",
      rating: 4.9,
      image: "/iphone-15-pro-deal.png",
    },
    {
      id: 3,
      title: "Sony WH-1000XM5",
      originalPrice: "€399",
      currentPrice: "€299",
      discount: "25%",
      store: "AudioWorld",
      rating: 4.7,
      image: "/sony-headphones-deal.png",
    },
  ]

  const blogPosts = [
    {
      id: 1,
      title: "Top 10 Interview Tips for 2024",
      excerpt: "Master your next job interview with these proven strategies...",
      category: "Career Tips",
      readTime: "5 min read",
    },
    {
      id: 2,
      title: "Remote Work Trends in Germany",
      excerpt: "How the job market is adapting to remote work opportunities...",
      category: "Market Insights",
      readTime: "8 min read",
    },
    {
      id: 3,
      title: "Best Tech Deals This Month",
      excerpt: "Don't miss these incredible technology deals and discounts...",
      category: "Deals",
      readTime: "3 min read",
    },
  ]

  return (
    <PageLayout showBackButton={false} containerClassName="">
      <>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/50 py-8 sm:py-12 md:py-16">
          {/* Dot pattern background */}
          <DotPattern
            width={24}
            height={24}
            cx={1}
            cy={1}
            cr={1}
            className="text-neutral-400/30 [mask-image:radial-gradient(120%_60%_at_50%_0%,#000_20%,transparent_80%)]"
          />
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight mb-4 sm:mb-6">
              Find Your Next{" "}
              <RotatingText
                className="text-accent"
                words={[
                  "Opportunity",
                  "Job",
                  "Role",
                  "Deal",
                  "Offer",
                  "Career",
                  "Savings",
                ]}
              />
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Discover thousands of jobs and compare the best deals all in one place. Your career and savings start
              here.
            </p>

            {/* Hero Search */}
            <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
              <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <Input type="search" placeholder="Search jobs, companies, or deals..." className="h-11 sm:h-12 text-base sm:text-lg" />
                </div>
                <ShimmerButton
                  shimmerColor="#ffffff"
                  background="var(--primary)"
                  className="h-11 sm:h-12 px-6 sm:px-8 w-full md:w-auto text-primary-foreground"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </ShimmerButton>
              </div>
            </div>

            {/* Quick Location Links */}
            <div className="max-w-2xl mx-auto mb-2 sm:mb-4">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm">
                <span className="text-muted-foreground">Popular:</span>
                <Link
                  href="/jobs?location=Germany"
                  className="inline-flex items-center rounded-full border px-3 py-1 bg-background hover:bg-accent/50 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-1 text-red-500" />
                  Jobs in Germany
                </Link>
                <Link
                  href="/jobs?location=Austria"
                  className="inline-flex items-center rounded-full border px-3 py-1 bg-background hover:bg-accent/50 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-1 text-red-500" />
                  Jobs in Austria
                </Link>
                <Link
                  href="/jobs?location=Switzerland"
                  className="inline-flex items-center rounded-full border px-3 py-1 bg-background hover:bg-accent/50 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-1 text-red-500" />
                  Jobs in Switzerland
                </Link>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">
                  <CountUp to={50} from={0} duration={1.2} />K+
                </div>
                <div className="text-sm text-muted-foreground">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">
                  <CountUp to={100} from={0} duration={1.2} delay={0.1} />K+
                </div>
                <div className="text-sm text-muted-foreground">Daily Deals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">
                  <CountUp to={25} from={0} duration={1.2} delay={0.2} />K+
                </div>
                <div className="text-sm text-muted-foreground">Happy Users</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Jobs Section */}
        <section className="py-10 sm:py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Featured Jobs</h2>
                <p className="text-muted-foreground">Hand-picked opportunities from top companies</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/jobs">
                  View All Jobs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription>{job.company}</CardDescription>
                      </div>
                      {job.featured && <Badge variant="secondary">Featured</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2 text-red-500" />
                        {job.location}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-accent">{formatEuroText(job.salary)}</span>
                        <Badge variant="outline">{job.type}</Badge>
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-transparent" variant="outline" asChild>
                      <Link href={`/jobs/${job.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Top Deals Section */}
        <section className="py-10 sm:py-12 md:py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Top Deals</h2>
                <p className="text-muted-foreground">Best prices from trusted retailers</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/deals">
                  View All Deals
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {topDeals.map((deal) => (
                <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{deal.title}</CardTitle>
                      <Badge className="bg-accent text-accent-foreground">-{deal.discount}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Deal Image */}
                    {deal.image && (
                      <div className="mb-4">
                        <Image
                          src={deal.image}
                          alt={`${deal.title} image`}
                          width={640}
                          height={360}
                          className="w-full h-44 sm:h-40 object-cover rounded-md"
                          priority={false}
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-accent">{formatEuroText(deal.currentPrice)}</span>
                        <span className="text-sm text-muted-foreground line-through">{formatEuroText(deal.originalPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{deal.store}</span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-sm">{deal.rating}</span>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full mt-4" asChild>
                      <Link href={`/deals/${deal.id}`}>
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        View Deal
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section className="py-10 sm:py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Latest Insights</h2>
                <p className="text-muted-foreground">Career tips, market trends, and more</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/blog">
                  View All Posts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {blogPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <span className="text-sm text-muted-foreground">{post.readTime}</span>
                    </div>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                    <CardDescription>{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href={`/blog/${post.id}`}>Read More</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of professionals who trust WIRsuchen for their career growth and savings.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="w-full md:w-auto" asChild>
                <Link href="/jobs">
                  <Users className="h-5 w-5 mr-2" />
                  Find Jobs
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full md:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
                asChild
              >
                <Link href="/deals">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Browse Deals
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </>
    </PageLayout>
  )
}
