"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, ShoppingBag, FileText, TrendingUp, Eye, Users, TestTube } from "lucide-react"
import Link from "next/link"
import { formatEuroText } from "@/lib/utils"
import { LatestJobsWidget } from "@/components/dashboard/latest-jobs-widget"

export function DashboardOverview() {
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState({
    activeJobAds: 0,
    savedDeals: 0,
    totalInvoices: 0,
    profileViews: 0,
  })
  const [recentAds, setRecentAds] = useState<any[]>([])
  const [recentDeals, setRecentDeals] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Fetch user stats
        const statsRes = await fetch('/api/user/stats', { cache: 'no-store' })
        if (statsRes.ok) {
          const data = await statsRes.json()
          setUserStats({
            activeJobAds: data.activeJobAds ?? 0,
            savedDeals: data.savedDeals ?? 0,
            totalInvoices: data.totalInvoices ?? 0,
            profileViews: data.profileViews ?? 0,
          })
        }

        // Fetch real user ads (if API exists)
        try {
          const adsRes = await fetch('/api/user/ads?limit=3', { cache: 'no-store' })
          if (adsRes.ok) {
            const adsData = await adsRes.json()
            setRecentAds(adsData.ads || [])
          }
        } catch (e) {
          // API might not exist yet, just show empty
          setRecentAds([])
        }

        // Fetch real user saved deals (if API exists)
        try {
          const dealsRes = await fetch('/api/user/saved-deals?limit=3', { cache: 'no-store' })
          if (dealsRes.ok) {
            const dealsData = await dealsRes.json()
            setRecentDeals(dealsData.deals || [])
          }
        } catch (e) {
          // API might not exist yet, just show empty
          setRecentDeals([])
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = [
    { title: 'Active Job Ads', value: String(userStats.activeJobAds), change: '', icon: Briefcase, color: 'text-blue-600' },
    { title: 'Saved Deals', value: String(userStats.savedDeals), change: '', icon: ShoppingBag, color: 'text-green-600' },
    { title: 'Total Invoices', value: String(userStats.totalInvoices), change: '', icon: FileText, color: 'text-purple-600' },
    { title: 'Profile Views', value: String(userStats.profileViews), change: '', icon: Eye, color: 'text-orange-600' },
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
                    <p className="text-2xl font-bold">{loading ? '—' : stat.value}</p>
                    {stat.change ? (
                      <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                    ) : null}
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
              {recentAds.length > 0 ? recentAds.map((ad) => (
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
              )) : (
                !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No job ads yet</p>
                    <Link href="/jobs/post" className="text-primary hover:underline text-sm mt-2 inline-block">
                      Post your first job ad
                    </Link>
                  </div>
                )
              )}
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
              {recentDeals.length > 0 ? recentDeals.map((deal) => (
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
              )) : (
                !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No saved deals yet</p>
                    <Link href="/deals" className="text-primary hover:underline text-sm mt-2 inline-block">
                      Browse deals
                    </Link>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Jobs from All API Sources */}
      <LatestJobsWidget />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Button variant="outline" asChild className="h-auto p-4 flex-col space-y-2 bg-transparent border-blue-500/50 hover:bg-blue-500/10">
              <Link href="/api-test">
                <TestTube className="h-6 w-6 text-blue-600" />
                <span>API Testing</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
