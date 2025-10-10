"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, ShoppingBag, FileText, TrendingUp, Eye, Users } from "lucide-react"
import Link from "next/link"
import { formatEuroText } from "@/lib/utils"

export function DashboardOverview() {
  const stats = [
    {
      title: "Active Job Ads",
      value: "3",
      change: "+1 this month",
      icon: Briefcase,
      color: "text-blue-600",
    },
    {
      title: "Saved Deals",
      value: "12",
      change: "+4 this week",
      icon: ShoppingBag,
      color: "text-green-600",
    },
    {
      title: "Total Invoices",
      value: "8",
      change: "+2 this month",
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Profile Views",
      value: "156",
      change: "+23 this week",
      icon: Eye,
      color: "text-orange-600",
    },
  ]

  const recentAds = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      status: "Active",
      views: 45,
      applicants: 12,
      posted: "2 days ago",
    },
    {
      id: 2,
      title: "Product Manager",
      status: "Active",
      views: 23,
      applicants: 8,
      posted: "1 week ago",
    },
    {
      id: 3,
      title: "UX Designer",
      status: "Expired",
      views: 67,
      applicants: 15,
      posted: "1 month ago",
    },
  ]

  const recentDeals = [
    {
      id: 1,
      title: "MacBook Pro M3 14-inch",
      price: "€2,199",
      originalPrice: "€2,499",
      discount: "12%",
      saved: "2 days ago",
    },
    {
      id: 2,
      title: "iPhone 15 Pro 128GB",
      price: "€1,099",
      originalPrice: "€1,199",
      discount: "8%",
      saved: "1 week ago",
    },
    {
      id: 3,
      title: "Sony WH-1000XM5 Headphones",
      price: "€299",
      originalPrice: "€399",
      discount: "25%",
      saved: "3 days ago",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your account.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Job Ads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Job Ads</CardTitle>
                <CardDescription>Your latest job postings and their performance</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/my-ads">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAds.map((ad) => (
                <div key={ad.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{ad.title}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {ad.views} views
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {ad.applicants} applicants
                      </div>
                      <span>{ad.posted}</span>
                    </div>
                  </div>
                  <Badge variant={ad.status === "Active" ? "default" : "secondary"}>{ad.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Saved Deals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Saved Deals</CardTitle>
                <CardDescription>Your latest saved deals and offers</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/my-deals">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{deal.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-lg font-bold text-accent">{formatEuroText(deal.price)}</span>
                      <span className="text-sm text-muted-foreground line-through">{formatEuroText(deal.originalPrice)}</span>
                      <Badge className="bg-accent text-accent-foreground">-{deal.discount}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Saved {deal.saved}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-auto p-4 flex-col space-y-2">
              <Link href="/jobs/post">
                <Briefcase className="h-6 w-6" />
                <span>Post New Job</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto p-4 flex-col space-y-2 bg-transparent">
              <Link href="/dashboard/my-invoices">
                <FileText className="h-6 w-6" />
                <span>Create Invoice</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto p-4 flex-col space-y-2 bg-transparent">
              <Link href="/dashboard/stats">
                <TrendingUp className="h-6 w-6" />
                <span>View Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
