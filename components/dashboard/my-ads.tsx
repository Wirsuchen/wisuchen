"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Users, Edit, RefreshCw, Trash2, Search, Plus } from "lucide-react"
import Link from "next/link"

export function MyAds() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [ads, setAds] = useState<Array<{ id: string; title: string; company?: string; status?: string; views?: number; applicants?: number; posted?: string; expires?: string; featured?: boolean }>>([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/user/ads?limit=50', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load ads')
        const data = await res.json()
        setAds(data.ads || [])
      } catch (e) {
        console.error('Load ads error:', e)
        setAds([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredAds = useMemo(() => {
    let list = ads
    if (statusFilter !== 'all') {
      const sf = statusFilter.toLowerCase()
      list = list.filter(a => (a.status || '').toLowerCase() === sf)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(a => a.title.toLowerCase().includes(q))
    }
    return list
  }, [ads, statusFilter, searchQuery])

  const totalAds = filteredAds.length
  const activeCount = filteredAds.filter(a => (a.status || '').toLowerCase() === 'active').length
  const totalViews = filteredAds.reduce((sum, a) => sum + (a.views || 0), 0)
  const totalApplicants = filteredAds.reduce((sum, a) => sum + (a.applicants || 0), 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "default"
      case "Expired":
        return "destructive"
      case "Draft":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const refreshAd = async (id: string) => {
    try {
      const res = await fetch('/api/user/ads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'refresh' }),
      })
      if (!res.ok) throw new Error('Failed to refresh')
      const updated = await fetch('/api/user/ads?limit=50', { cache: 'no-store' })
      const data = await updated.json()
      setAds(data.ads || [])
    } catch (e) {
      console.error('Refresh ad error:', e)
    }
  }

  const archiveAd = async (id: string) => {
    try {
      const res = await fetch('/api/user/ads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setAds(prev => prev.filter(a => a.id !== id))
    } catch (e) {
      console.error('Archive ad error:', e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Job Ads</h1>
          <p className="text-muted-foreground">Manage your job postings and track their performance</p>
        </div>
        <Button asChild>
          <Link href="/jobs/post">
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ads</p>
                <p className="text-2xl font-bold">{loading ? '—' : totalAds}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{loading ? '—' : activeCount}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{loading ? '—' : totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Applicants</p>
                <p className="text-2xl font-bold">{loading ? '—' : totalApplicants}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Job Listings</CardTitle>
          <CardDescription>View and manage all your job postings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search job titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Jobs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ) : filteredAds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No job ads yet. <Link href="/jobs/post" className="underline">Post your first job</Link>.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{ad.title}</span>
                            {ad.featured && <Badge variant="secondary">Featured</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{ad.company || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(ad.status || '') as any}>{ad.status || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1 text-muted-foreground" />
                          {ad.views ?? 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                          {ad.applicants ?? 0}
                        </div>
                      </TableCell>
                      <TableCell>{ad.posted || '—'}</TableCell>
                      <TableCell>{ad.expires ? new Date(ad.expires).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="bg-transparent" asChild>
                            <Link href={`/jobs/post?edit=${ad.id}`}>
                            <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="bg-transparent" onClick={() => refreshAd(ad.id)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive bg-transparent"
                            onClick={() => archiveAd(ad.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
