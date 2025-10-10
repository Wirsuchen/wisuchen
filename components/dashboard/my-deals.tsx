"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Search, Star, ShoppingBag, Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { formatEuro } from "@/lib/utils"

export function MyDeals() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const savedDeals = [
    {
      id: 1,
      title: "MacBook Pro M3 14-inch",
      brand: "Apple",
      category: "Electronics",
      currentPrice: 2199,
      originalPrice: 2499,
      discount: 12,
      rating: 4.8,
      image: "/macbook-pro-deal.jpg",
      savedDate: "2024-01-15",
      inStock: true,
    },
    {
      id: 2,
      title: "iPhone 15 Pro 128GB",
      brand: "Apple",
      category: "Electronics",
      currentPrice: 1099,
      originalPrice: 1199,
      discount: 8,
      rating: 4.9,
      image: "/iphone-15-pro-deal.jpg",
      savedDate: "2024-01-10",
      inStock: true,
    },
    {
      id: 3,
      title: "Sony WH-1000XM5 Headphones",
      brand: "Sony",
      category: "Electronics",
      currentPrice: 299,
      originalPrice: 399,
      discount: 25,
      rating: 4.7,
      image: "/sony-headphones-deal.jpg",
      savedDate: "2024-01-12",
      inStock: true,
    },
    {
      id: 4,
      title: "Nike Air Max 270",
      brand: "Nike",
      category: "Fashion",
      currentPrice: 119,
      originalPrice: 150,
      discount: 21,
      rating: 4.5,
      image: "/nike-airmax-deal.jpg",
      savedDate: "2024-01-08",
      inStock: false,
    },
    {
      id: 5,
      title: 'Samsung 55" QLED TV',
      brand: "Samsung",
      category: "Electronics",
      currentPrice: 699,
      originalPrice: 899,
      discount: 22,
      rating: 4.6,
      image: "/samsung-tv-deal.jpg",
      savedDate: "2024-01-05",
      inStock: true,
    },
  ]

  const totalSavings = savedDeals.reduce((total, deal) => total + (deal.originalPrice - deal.currentPrice), 0)

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
            {savedDeals.map((deal) => (
              <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={deal.image || "/placeholder.svg?height=200&width=300&query=product"}
                      alt={deal.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-accent text-accent-foreground">-{deal.discount}%</Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Button variant="ghost" size="sm" className="bg-background/80 hover:bg-background text-red-600">
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                    {!deal.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <Link href={`/deals/${deal.id}`}>
                      <h3 className="font-semibold hover:text-accent transition-colors line-clamp-2">{deal.title}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">{deal.brand}</p>

                    <div className="flex items-center mt-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="text-sm">{deal.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
                      <span className="text-2xl font-bold text-accent">{formatEuro(deal.currentPrice)}</span>
                      <span className="text-sm text-muted-foreground line-through">{formatEuro(deal.originalPrice)}</span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Saved on {new Date(deal.savedDate).toLocaleDateString()}
                    </p>

                    <div className="flex items-center space-x-2 mt-4">
                      <Button className="flex-1" asChild disabled={!deal.inStock}>
                        <Link href={`/deals/${deal.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {deal.inStock ? "View Deal" : "Out of Stock"}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive bg-transparent"
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
