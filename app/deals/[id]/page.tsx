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

  useEffect(() => {
    if (!routeParams) return
    const idVal = (routeParams as any).id as string
    if (idVal) setDealId(idVal)
  }, [routeParams])

  useEffect(() => {
    if (!dealId) return
    fetchDealDetails()
  }, [dealId])

  const fetchDealDetails = async () => {
    try {
      setLoading(true)
      // Use cache with 1 hour TTL
      const data = await fetchWithCache<any>(
        `/api/deals?page=1&limit=50`,
        undefined,
        { page: 1, limit: 50 },
        60 * 60 * 1000
      )
      
      // Find the deal by ID (normalize by decoding both sides)
      const safeDecode = (v: string) => {
        try { return decodeURIComponent(v) } catch { return v }
      }
      const routeRaw = dealId || ''
      const routeDec = safeDecode(routeRaw)
      let foundDeal = data.deals?.find((d: any) => {
        const did = String(d.id)
        const didDec = safeDecode(did)
        return did === routeRaw || did === routeDec || didDec === routeDec
      })
      
      if (foundDeal) {
        setDeal(foundDeal)
      } else {
        setError('Deal not found')
      }
    } catch (err) {
      console.error('Error fetching deal:', err)
      setError('Failed to load deal details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 container mx-auto px-4 py-8">
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
        <main className="pt-24 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Deal Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || 'The deal you\'re looking for doesn\'t exist.'}</p>
            <Button asChild>
              <Link href="/deals">Back to Deals</Link>
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

  return (
    <div className="min-h-screen">
      <Header />

      <main className="pt-24 container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground">
            <Link href="/deals" className="inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Deals
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Images & Videos */}
                  <div>
                    <div className="relative mb-4">
                      <img
                        src={currentImage || "/placeholder.svg?height=400&width=400"}
                        alt={deal.title}
                        className="w-full h-80 object-contain bg-muted rounded-lg"
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
                          Photos ({photos.length})
                        </TabsTrigger>
                        <TabsTrigger value="videos">
                          <Play className="h-4 w-4 mr-2" />
                          Videos ({videos.length})
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
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-2xl font-bold">
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {deal.title}
                          </a>
                        </h1>
                        <div className="flex items-center mt-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="font-medium">{deal.rating}</span>
                            <span className="text-muted-foreground ml-1">({deal.reviews} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="default" size="sm" asChild>
                          <Link href={sourceUrl} target="_blank">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Visit Source
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
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
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl font-bold text-accent">{formatEuro(deal.currentPrice)}</span>
                          <span className="text-lg text-muted-foreground line-through">{formatEuro(deal.originalPrice)}</span>
                        </div>
                        <div className="flex items-center mt-2 text-green-600">
                          <TrendingDown className="h-4 w-4 mr-1" />
                          <span className="font-medium">You save {formatEuro(deal.originalPrice - deal.currentPrice)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{deal.category}</Badge>
                      </div>

                      {/* Size & Color Variants */}
                      {sizeVariants.length > 0 && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Select Size</label>
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
                          <label className="text-sm font-medium mb-2 block">Select Color</label>
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
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h3 className="font-semibold mb-2 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            {offer.offer_badge || 'Available at'}
                          </h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {offer.store_favicon && (
                                <img
                                  src={offer.store_favicon}
                                  alt={offer.store_name}
                                  className="w-6 h-6 rounded"
                                />
                              )}
                              <div>
                                <span className="font-medium block">{offer.store_name}</span>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                  {offer.store_rating} ({offer.store_review_count} reviews)
                                </div>
                              </div>
                            </div>
                            <Button asChild>
                              <Link href={offer.offer_page_url} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Buy Now
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
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Product Description</h2>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{deal.description}</pre>
                    </div>
                  </div>

                  {Object.keys(attributes).length > 0 && (
                    <>
                      <Separator />
                      
                      {/* Product Attributes */}
                      <div>
                        <h2 className="text-xl font-semibold mb-3">Product Attributes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  <CardTitle>Offer Details</CardTitle>
                  <CardDescription>From {offer.store_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-bold text-lg">{formatPrice(offer.price)}</span>
                    </div>
                    {offer.original_price && (
                      <div className="flex items-center justify-between py-3 border-b">
                        <span className="text-muted-foreground">Original Price</span>
                        <span className="line-through">{formatPrice(offer.original_price)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="flex items-center">
                        <Truck className="h-4 w-4 mr-2" />
                        {offer.shipping}
                      </span>
                    </div>
                    {offer.returns && (
                      <div className="flex items-center justify-between py-3 border-b">
                        <span className="text-muted-foreground">Returns</span>
                        <span>{offer.returns}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-muted-foreground">Condition</span>
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
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {offer ? (
                  <Button className="w-full" size="lg" asChild>
                    <Link href={offer.offer_page_url} target="_blank">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Buy Now - {formatPrice(offer.price)}
                    </Link>
                  </Button>
                ) : (
                  sourceUrl && (
                    <Button className="w-full" size="lg" asChild>
                      <Link href={sourceUrl} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Source
                      </Link>
                    </Button>
                  )
                )}
                <Button variant="outline" className="w-full bg-transparent">
                  <Heart className="h-4 w-4 mr-2" />
                  Save Deal
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Deal
                </Button>
              </CardContent>
            </Card>

            {/* Product Info */}
            <Card>
              <CardHeader>
                <CardTitle>Product Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline">{deal.category}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rating</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">{deal.rating}</span>
                    <span className="text-muted-foreground ml-1">({deal.reviews})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Options */}
            <Card>
              <CardHeader>
                <CardTitle>Share This Deal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Found a great deal? Share it with your friends!
                </p>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/deals">Browse More Deals</Link>
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
