"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { fetchWithCache } from "@/lib/utils/client-cache"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Heart,
  Share2,
  Star,
  ShoppingBag,
  TrendingDown,
  ExternalLink,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Play,
  Image as ImageIcon,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { formatEuro, formatEuroText } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/contexts/i18n-context"

interface DealDetail {
  id: string
  title: string
  description: string
  currentPrice: number
  originalPrice: number
  discount: number
  rating: number
  reviews: number
  store: string
  image: string
  url: string
  currency: string
  category: string
  brand?: string
  source: string
  product_photos?: string[]
  product_videos?: Array<{
    title: string
    url: string
    source: string
    publisher: string
    thumbnail: string
    duration_ms: number
  }>
  product_attributes?: Record<string, any>
  product_variants?: {
    Size?: Array<{ name: string; product_id: string }>
    Color?: Array<{ name: string; thumbnail: string; product_id: string }>
  }
  offer?: {
    offer_id: string
    offer_title: string | null
    offer_page_url: string
    price: string
    original_price: string | null
    on_sale: boolean
    percent_off?: string
    shipping: string
    returns?: string
    offer_badge?: string
    product_condition: string
    store_name: string
    store_rating: string
    store_review_count: number
    store_favicon: string
    payment_methods?: string
  }
}

export default function DealDetailPage() {
  const [deal, setDeal] = useState<DealDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [dealId, setDealId] = useState<string | null>(null)
  const routeParams = useParams<{ id: string }>()
  const { toast } = useToast()
  const { t, tr } = useTranslation()

  useEffect(() => {
    if (!routeParams) return
    const idVal = (routeParams as any).id as string
    if (idVal) setDealId(idVal)
  }, [routeParams])

  useEffect(() => {
    if (!dealId) return
    
    let cancelled = false
    
    const fetchDealDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Use cache with 1 hour TTL
        const data = await fetchWithCache<any>(
          `/api/deals?page=1&limit=50`,
          undefined,
          { page: 1, limit: 50 },
          60 * 60 * 1000
        )
        
        // Check if component was unmounted
        if (cancelled) return
        
        // Validate data structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response data')
        }
        
        // Find the deal by ID (normalize by decoding both sides)
        const safeDecode = (v: string) => {
          try { return decodeURIComponent(v) } catch { return v }
        }
        const routeRaw = dealId || ''
        const routeDec = safeDecode(routeRaw)
        const deals = Array.isArray(data.deals) ? data.deals : []
        
        let foundDeal = deals.find((d: any) => {
          if (!d || typeof d !== 'object') return false
          const did = String(d.id || '')
          const didDec = safeDecode(did)
          return did === routeRaw || did === routeDec || didDec === routeDec
        })
        
        if (cancelled) return
        
        if (foundDeal) {
          setDeal(foundDeal)
        } else {
          setError(t('deals.detail.notFoundDescription'))
        }
      } catch (err: any) {
        if (cancelled) return
        console.error('Error fetching deal:', err)
        setError(err?.message || t('notifications.somethingWentWrong'))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    fetchDealDetails()
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      cancelled = true
    }
  }, [dealId])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-28 md:pt-32 lg:pt-36 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-28 md:pt-32 lg:pt-36 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('deals.detail.notFoundTitle')}</h2>
            <p className="text-muted-foreground mb-6">{error || t('deals.detail.notFoundDescription')}</p>
            <Button asChild>
              <Link href="/deals">{t('deals.detail.backToDeals')}</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const photos = deal.product_photos || [deal.image]
  const videos = deal.product_videos || []
  const attributes = deal.product_attributes || {}
  const sizeVariants = deal.product_variants?.Size || []
  const colorVariants = deal.product_variants?.Color || []
  const offer = deal.offer

  const sourceUrl = offer?.offer_page_url || deal.url
  const currentImage = photos[selectedImage] || deal.image

  const formatPrice = (price: string | number) => {
    if (typeof price === 'string') {
      // Remove currency symbols and parse
      const numPrice = parseFloat(price.replace(/[^0-9.]/g, ''))
      return `€${numPrice.toFixed(2)}`
    }
    return `€${price.toFixed(2)}`
  }

  const handleShareDeal = async () => {
    if (!deal || typeof window === 'undefined') return

    const shareUrl = `${window.location.origin}/deals/${deal.id}`
    const shareTitle = `${deal.title} - ${formatEuro(deal.currentPrice)}`
    const shareText = `Check out this great deal: ${deal.title} for ${formatEuro(deal.currentPrice)} (${deal.discount}% off!)`

    // Try Web Share API first (mobile/native)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        toast({
          title: t('deals.detail.shareSuccessTitle'),
          description: t('deals.detail.shareSuccessDescription'),
        })
        return
      } catch (error: any) {
        // User cancelled or error occurred, fall through to clipboard
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    }

    // Fallback to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`)
        toast({
          title: t('deals.detail.linkCopiedTitle'),
          description: t('deals.detail.linkCopiedDescription'),
        })
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        // Final fallback: show URL in alert
        const fallbackText = `${shareTitle}\n${shareText}\n${shareUrl}`
        if (window.prompt('Copy this link:', fallbackText)) {
          toast({
            title: t('deals.detail.linkReadyTitle'),
            description: t('deals.detail.linkReadyDescription'),
          })
        }
      }
    } else {
      // Fallback for browsers without clipboard API
      const fallbackText = `${shareTitle}\n${shareText}\n${shareUrl}`
      if (window.prompt('Copy this link:', fallbackText)) {
        toast({
          title: t('deals.detail.linkReadyTitle'),
          description: t('deals.detail.linkReadyDescription'),
        })
      }
    }
  }

  const handleSaveDeal = async () => {
    if (!deal) return
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
          store: deal.store,
          category: deal.category,
        }),
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: t('deals.detail.savedTitle'),
          description: t('deals.detail.savedDescription'),
        })
      } else {
        toast({
          title: t('deals.detail.saveErrorTitle'),
          description: data.error || t('deals.detail.saveErrorDescription'),
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving deal:', error)
      toast({
        title: t('notifications.error'),
        description: t('deals.detail.saveErrorDescription'),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-28 md:pt-32 lg:pt-36 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" asChild className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground text-sm sm:text-base">
            <Link href="/deals" className="inline-flex items-center">
              <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {t('deals.detail.backButton')}
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Product Images & Videos */}
                  <div>
                    <div className="relative mb-4">
                      <img
                        src={currentImage || "/placeholder.svg?height=400&width=400"}
                        alt={deal.title}
                        className="w-full h-48 sm:h-64 md:h-80 object-contain bg-muted rounded-lg"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-600 text-white">-{deal.discount}%</Badge>
                      </div>
                      {offer?.on_sale && (
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary">{offer.percent_off}</Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Image & Video Tabs */}
                    <Tabs defaultValue="photos" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="photos">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          {t('common.photos')} ({photos.length})
                        </TabsTrigger>
                        <TabsTrigger value="videos">
                          <Play className="h-4 w-4 mr-2" />
                          {t('common.videos')} ({videos.length})
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="photos" className="mt-4">
                        <div className="grid grid-cols-4 gap-2">
                          {photos.slice(0, 12).map((image, index) => (
                            <img
                              key={index}
                              src={image || `/placeholder.svg?height=80&width=80`}
                              alt={`${deal.title} ${index + 1}`}
                              onClick={() => setSelectedImage(index)}
                              className={`w-full h-16 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity border-2 ${selectedImage === index ? 'border-accent' : 'border-transparent'}`}
                            />
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="videos" className="mt-4">
                        <div className="grid grid-cols-2 gap-2">
                          {videos.slice(0, 6).map((video, index) => (
                            <a 
                              key={index} 
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative group"
                            >
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-20 object-cover rounded"
                              />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                                <Play className="h-8 w-8 text-white" />
                              </div>
                              <div className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1 rounded">
                                {Math.floor(video.duration_ms / 1000 / 60)}:{String(Math.floor((video.duration_ms / 1000) % 60)).padStart(2, '0')}
                              </div>
                            </a>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Product Info */}
                  <div>
                    <div className="space-y-4">
                      <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                          <a
                            href={sourceUrl}
                            className="hover:underline"
                          >
                            {deal.title}
                          </a>
                        </h1>
                        <div className="flex items-center mt-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="font-medium">{deal.rating}</span>
                            <span className="text-muted-foreground ml-1">{tr('deals.reviewsCount', { count: deal.reviews })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="default" size="sm" className="flex-1 sm:flex-none" asChild>
                          <Link href={sourceUrl}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">{t('deals.detail.visitSource')}</span>
                            <span className="sm:hidden">{t('deals.detail.visit')}</span>
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-shrink-0"
                          onClick={async () => {
                            if (!deal) return
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
                          }}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-shrink-0"
                          onClick={handleShareDeal}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4 mt-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent">{formatEuro(deal.currentPrice)}</span>
                          <span className="text-base sm:text-lg text-muted-foreground line-through">{formatEuro(deal.originalPrice)}</span>
                        </div>
                        <div className="flex items-center mt-2 text-green-600">
                          <TrendingDown className="h-4 w-4 mr-1" />
                          <span className="text-sm sm:text-base font-medium">{tr('deals.detail.youSave', { amount: formatEuro(deal.originalPrice - deal.currentPrice) })}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs sm:text-sm">{deal.category}</Badge>
                      </div>

                      {/* Size & Color Variants */}
                      {sizeVariants.length > 0 && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">{t('deals.detail.selectSize')}</label>
                          <div className="flex flex-wrap gap-2">
                            {sizeVariants.slice(0, 8).map((size, idx) => (
                              <Button
                                key={idx}
                                variant={selectedSize === size.name ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedSize(size.name)}
                              >
                                {size.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {colorVariants.length > 0 && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">{t('deals.detail.selectColor')}</label>
                          <div className="flex flex-wrap gap-2">
                            {colorVariants.slice(0, 8).map((color, idx) => (
                              <div
                                key={idx}
                                onClick={() => setSelectedColor(color.name)}
                                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${selectedColor === color.name ? 'border-accent' : 'border-transparent'}`}
                              >
                                <img
                                  src={color.thumbnail}
                                  alt={color.name}
                                  className="w-12 h-12 object-cover"
                                  title={color.name}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {offer && (
                        <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                          <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            {offer.offer_badge || t('deals.detail.availableAt')}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center space-x-2">
                              {offer.store_favicon && (
                                <img
                                  src={offer.store_favicon}
                                  alt={offer.store_name}
                                  className="w-6 h-6 rounded flex-shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <span className="font-medium block text-sm sm:text-base truncate">{offer.store_name}</span>
                                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                  {offer.store_rating} {tr('deals.reviewsCount', { count: offer.store_review_count })}
                                </div>
                              </div>
                            </div>
                            <Button asChild className="w-full sm:w-auto flex-shrink-0">
                              <Link href={offer.offer_page_url} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {t('deals.detail.buyNow')}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Description */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-3">{t('deals.detail.productDescription')}</h2>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base leading-relaxed">{deal.description}</pre>
                    </div>
                  </div>

                  {Object.keys(attributes).length > 0 && (
                    <>
                      <Separator />
                      
                      {/* Product Attributes */}
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold mb-3">{t('deals.detail.productAttributes')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                          {Object.entries(attributes).slice(0, 20).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-2 border-b">
                              <span className="font-medium text-sm">{key}</span>
                              <span className="text-muted-foreground text-sm text-right">
                                {typeof value === 'string' || typeof value === 'number' ? value : JSON.stringify(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Offer Details */}
            {offer && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>{t('deals.detail.offerDetailsTitle')}</CardTitle>
                  <CardDescription>{tr('deals.detail.offerDetailsFrom', { store: offer.store_name })}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-muted-foreground">{t('deals.detail.priceLabel')}</span>
                      <span className="font-bold text-lg">{formatPrice(offer.price)}</span>
                    </div>
                    {offer.original_price && (
                      <div className="flex items-center justify-between py-3 border-b">
                        <span className="text-muted-foreground">{t('deals.detail.originalPriceLabel')}</span>
                        <span className="line-through">{formatPrice(offer.original_price)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-muted-foreground">{t('deals.detail.shippingLabel')}</span>
                      <span className="flex items-center">
                        <Truck className="h-4 w-4 mr-2" />
                        {offer.shipping}
                      </span>
                    </div>
                    {offer.returns && (
                      <div className="flex items-center justify-between py-3 border-b">
                        <span className="text-muted-foreground">{t('deals.detail.returnsLabel')}</span>
                        <span>{offer.returns}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-muted-foreground">{t('deals.detail.conditionLabel')}</span>
                      <Badge>{offer.product_condition}</Badge>
                    </div>
                    {offer.payment_methods && (
                      <div className="py-3">
                        <span className="text-muted-foreground text-sm">{offer.payment_methods}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t('deals.detail.quickActionsTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {offer ? (
                  <Button className="w-full" size="lg" asChild>
                    <Link href={offer.offer_page_url} target="_blank">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      {t('deals.detail.buyNow')} - {formatPrice(offer.price)}
                    </Link>
                  </Button>
                ) : (
                  sourceUrl && (
                    <Button className="w-full" size="lg" asChild>
                      <Link href={sourceUrl} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t('deals.detail.visitSource')}
                      </Link>
                    </Button>
                  )
                )}
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent"
                  onClick={handleSaveDeal}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {t('deals.detail.saveDealButton')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent"
                  onClick={handleShareDeal}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('deals.detail.shareDealButton')}
                </Button>
              </CardContent>
            </Card>

            {/* Product Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t('deals.detail.productInfoTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('deals.detail.categoryLabel')}</span>
                  <Badge variant="outline">{deal.category}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('deals.detail.ratingLabel')}</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">{deal.rating}</span>
                    <span className="text-muted-foreground ml-1">{tr('deals.reviewsCount', { count: deal.reviews })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Options */}
            <Card>
              <CardHeader>
                <CardTitle>{t('deals.detail.shareThisDealTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('deals.detail.shareThisDealDescription')}
                </p>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/deals">{t('deals.detail.browseMoreDeals')}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
