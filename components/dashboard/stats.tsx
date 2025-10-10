"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, Eye, MousePointer, Users, DollarSign } from "lucide-react"

export function Stats() {
  const monthlyData = [
    { month: "Jan", views: 120, clicks: 45, applications: 12 },
    { month: "Feb", views: 180, clicks: 67, applications: 18 },
    { month: "Mar", views: 240, clicks: 89, applications: 25 },
    { month: "Apr", views: 200, clicks: 76, applications: 21 },
    { month: "May", views: 280, clicks: 102, applications: 32 },
    { month: "Jun", views: 320, clicks: 125, applications: 38 },
  ]

  const [timeframe, setTimeframe] = useState<"1month" | "3months" | "6months" | "1year">("6months")

  const filteredMonthlyData = useMemo(() => {
    switch (timeframe) {
      case "1month":
        return monthlyData.slice(-1)
      case "3months":
        return monthlyData.slice(-3)
      case "6months":
        return monthlyData
      case "1year":
        // Demo data only contains 6 months; in real data, expand to 12 months.
        return monthlyData
      default:
        return monthlyData
    }
  }, [timeframe, monthlyData])

  const jobPerformanceData = [
    { job: "Frontend Dev", views: 145, applications: 23 },
    { job: "Product Manager", views: 89, applications: 12 },
    { job: "UX Designer", views: 234, applications: 45 },
    { job: "Marketing Spec", views: 67, applications: 8 },
  ]

  const categoryData = [
    { name: "Technology", value: 45, color: "#3b82f6" },
    { name: "Marketing", value: 25, color: "#ef4444" },
    { name: "Design", value: 20, color: "#10b981" },
    { name: "Sales", value: 10, color: "#f59e0b" },
  ]

  const stats = [
    {
      title: "Total Views",
      value: "1,456",
      change: "+12.5%",
      trend: "up",
      icon: Eye,
      color: "text-blue-600",
    },
    {
      title: "Click Rate",
      value: "8.2%",
      change: "+2.1%",
      trend: "up",
      icon: MousePointer,
      color: "text-green-600",
    },
    {
      title: "Applications",
      value: "168",
      change: "+18.3%",
      trend: "up",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Conversion Rate",
      value: "11.5%",
      change: "-1.2%",
      trend: "down",
      icon: DollarSign,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Stats</h1>
          <p className="text-muted-foreground">Track your job ads performance and user engagement</p>
        </div>
        <Select value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      <TrendIcon
                        className={`h-4 w-4 mr-1 ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}
                      />
                      <span className={`text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Views, clicks, and applications over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="clicks" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="applications" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Job Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Job Performance</CardTitle>
            <CardDescription>Views and applications by job posting</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="job" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#3b82f6" />
                <Bar dataKey="applications" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Job postings by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <span className="text-sm">{category.name}</span>
                  <Badge variant="secondary">{category.value}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Ads */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Performing Ads</CardTitle>
            <CardDescription>Your best performing job postings this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobPerformanceData
                .sort((a, b) => b.views - a.views)
                .map((job, index) => (
                  <div key={job.job} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{job.job}</h4>
                        <p className="text-sm text-muted-foreground">
                          {job.views} views • {job.applications} applications
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {((job.applications / job.views) * 100).toFixed(1)}% conversion
                      </p>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? "Best" : `#${index + 1}`}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
