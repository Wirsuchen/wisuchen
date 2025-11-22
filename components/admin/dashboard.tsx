'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  ComposedChart
} from 'recharts'
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Download,
  Upload,
  Eye,
  MousePointer,
  Building,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { JobImportManager } from './job-import'
import { AffiliateImportManager } from './affiliate-import'
import { UserManagement } from './user-management'
import { RolePermissions } from './role-permissions'
import { ContentEditor } from './content-editor'
import { useIsMobile } from '@/hooks/use-mobile'
import { useTranslation } from '@/contexts/i18n-context'
import Link from 'next/link'
import Image from 'next/image'

interface DashboardStats {
  totalJobs: number
  activeJobs: number
  totalCompanies: number
  totalUsers: number
  totalRevenue: number
  monthlyRevenue: number
  totalImports: number
  successfulImports: number
  totalViews: number
  totalClicks: number
}

interface ChartData {
  name: string
  value?: number
  jobs?: number
  revenue?: number
  imports?: number
}

export function AdminDashboard() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('overview')
  const [blogAuthors, setBlogAuthors] = useState<any[]>([])
  const [blogLoading, setBlogLoading] = useState(false)
  const [blogPosts, setBlogPosts] = useState<any[]>([])
  const [blogPostsLoading, setBlogPostsLoading] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalCompanies: 0,
    totalUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalImports: 0,
    successfulImports: 0,
    totalViews: 0,
    totalClicks: 0
  })
  const [realSourceData, setRealSourceData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingSources, setLoadingSources] = useState(false)
  const isMobile = useIsMobile()

  // Mock data for charts
  const monthlyData: ChartData[] = [
    { name: 'Jan', jobs: 65, revenue: 2400, imports: 12 },
    { name: 'Feb', jobs: 78, revenue: 3200, imports: 15 },
    { name: 'Mar', jobs: 92, revenue: 4100, imports: 18 },
    { name: 'Apr', jobs: 87, revenue: 3800, imports: 16 },
    { name: 'May', jobs: 105, revenue: 4900, imports: 22 },
    { name: 'Jun', jobs: 118, revenue: 5600, imports: 25 }
  ]

  const categoryData: ChartData[] = [
    { name: 'Technology', value: 45 },
    { name: 'Marketing', value: 25 },
    { name: 'Sales', value: 15 },
    { name: 'Design', value: 10 },
    { name: 'Other', value: 5 }
  ]

  const sourceData: ChartData[] = [
    { name: 'Manual', value: 40 },
    { name: 'Adzuna', value: 25 },
    { name: 'RapidAPI', value: 20 },
    { name: 'Awin', value: 10 },
    { name: 'Adcell', value: 5 }
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  useEffect(() => {
    fetchDashboardStats()
    fetchSourceData()
  }, [])

  useEffect(() => {
    if (activeTab !== 'blog') return
      ; (async () => {
        setBlogLoading(true)
        try {
          const res = await fetch('/api/admin/blog/authors', { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            setBlogAuthors(data.authors || [])
          }
        } catch { }
        finally { setBlogLoading(false) }
      })()
      ; (async () => {
        setBlogPostsLoading(true)
        try {
          const res = await fetch('/api/admin/blog/posts?limit=20', { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            setBlogPosts(data.posts || [])
          }
        } catch { }
        finally { setBlogPostsLoading(false) }
      })()
  }, [activeTab])

  const fetchDashboardStats = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load admin stats')
      const data = await res.json()
      setStats({
        totalJobs: data.totalJobs ?? 0,
        activeJobs: data.activeJobs ?? 0,
        totalCompanies: data.totalCompanies ?? 0,
        totalUsers: data.totalUsers ?? 0,
        totalRevenue: data.totalRevenue ?? 0,
        monthlyRevenue: data.monthlyRevenue ?? 0,
        totalImports: data.totalImports ?? 0,
        successfulImports: data.successfulImports ?? 0,
        totalViews: data.totalViews ?? 0,
        totalClicks: data.totalClicks ?? 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSourceData = async () => {
    setLoadingSources(true)
    try {
      const res = await fetch('/api/admin/sources', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load source data')
      const data = await res.json()
      setRealSourceData(data)
    } catch (error) {
      console.error('Error fetching source data:', error)
    } finally {
      setLoadingSources(false)
    }
  }

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    trend,
    color = 'text-blue-600'
  }: {
    title: string
    value: string | number
    description: string
    icon: any
    trend?: string
    color?: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('admin.dashboard.description')}</p>
        </div>
        <Button onClick={fetchDashboardStats} variant="outline" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {t('admin.dashboard.refresh')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-10 gap-2">
            <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="database">{t('admin.tabs.database')}</TabsTrigger>
            <TabsTrigger value="users">{t('admin.tabs.users')}</TabsTrigger>
            <TabsTrigger value="permissions">{t('admin.tabs.permissions')}</TabsTrigger>
            <TabsTrigger value="jobs">{t('admin.tabs.jobImport')}</TabsTrigger>
            <TabsTrigger value="affiliates">{t('admin.tabs.affiliates')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('admin.tabs.analytics')}</TabsTrigger>
            <TabsTrigger value="blog">{t('admin.tabs.blog')}</TabsTrigger>
            <TabsTrigger value="content">{t('admin.tabs.content')}</TabsTrigger>
            <TabsTrigger value="billing">{t('admin.tabs.billing')}</TabsTrigger>
            <TabsTrigger value="testing">{t('admin.tabs.apiTesting')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.quickActions.title')}</CardTitle>
              <CardDescription>{t('admin.quickActions.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/api-test">{t('admin.quickActions.openAPITesting')}</Link>
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('billing')}>{t('admin.quickActions.openBilling')}</Button>
                <Button variant="outline" onClick={fetchDashboardStats} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {t('admin.quickActions.refreshStats')}
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t('admin.metrics.totalJobs')}
              value={stats.totalJobs}
              description={`${stats.activeJobs} ${t('admin.metrics.activeJobs')}`}
              icon={Briefcase}
              trend="+12% from last month"
              color="text-blue-600"
            />
            <StatCard
              title={t('admin.metrics.companies')}
              value={stats.totalCompanies}
              description={t('admin.metrics.registeredEmployers')}
              icon={Building}
              trend="+8% from last month"
              color="text-green-600"
            />
            <StatCard
              title={t('admin.metrics.users')}
              value={stats.totalUsers}
              description={t('admin.metrics.totalRegisteredUsers')}
              icon={Users}
              trend="+15% from last month"
              color="text-purple-600"
            />
            <StatCard
              title={t('admin.metrics.revenue')}
              value={`€${stats.monthlyRevenue}`}
              description={`€${stats.totalRevenue} ${t('admin.metrics.total')}`}
              icon={DollarSign}
              trend="+23% from last month"
              color="text-orange-600"
            />
          </div>

          {/* Import Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t('admin.imports.totalImports')}
              value={stats.totalImports}
              description={`${stats.successfulImports} ${t('admin.imports.successful')}`}
              icon={Download}
              trend={`${stats.totalImports ? Math.round((stats.successfulImports / stats.totalImports) * 100) : 0}% ${t('admin.imports.successRate')}`}
              color="text-indigo-600"
            />
            <StatCard
              title={t('admin.imports.jobViews')}
              value={stats.totalViews}
              description={t('admin.imports.totalJobPageViews')}
              icon={Eye}
              trend="+18% from last month"
              color="text-cyan-600"
            />
            <StatCard
              title={t('admin.imports.applications')}
              value={stats.totalClicks}
              description={t('admin.imports.totalJobApplications')}
              icon={MousePointer}
              trend="+25% from last month"
              color="text-pink-600"
            />
            <StatCard
              title={t('admin.imports.conversionRate')}
              value={`${stats.totalViews ? Math.round((stats.totalClicks / stats.totalViews) * 100) : 0}%`}
              description={t('admin.imports.viewsToApplications')}
              icon={TrendingUp}
              trend="+3% from last month"
              color="text-emerald-600"
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.charts.monthlyJobPostings')}</CardTitle>
                <CardDescription>{t('admin.charts.jobPostingsAndRevenue')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="jobs" fill="#8884d8" name={t('admin.charts.jobs')} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name={t('admin.charts.revenue')} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.charts.jobCategories')}</CardTitle>
                <CardDescription>{t('admin.charts.distributionByCategory')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.activity.title')}</CardTitle>
              <CardDescription>{t('admin.activity.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: t('admin.activity.jobImport'), source: 'Adzuna API', count: 25, time: t('admin.activity.timeAgo', { minutes: 2 }), status: 'success' },
                  { action: t('admin.activity.payment'), source: 'PayPal', count: 1, time: t('admin.activity.timeAgo', { minutes: 5 }), status: 'success' },
                  { action: t('admin.activity.affiliateImport'), source: 'Awin', count: 12, time: t('admin.activity.timeAgo', { minutes: 15 }), status: 'success' },
                  { action: t('admin.activity.jobImport'), source: 'RapidAPI', count: 8, time: t('admin.activity.timeAgo', { hours: 1 }), status: 'failed' },
                  { action: t('admin.activity.userRegistration'), source: t('admin.activity.website'), count: 3, time: t('admin.activity.timeAgo', { hours: 2 }), status: 'success' }
                ].map((activity, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      <div>
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.source} • {activity.count} {t('admin.activity.items')}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.blog.posts.title')}</CardTitle>
              <CardDescription>{t('admin.blog.posts.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {blogPostsLoading ? (
                <div className="text-center py-8 text-muted-foreground">{t('admin.blog.posts.loading')}</div>
              ) : blogPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t('admin.blog.posts.noPosts')}</div>
              ) : (
                <div className="space-y-3">
                  {blogPosts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground truncate">/{p.slug}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.status === 'published' ? 'default' : 'outline'}>{p.status}</Badge>
                        <Button size="sm" variant="outline" onClick={async () => {
                          const next = p.status === 'published' ? 'draft' : 'published'
                          const res = await fetch(`/api/admin/blog/posts/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
                          if (res.ok) {
                            const { post } = await res.json()
                            setBlogPosts((prev) => prev.map((it) => it.id === p.id ? { ...it, status: post.status, published_at: post.published_at } : it))
                          }
                        }}>
                          {p.status === 'published' ? t('admin.blog.posts.unpublish') : t('admin.blog.posts.publish')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.blog.authors.title')}</CardTitle>
              <CardDescription>{t('admin.blog.authors.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">{t('admin.blog.authors.roles')}</div>
                <Button asChild>
                  <Link href="/admin/blog/create">{t('admin.blog.authors.createNewPost')}</Link>
                </Button>
              </div>
              {blogLoading ? (
                <div className="text-center py-8 text-muted-foreground">{t('admin.blog.authors.loading')}</div>
              ) : blogAuthors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t('admin.blog.authors.noAuthors')}</div>
              ) : (
                <div className="space-y-3">
                  {blogAuthors.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Image src={a.avatar_url || '/placeholder.svg'} alt={a.full_name || a.email} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                        <div>
                          <div className="font-medium">{a.full_name || t('admin.blog.authors.unnamed')}</div>
                          <div className="text-xs text-muted-foreground">{a.email}</div>
                        </div>
                      </div>
                      <Badge variant="outline">{a.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentEditor />
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          {loadingSources ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
              <p className="text-muted-foreground">{t('admin.database.loading')}</p>
            </div>
          ) : realSourceData ? (
            <>
              {/* Database Overview */}
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                  title={t('admin.database.totalJobs')}
                  value={realSourceData.totals.jobs}
                  description={t('admin.database.fromAllAPISources')}
                  icon={Briefcase}
                  color="text-blue-600"
                />
                <StatCard
                  title={t('admin.database.totalDeals')}
                  value={realSourceData.totals.deals}
                  description={t('admin.database.affiliateProducts')}
                  icon={DollarSign}
                  color="text-green-600"
                />
                <StatCard
                  title={t('admin.database.apiSources')}
                  value={realSourceData.totals.sources}
                  description={t('admin.database.activeIntegrations')}
                  icon={Building}
                  color="text-purple-600"
                />
              </div>

              {/* Job Sources Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.database.jobSourcesBreakdown')}</CardTitle>
                  <CardDescription>{t('admin.database.realTimeData')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(realSourceData.jobSources || {})
                      .sort((a: any, b: any) => b[1] - a[1])
                      .map(([source, count]: [string, any]) => {
                        const percentage = ((count / realSourceData.totals.jobs) * 100).toFixed(1)
                        return (
                          <div key={source} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{source}</Badge>
                                <span className="text-sm font-medium">{count.toLocaleString()} {t('admin.database.jobs')}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">{percentage}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Deal Sources Breakdown */}
              {realSourceData.dealSources && Object.keys(realSourceData.dealSources).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.database.dealSourcesBreakdown')}</CardTitle>
                    <CardDescription>{t('admin.database.affiliateProductsAllSources')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(realSourceData.dealSources || {})
                        .sort((a: any, b: any) => b[1] - a[1])
                        .map(([source, count]: [string, any]) => {
                          const percentage = ((count / realSourceData.totals.deals) * 100).toFixed(1)
                          return (
                            <div key={source} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{source}</Badge>
                                  <span className="text-sm font-medium">{count.toLocaleString()} {t('admin.database.deals')}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{percentage}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-600"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pie Chart for Sources */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.database.jobSourcesDistribution')}</CardTitle>
                    <CardDescription>{t('admin.database.visualBreakdownJobSources')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(realSourceData.jobSources || {}).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(realSourceData.jobSources || {}).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.database.dealSourcesDistribution')}</CardTitle>
                    <CardDescription>{t('admin.database.visualBreakdownDealSources')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {realSourceData.dealSources && Object.keys(realSourceData.dealSources).length > 0 ? (
                      <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                        <PieChart>
                          <Pie
                            data={Object.entries(realSourceData.dealSources || {}).map(([name, value]) => ({ name, value }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Object.entries(realSourceData.dealSources || {}).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        {t('admin.database.noDealSources')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {t('admin.database.noDataAvailable')}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="permissions">
          <RolePermissions />
        </TabsContent>

        <TabsContent value="jobs">
          <JobImportManager />
        </TabsContent>

        <TabsContent value="affiliates">
          <AffiliateImportManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.importSources')}</CardTitle>
                <CardDescription>{t('admin.analytics.distributionJobSources')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.monthlyImports')}</CardTitle>
                <CardDescription>{t('admin.analytics.importActivityTime')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="imports" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.apiPerformance')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { api: 'Adzuna', status: t('admin.analytics.healthy'), response: '245ms', success: '99.2%' },
                    { api: 'RapidAPI', status: t('admin.analytics.healthy'), response: '180ms', success: '97.8%' },
                    { api: 'Awin', status: t('admin.analytics.warning'), response: '450ms', success: '95.1%' },
                    { api: 'Adcell', status: t('admin.analytics.healthy'), response: '320ms', success: '98.5%' }
                  ].map((api, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${api.status === t('admin.analytics.healthy') ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                        <span className="font-medium">{api.api}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {api.response} • {api.success}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.importSuccessRate')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {stats.totalImports ? Math.round((stats.successfulImports / stats.totalImports) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.successfulImports} {t('admin.analytics.of')} {stats.totalImports} {t('admin.analytics.importsSuccessful')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.dataQuality')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{t('admin.analytics.completeProfiles')}</span>
                    <span className="text-sm font-medium">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{t('admin.analytics.validEmails')}</span>
                    <span className="text-sm font-medium">94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{t('admin.analytics.salaryInfo')}</span>
                    <span className="text-sm font-medium">76%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{t('admin.analytics.companyDetails')}</span>
                    <span className="text-sm font-medium">82%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.billing.title')}</CardTitle>
              <CardDescription>{t('admin.billing.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t('admin.billing.notWired')}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" disabled>
                  {t('admin.billing.createInvoice')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.testing.title')}</CardTitle>
              <CardDescription>{t('admin.testing.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t('admin.testing.openDescription')}
              </p>
              <Button asChild>
                <Link href="/api-test">{t('admin.testing.openAPITesting')}</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
