"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Search, Star, ShoppingBag, Trash2, ExternalLink, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { formatEuro } from "@/lib/utils"

interface SavedDeal {
  id: string
  title: string
  brand: string
  category: string
  currentPrice: number
  originalPrice: number
  discount: number
  rating: number
  image: string
  savedDate: string
  inStock: boolean
}

export function MyDeals() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [savedDeals, setSavedDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/user/saved-deals?limit=60', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load saved deals')
        const data = await res.json()
        setSavedDeals(data.deals || [])
      } catch (error) {
        console.error('Error loading saved deals:', error)
        setSavedDeals([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalSavings = savedDeals.reduce((total, deal) => total + (Number(deal.originalPrice || 0) - Number(deal.price || deal.currentPrice || 0)), 0)

  const removeDeal = async (dealId: string) => {
    try {
      const res = await fetch('/api/user/saved-deals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: dealId })
      })
      if (!res.ok) throw new Error('Failed to remove saved deal')
      setSavedDeals(prev => prev.filter(d => d.id !== dealId))
    } catch (e) {
      console.error('Remove saved deal error:', e)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!loading && savedDeals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Saved Deals</h1>
            <p className="text-muted-foreground">Track your favorite deals and never miss a bargain</p>
          </div>
          <Button variant="outline" asChild className="bg-transparent">
            <Link href="/deals">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Deals
            </Link>
          </Button>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Saved Deals Yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Start saving your favorite deals by clicking the heart icon on any deal. They'll appear here for easy access.
            </p>
            <Button asChild>
              <Link href="/deals">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse All Deals
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Saved Deals</h1>
          <p className="text-muted-foreground">Track your favorite deals and never miss a bargain</p>
        </div>
        <Button variant="outline" asChild className="bg-transparent">
          <Link href="/deals">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Browse More Deals
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saved Deals</p>
                <p className="text-2xl font-bold">{savedDeals.length}</p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">{formatEuro(totalSavings)}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold">{savedDeals.filter((deal) => deal.inStock).length}</p>
              </div>
              <Star className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Deals</CardTitle>
          <CardDescription>Manage your saved deals and track price changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="home">Home & Garden</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedDeals
              .filter((deal) => (categoryFilter === 'all' ? true : (deal.category || '').toLowerCase() === categoryFilter))
              .filter((deal) => (searchQuery ? (deal.title || '').toLowerCase().includes(searchQuery.toLowerCase()) : true))
              .map((deal) => (
              <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="relative">
                    {deal.image ? (
                      <img
                        src={deal.image}
                        alt={deal.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted rounded-t-lg" />
                    )}
                    <div className="absolute top-2 left-2">
                      {deal.discount && (
                        <Badge className="bg-accent text-accent-foreground">{deal.discount}</Badge>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <Button variant="ghost" size="sm" className="bg-background/80 hover:bg-background text-red-600">
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                    {deal.inStock === false && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <Link href={`/deals/${deal.id}`}>
                      <h3 className="font-semibold hover:text-accent transition-colors line-clamp-2">{deal.title}</h3>
                    </Link>
                    {deal.store && <p className="text-sm text-muted-foreground mt-1">{deal.store}</p>}

                    <div className="flex items-center mt-2">
                      {deal.rating && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-sm">{deal.rating}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
                      <span className="text-2xl font-bold text-accent">{formatEuro(deal.price ?? deal.currentPrice)}</span>
                      {(deal.originalPrice || deal.original_price) && (
                        <span className="text-sm text-muted-foreground line-through">{formatEuro(deal.originalPrice ?? deal.original_price)}</span>
                      )}
                    </div>

                    {deal.saved && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Saved {deal.saved}
                      </p>
                    )}

                    <div className="flex items-center space-x-2 mt-4">
                      <Button className="flex-1" asChild disabled={deal.inStock === false}>
                        <Link href={deal.url ? deal.url : `/deals/${deal.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {deal.inStock === false ? "Out of Stock" : "View Deal"}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive bg-transparent"
                        onClick={() => removeDeal(deal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
