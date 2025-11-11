"use client"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Search, Filter, Heart, Star, ShoppingBag, TrendingDown, Grid3X3, List } from "lucide-react"
import Link from "next/link"
import { filterDeals, sortDeals } from "@/lib/filters"
import { formatEuro, formatEuroText } from "@/lib/utils"
import { fetchWithCache } from "@/lib/utils/client-cache"

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("best-deal")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState("")
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category])
    } else {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    }
  }

  const handleBrandChange = (brand: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands([...selectedBrands, brand])
    } else {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand))
    }
  }

  // Load deals from API
  useEffect(() => {
    const loadDeals = async () => {
      setLoading(true)
      try {
        // Use cache with 1 hour TTL
        const data = await fetchWithCache<any>(
          '/api/deals?page=1&limit=50',
          undefined,
          { page: 1, limit: 50 },
          60 * 60 * 1000
        )
        const mapped = (data.deals || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          brand: d.store || 'Partner',
          category: d.category || 'General',
          originalPrice: d.originalPrice ?? 0,
          currentPrice: d.currentPrice ?? 0,
          discount: d.discount ?? 0,
          rating: d.rating ?? 0,
          reviews: d.reviews ?? 0,
          image: d.image || '/placeholder.jpg',
          stores: [
            { name: d.store || 'Partner', price: d.currentPrice ?? 0, shipping: '—', inStock: true },
          ],
          featured: false,
          savings: d.originalPrice && d.currentPrice ? Math.max(0, Number(d.originalPrice) - Number(d.currentPrice)) : 0,
          url: d.url || null,
        }))
        setDeals(mapped)

        // Extract unique categories and brands from deals
        const uniqueCategories = [...new Set(mapped.map((d: any) => d.category).filter(Boolean))]
        const uniqueBrands = [...new Set(mapped.map((d: any) => d.brand).filter(Boolean))]
        setCategories(uniqueCategories as string[])
        setBrands(uniqueBrands as string[])
      } catch (error) {
        console.error('Error loading deals:', error)
        setDeals([])
      } finally {
        setLoading(false)
      }
    }
    loadDeals()
  }, [])

  const filteredDeals = filterDeals(deals, {
    searchQuery,
    categories: selectedCategories,
    brands: selectedBrands,
    priceRange,
  })

  const sortedDeals = sortDeals(filteredDeals, sortBy)

  const clearAll = () => {
    setSearchQuery("")
    setSortBy("best-deal")
    setSelectedCategories([])
    setSelectedBrands([])
    setPriceRange("")
  }

  return (
    <PageLayout showBackButton={false} containerClassName="container mx-auto px-4 sm:px-6 py-8">
      <>
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Best Deals & Price Comparison</h1>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products, brands, or categories"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Button size="lg" className="px-8">
              <Search className="h-4 w-4 mr-2" />
              Search Deals
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best-deal">Best Deal</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="discount">Highest Discount</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Categories */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Categories</label>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                        />
                        <label htmlFor={category} className="text-sm cursor-pointer">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Brands */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Brands</label>
                  <div className="space-y-2">
                    {brands.map((brand) => (
                      <div key={brand} className="flex items-center space-x-2">
                        <Checkbox
                          id={brand}
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                        />
                        <label htmlFor={brand} className="text-sm cursor-pointer">
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-100">{formatEuro(0)} - {formatEuro(100)}</SelectItem>
                      <SelectItem value="100-500">{formatEuro(100)} - {formatEuro(500)}</SelectItem>
                      <SelectItem value="500-1000">{formatEuro(500)} - {formatEuro(1000)}</SelectItem>
                      <SelectItem value="1000-2000">{formatEuro(1000)} - {formatEuro(2000)}</SelectItem>
                      <SelectItem value="2000+">{formatEuro(2000)}+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="w-full bg-transparent" onClick={clearAll}>
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Deals Listings */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {loading ? 'Loading deals...' : `Showing ${sortedDeals.length} deals`}
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "" : "bg-transparent"}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "grid" ? "" : "bg-transparent"}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading deals from API...</p>
              </div>
            ) : sortedDeals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No deals found. Try adjusting your filters.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedDeals.map((deal) => (
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="bg-background/80 hover:bg-background"
                            onClick={async (e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              try {
                                const response = await fetch('/api/saved/deals', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: deal.id,
                                    title: deal.title,
                                    description: (deal as any).description || '',
                                    currentPrice: deal.currentPrice,
                                    originalPrice: deal.originalPrice,
                                    image: deal.image,
                                    url: (deal as any).url,
                                    store: deal.brand,
                                    category: (deal as any).category,
                                  }),
                                })
                                const data = await response.json()
                                if (data.success) {
                                  alert('Deal saved successfully!')
                                }
                              } catch (error) {
                                console.error('Error saving deal:', error)
                                alert('Failed to save deal')
                              }
                            }}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                        {deal.featured && (
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary">Featured</Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <Link href={`/deals/${deal.id}`}>
                          <h3 className="font-semibold hover:text-accent transition-colors line-clamp-2">
                            {deal.title}
                          </h3>
                        </Link>

                        <div className="flex items-center mt-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm">{deal.rating}</span>
                            <span className="text-sm text-muted-foreground ml-1">({deal.reviews})</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 mt-3">
                          <span className="text-2xl font-bold text-accent">{formatEuro(deal.currentPrice)}</span>
                          <span className="text-sm text-muted-foreground line-through">{formatEuro(deal.originalPrice)}</span>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center text-sm text-green-600">
                            <TrendingDown className="h-4 w-4 mr-1" />
                            Save {formatEuro(deal.savings)}
                          </div>
                          <span className="text-sm text-muted-foreground">{deal.stores.length} stores</span>
                        </div>

                        <Button className="w-full mt-4" asChild>
                          <Link href={(deal as any).url ? (deal as any).url : `/deals/${deal.id}`} target={(deal as any).url ? '_blank' : undefined} rel={(deal as any).url ? 'noopener noreferrer' : undefined}>
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            {(deal as any).url ? 'View Deal' : 'Compare Prices'}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedDeals.map((deal) => (
                  <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <img
                          src={deal.image || "/placeholder.svg?height=120&width=120&query=product"}
                          alt={deal.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <Link href={`/deals/${deal.id}`}>
                                <h3 className="text-lg font-semibold hover:text-accent transition-colors">
                                  {deal.title}
                                </h3>
                              </Link>
                              <div className="flex items-center mt-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                                <span className="text-sm">{deal.rating}</span>
                                <span className="text-sm text-muted-foreground ml-1">({deal.reviews} reviews)</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-accent">{formatEuro(deal.currentPrice)}</span>
                                <span className="text-sm text-muted-foreground line-through">{formatEuro(deal.originalPrice)}</span>
                                <Badge className="bg-accent text-accent-foreground">-{deal.discount}%</Badge>
                              </div>
                              <div className="flex items-center text-sm text-green-600">
                                <TrendingDown className="h-4 w-4 mr-1" />
                                Save {formatEuro(deal.savings)}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-muted-foreground">{deal.stores.length} stores</span>
                              <Button asChild>
                                <Link href={(deal as any).url ? (deal as any).url : `/deals/${deal.id}`} target={(deal as any).url ? '_blank' : undefined} rel={(deal as any).url ? 'noopener noreferrer' : undefined}>
                                  <ShoppingBag className="h-4 w-4 mr-2" />
                                  {(deal as any).url ? 'View Deal' : 'Compare Prices'}
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center space-x-2 mt-8">
              <Button variant="outline" disabled className="bg-transparent">
                Previous
              </Button>
              <Button variant="outline" className="bg-primary text-primary-foreground">
                1
              </Button>
              <Button variant="outline" className="bg-transparent">
                2
              </Button>
              <Button variant="outline" className="bg-transparent">
                3
              </Button>
              <Button variant="outline" className="bg-transparent">
                Next
              </Button>
            </div>
          </div>
        </div>
      </>
    </PageLayout>
  )
}
