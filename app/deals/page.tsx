"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
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

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("best-deal")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState("")

  const categories = ["Electronics", "Fashion", "Home & Garden", "Sports", "Books", "Beauty", "Automotive", "Toys"]

  const brands = ["Apple", "Samsung", "Nike", "Adidas", "Sony", "LG", "HP", "Dell"]

  const deals = [
    {
      id: 1,
      title: "MacBook Pro M3 14-inch",
      brand: "Apple",
      category: "Electronics",
      originalPrice: 2499,
      currentPrice: 2199,
      discount: 12,
      rating: 4.8,
      reviews: 1247,
      image: "/macbook-pro-deal.png",
      stores: [
        { name: "TechStore", price: 2199, shipping: "Free", inStock: true },
        { name: "ElectroWorld", price: 2249, shipping: "€9.99", inStock: true },
        { name: "ComputerHub", price: 2299, shipping: "Free", inStock: false },
      ],
      featured: true,
      savings: 300,
    },
    {
      id: 2,
      title: "iPhone 15 Pro 128GB",
      brand: "Apple",
      category: "Electronics",
      originalPrice: 1199,
      currentPrice: 1099,
      discount: 8,
      rating: 4.9,
      reviews: 2156,
      image: "/iphone-15-pro-deal.png",
      stores: [
        { name: "MobileShop", price: 1099, shipping: "Free", inStock: true },
        { name: "PhoneWorld", price: 1129, shipping: "€4.99", inStock: true },
        { name: "TechMart", price: 1149, shipping: "Free", inStock: true },
      ],
      featured: false,
      savings: 100,
    },
    {
      id: 3,
      title: "Sony WH-1000XM5 Headphones",
      brand: "Sony",
      category: "Electronics",
      originalPrice: 399,
      currentPrice: 299,
      discount: 25,
      rating: 4.7,
      reviews: 892,
      image: "/sony-headphones-deal.png",
      stores: [
        { name: "AudioWorld", price: 299, shipping: "Free", inStock: true },
        { name: "SoundHub", price: 319, shipping: "€5.99", inStock: true },
        { name: "MusicStore", price: 329, shipping: "Free", inStock: true },
      ],
      featured: true,
      savings: 100,
    },
    {
      id: 4,
      title: "Nike Air Max 270",
      brand: "Nike",
      category: "Fashion",
      originalPrice: 150,
      currentPrice: 119,
      discount: 21,
      rating: 4.5,
      reviews: 634,
      image: "/nike-airmax-deal.png",
      stores: [
        { name: "SportShop", price: 119, shipping: "Free", inStock: true },
        { name: "RunningWorld", price: 125, shipping: "€3.99", inStock: true },
        { name: "SneakerHub", price: 129, shipping: "Free", inStock: false },
      ],
      featured: false,
      savings: 31,
    },
    {
      id: 5,
      title: 'Samsung 55" QLED TV',
      brand: "Samsung",
      category: "Electronics",
      originalPrice: 899,
      currentPrice: 699,
      discount: 22,
      rating: 4.6,
      reviews: 445,
      image: "/samsung-tv-deal.png",
      stores: [
        { name: "ElectroWorld", price: 699, shipping: "Free", inStock: true },
        { name: "TVCenter", price: 729, shipping: "€19.99", inStock: true },
        { name: "HomeElectronics", price: 749, shipping: "Free", inStock: true },
      ],
      featured: false,
      savings: 200,
    },
    {
      id: 6,
      title: "Adidas Ultraboost 22",
      brand: "Adidas",
      category: "Fashion",
      originalPrice: 180,
      currentPrice: 129,
      discount: 28,
      rating: 4.4,
      reviews: 523,
      image: "/adidas-ultraboost-deal.png",
      stores: [
        { name: "SportWorld", price: 129, shipping: "Free", inStock: true },
        { name: "RunningGear", price: 135, shipping: "€4.99", inStock: true },
        { name: "AthleticStore", price: 139, shipping: "Free", inStock: true },
      ],
      featured: true,
      savings: 51,
    },
  ]

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
    <div className="min-h-screen">
      <Header />

      <main className="pt-24 container mx-auto px-4 py-8">
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
                Showing <span className="font-semibold">{sortedDeals.length}</span> deals
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

            {viewMode === "grid" ? (
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
                          <Button variant="ghost" size="sm" className="bg-background/80 hover:bg-background">
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
                        <p className="text-sm text-muted-foreground mt-1">{deal.brand}</p>

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
                          <Link href={`/deals/${deal.id}`}>
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Compare Prices
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
                              <p className="text-muted-foreground">{deal.brand}</p>
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
                                <Link href={`/deals/${deal.id}`}>
                                  <ShoppingBag className="h-4 w-4 mr-2" />
                                  Compare Prices
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
      </main>

      <Footer />
    </div>
  )
}
