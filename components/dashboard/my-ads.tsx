"use client"

import { useState } from "react"
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

  const ads = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      company: "TechCorp GmbH",
      status: "Active",
      views: 145,
      applicants: 23,
      posted: "2024-01-15",
      expires: "2024-02-15",
      featured: true,
    },
    {
      id: 2,
      title: "Product Manager",
      company: "StartupXYZ",
      status: "Active",
      views: 89,
      applicants: 12,
      posted: "2024-01-10",
      expires: "2024-02-10",
      featured: false,
    },
    {
      id: 3,
      title: "UX Designer",
      company: "DesignStudio",
      status: "Expired",
      views: 234,
      applicants: 45,
      posted: "2023-12-15",
      expires: "2024-01-15",
      featured: false,
    },
    {
      id: 4,
      title: "Marketing Specialist",
      company: "MarketPro",
      status: "Draft",
      views: 0,
      applicants: 0,
      posted: "2024-01-20",
      expires: "2024-02-20",
      featured: true,
    },
  ]

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
                <p className="text-2xl font-bold">4</p>
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
                <p className="text-2xl font-bold text-green-600">2</p>
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
                <p className="text-2xl font-bold">468</p>
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
                <p className="text-2xl font-bold">80</p>
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
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{ad.title}</span>
                          {ad.featured && <Badge variant="secondary">Featured</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{ad.company}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(ad.status) as any}>{ad.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1 text-muted-foreground" />
                        {ad.views}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {ad.applicants}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(ad.posted).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(ad.expires).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="bg-transparent">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="bg-transparent">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
