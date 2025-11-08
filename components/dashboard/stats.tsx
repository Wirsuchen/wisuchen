"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Briefcase, FileText, Heart, Loader2 } from "lucide-react"

export function Stats() {
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState<{ activeJobAds: number; savedDeals: number; totalInvoices: number; profileViews: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/user/stats', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load user stats')
        const data = await res.json()
        setUserStats({
          activeJobAds: Number(data.activeJobAds || 0),
          savedDeals: Number(data.savedDeals || 0),
          totalInvoices: Number(data.totalInvoices || 0),
          profileViews: Number(data.profileViews || 0),
        })
      } catch (e) {
        console.error('Stats error:', e)
        setUserStats({ activeJobAds: 0, savedDeals: 0, totalInvoices: 0, profileViews: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  const stats = [
    { title: 'Total Views', value: userStats?.profileViews ?? 0, icon: Eye, color: 'text-blue-600' },
    { title: 'Active Ads', value: userStats?.activeJobAds ?? 0, icon: Briefcase, color: 'text-green-600' },
    { title: 'Total Invoices', value: userStats?.totalInvoices ?? 0, icon: FileText, color: 'text-purple-600' },
    { title: 'Saved Deals', value: userStats?.savedDeals ?? 0, icon: Heart, color: 'text-orange-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics & Stats</h1>
        <p className="text-muted-foreground">Real-time metrics from Supabase</p>
      </div>

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
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>Charts will appear here once enough data is available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            No chart data available yet.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
