"use client"

import { useEffect, useState, useMemo } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Search, Filter, Heart, Star, ShoppingBag, TrendingDown, Grid3X3, List, Loader2 } from "lucide-react"
import Link from "next/link"
import { filterDeals, sortDeals } from "@/lib/filters"
import { formatEuro, formatEuroText } from "@/lib/utils"
import { fetchWithCache } from "@/lib/utils/client-cache"
import { toast } from "@/hooks/use-toast"
import { useTranslation, useLocale } from "@/contexts/i18n-context"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"


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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1,
  })
  const { t, tr } = useTranslation()
  const locale = useLocale() // Get current language for database translations
  const { user } = useAuth()
  const router = useRouter()

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

  // Load deals from API - reloads when locale changes to get translated content
  useEffect(() => {
    const loadDeals = async () => {
      setLoading(true)
      try {
        // Use cache with 1 hour TTL - include locale in cache key
        const data = await fetchWithCache<any>(
          `/api/deals?page=1&limit=50&locale=${locale}`,
          undefined,
          { page: 1, limit: 50, locale },
          60 * 60 * 1000
        )
        const mapped = (data.deals || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description || '',
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

        const paginationData = data.pagination ?? {
          page: 1,
          limit: 50,
          total: mapped.length,
          pages: mapped.length ? 1 : 0,
        }
        setPagination({
          page: paginationData.page ?? 1,
          limit: paginationData.limit ?? 50,
          total: paginationData.total ?? mapped.length,
          pages: Math.max(paginationData.pages ?? (mapped.length ? 1 : 0), mapped.length ? 1 : 0),
        })
      } catch (error) {
        console.error('Error loading deals:', error)
        setDeals([])
        setPagination({ page: 1, limit: 50, total: 0, pages: 0 })
      } finally {
        setLoading(false)
      }
    }
    loadDeals()
  }, [locale]) // Reload when locale changes to get translated content

  const filteredDeals = filterDeals(deals, {
    searchQuery,
    categories: selectedCategories,
    brands: selectedBrands,
    priceRange,
  })

  const sortedDeals = sortDeals(filteredDeals, sortBy)

  // API returns translated content when locale is passed, no client-side translation needed

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
          <h1 className="text-3xl font-bold mb-4">{t('deals.title')}</h1>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t('deals.searchPlaceholder')}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Button size="lg" className="px-8">
              <Search className="h-4 w-4 mr-2" />
              {t('deals.searchDeals')}
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
                  {t('deals.filters')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('deals.sortBy')}</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best-deal">{t('deals.sort.bestDeal')}</SelectItem>
                      <SelectItem value="price-low">{t('deals.sort.priceLow')}</SelectItem>
                      <SelectItem value="price-high">{t('deals.sort.priceHigh')}</SelectItem>
                      <SelectItem value="discount">{t('deals.sort.discount')}</SelectItem>
                      <SelectItem value="rating">{t('deals.sort.rating')}</SelectItem>
                      <SelectItem value="newest">{t('deals.sort.newest')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Categories */}
                <div>
                  <label className="text-sm font-medium mb-3 block">{t('deals.categories')}</label>
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
                  <label className="text-sm font-medium mb-3 block">{t('deals.brands')}</label>
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
                  <label className="text-sm font-medium mb-2 block">{t('deals.priceRange')}</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('deals.selectRange')} />
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
                  {t('deals.clearAllFilters')}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Deals Listings */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {loading
                  ? t('deals.loading')
                  : tr('deals.showingCount', { count: sortedDeals.length })}
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
                <p className="text-muted-foreground">{t('deals.loadingFromApi')}</p>
              </div>
            ) : sortedDeals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('deals.noDealsFoundWithFilters')}</p>
              </div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedDeals.map((deal) => (
                      <DealCard key={deal.id} deal={deal} viewMode="grid" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedDeals.map((deal) => (
                      <DealCard key={deal.id} deal={deal} viewMode="list" />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Pagination (hidden when only one page) */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button variant="outline" disabled className="bg-transparent">
                  {t('common.previous')}
                </Button>
                {Array.from({ length: pagination.pages }, (_, index) => {
                  const pageNumber = index + 1
                  const isActive = pageNumber === pagination.page
                  return (
                    <Button
                      key={pageNumber}
                      variant="outline"
                      className={isActive ? "bg-primary text-primary-foreground" : "bg-transparent"}
                      disabled
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
                <Button variant="outline" disabled className="bg-transparent">
                  {t('common.next')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </>
    </PageLayout>
  )
}

interface DealCardProps {
  deal: any
  viewMode: "grid" | "list"
}


function DealCard({ deal, viewMode }: DealCardProps) {
  const { t, tr } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()

  // API returns translated content when locale is passed
  const title = deal.title
  const description = deal.description || ''

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch('/api/saved/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deal.id,
          title: deal.title,
          description: deal.description || '',
          currentPrice: deal.currentPrice,
          originalPrice: deal.originalPrice,
          image: deal.image,
          url: deal.url,
          store: deal.brand,
          category: deal.category,
        }),
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: t('deals.detail.savedTitle'),
          description: t('deals.detail.savedDescription')
        })
      } else {
        toast({
          title: t('deals.detail.saveErrorTitle'),
          description: data.error || t('deals.detail.saveErrorDescription'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error saving deal:', error)
      toast({
        title: t('notifications.error'),
        description: t('deals.detail.saveErrorDescription'),
        variant: 'destructive'
      })
    }
  }

  if (viewMode === "grid") {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="relative">
            <img
              src={deal.image || "/placeholder.svg?height=200&width=300&query=product"}
              alt={title}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <div className="absolute top-2 left-2">
              <Badge className="bg-accent text-accent-foreground">-{deal.discount}%</Badge>
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="bg-background/80 hover:bg-background h-8 w-8 p-0"
                onClick={handleSave}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
            {deal.featured && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary">{t('deals.featured')}</Badge>
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start gap-2">
              <Link href={`/deals/${deal.id}`} className="flex-1">
                <h3 className="font-semibold hover:text-accent transition-colors line-clamp-2">
                  {title}
                </h3>
              </Link>
            </div>

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
                {tr('deals.saveAmount', { amount: formatEuro(deal.savings) })}
              </div>
              <span className="text-sm text-muted-foreground">{tr('deals.storesCount', { count: deal.stores.length })}</span>
            </div>

            <Button className="w-full mt-4" asChild>
              <Link href={deal.url ? deal.url : `/deals/${deal.id}`}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                {deal.url ? t('deals.viewDeal') : t('deals.comparePrices')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <img
            src={deal.image || "/placeholder.svg?height=120&width=120&query=product"}
            alt={title}
            className="w-24 h-24 object-cover rounded-lg"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/deals/${deal.id}`}>
                    <h3 className="text-lg font-semibold hover:text-accent transition-colors">
                      {title}
                    </h3>
                  </Link>
                </div>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="text-sm">{deal.rating}</span>
                  <span className="text-sm text-muted-foreground ml-1">{tr('deals.reviewsCount', { count: deal.reviews })}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
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
                  {tr('deals.saveAmount', { amount: formatEuro(deal.savings) })}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">{tr('deals.storesCount', { count: deal.stores.length })}</span>
                <Button asChild>
                  <Link href={deal.url ? deal.url : `/deals/${deal.id}`}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    {deal.url ? t('deals.viewDeal') : t('deals.comparePrices')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
