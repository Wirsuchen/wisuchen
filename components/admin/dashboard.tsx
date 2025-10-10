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
  Cell
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
  value: number
  jobs?: number
  revenue?: number
  imports?: number
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
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
  const [isLoading, setIsLoading] = useState(true)

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
  }, [])

  const fetchDashboardStats = async () => {
    setIsLoading(true)
    try {
      // In a real app, you would fetch from multiple endpoints
      // For now, we'll simulate with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStats({
        totalJobs: 1247,
        activeJobs: 892,
        totalCompanies: 156,
        totalUsers: 3421,
        totalRevenue: 24580,
        monthlyRevenue: 5600,
        totalImports: 108,
        successfulImports: 95,
        totalViews: 45230,
        totalClicks: 8940
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setIsLoading(false)
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
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your TalentPlus job portal</p>
        </div>
        <Button onClick={fetchDashboardStats} variant="outline" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Job Import</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Jobs"
              value={stats.totalJobs}
              description={`${stats.activeJobs} active jobs`}
              icon={Briefcase}
              trend="+12% from last month"
              color="text-blue-600"
            />
            <StatCard
              title="Companies"
              value={stats.totalCompanies}
              description="Registered employers"
              icon={Building}
              trend="+8% from last month"
              color="text-green-600"
            />
            <StatCard
              title="Users"
              value={stats.totalUsers}
              description="Total registered users"
              icon={Users}
              trend="+15% from last month"
              color="text-purple-600"
            />
            <StatCard
              title="Revenue"
              value={`€${stats.monthlyRevenue}`}
              description={`€${stats.totalRevenue} total`}
              icon={DollarSign}
              trend="+23% from last month"
              color="text-orange-600"
            />
          </div>

          {/* Import Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Imports"
              value={stats.totalImports}
              description={`${stats.successfulImports} successful`}
              icon={Download}
              trend={`${Math.round((stats.successfulImports / stats.totalImports) * 100)}% success rate`}
              color="text-indigo-600"
            />
            <StatCard
              title="Job Views"
              value={stats.totalViews}
              description="Total job page views"
              icon={Eye}
              trend="+18% from last month"
              color="text-cyan-600"
            />
            <StatCard
              title="Applications"
              value={stats.totalClicks}
              description="Total job applications"
              icon={MousePointer}
              trend="+25% from last month"
              color="text-pink-600"
            />
            <StatCard
              title="Conversion Rate"
              value={`${Math.round((stats.totalClicks / stats.totalViews) * 100)}%`}
              description="Views to applications"
              icon={TrendingUp}
              trend="+3% from last month"
              color="text-emerald-600"
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Job Postings</CardTitle>
                <CardDescription>Job postings and revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="jobs" fill="#8884d8" name="Jobs" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue (€)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Categories</CardTitle>
                <CardDescription>Distribution of job postings by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities and imports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Job Import', source: 'Adzuna API', count: 25, time: '2 minutes ago', status: 'success' },
                  { action: 'Payment', source: 'PayPal', count: 1, time: '5 minutes ago', status: 'success' },
                  { action: 'Affiliate Import', source: 'Awin', count: 12, time: '15 minutes ago', status: 'success' },
                  { action: 'Job Import', source: 'RapidAPI', count: 8, time: '1 hour ago', status: 'failed' },
                  { action: 'User Registration', source: 'Website', count: 3, time: '2 hours ago', status: 'success' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.source} • {activity.count} items
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                <CardTitle>Import Sources</CardTitle>
                <CardDescription>Distribution of job sources</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                <CardTitle>Monthly Imports</CardTitle>
                <CardDescription>Import activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
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
                <CardTitle>API Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { api: 'Adzuna', status: 'Healthy', response: '245ms', success: '99.2%' },
                    { api: 'RapidAPI', status: 'Healthy', response: '180ms', success: '97.8%' },
                    { api: 'Awin', status: 'Warning', response: '450ms', success: '95.1%' },
                    { api: 'Adcell', status: 'Healthy', response: '320ms', success: '98.5%' }
                  ].map((api, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          api.status === 'Healthy' ? 'bg-green-500' : 'bg-yellow-500'
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
                <CardTitle>Import Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round((stats.successfulImports / stats.totalImports) * 100)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.successfulImports} of {stats.totalImports} imports successful
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Complete Profiles</span>
                    <span className="text-sm font-medium">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Valid Emails</span>
                    <span className="text-sm font-medium">94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Salary Info</span>
                    <span className="text-sm font-medium">76%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Company Details</span>
                    <span className="text-sm font-medium">82%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
