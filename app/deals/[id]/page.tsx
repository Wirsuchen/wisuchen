"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"
import Link from "next/link"
import { formatEuro, formatEuroText } from "@/lib/utils"

export default function DealDetailPage({ params }: { params: { id: string } }) {
  const [selectedStore, setSelectedStore] = useState(0)

  // Mock deal data - in real app, fetch based on params.id
  const deal = {
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
    images: ["/macbook-pro-deal.png", "/macbook-pro-side.jpg", "/macbook-pro-keyboard.jpg", "/macbook-pro-ports.jpg"],
    description: `The MacBook Pro M3 14-inch delivers exceptional performance with Apple's latest M3 chip. Perfect for professionals, creators, and power users who demand the best.

Key Features:
• Apple M3 chip with 8-core CPU and 10-core GPU
• 14-inch Liquid Retina XDR display
• 16GB unified memory, 512GB SSD storage
• Up to 22 hours battery life
• Three Thunderbolt 4 ports, HDMI port, SDXC card slot
• 1080p FaceTime HD camera
• Six-speaker sound system with Spatial Audio

This laptop combines power, portability, and stunning display quality in one premium package.`,
    specifications: {
      Display: "14-inch Liquid Retina XDR",
      Processor: "Apple M3 chip",
      Memory: "16GB unified memory",
      Storage: "512GB SSD",
      Graphics: "10-core GPU",
      Battery: "Up to 22 hours",
      Weight: "1.55 kg",
      Dimensions: "31.26 × 22.12 × 1.55 cm",
    },
    stores: [
      {
        name: "TechStore",
        price: 2199,
        originalPrice: 2499,
        shipping: "Free",
        shippingTime: "1-2 days",
        inStock: true,
        rating: 4.7,
        url: "https://techstore.example.com",
        logo: "/techstore-logo.png",
        verified: true,
      },
      {
        name: "ElectroWorld",
        price: 2249,
        originalPrice: 2499,
        shipping: "€9.99",
        shippingTime: "2-3 days",
        inStock: true,
        rating: 4.5,
        url: "https://electroworld.example.com",
        logo: "/electroworld-logo.png",
        verified: true,
      },
      {
        name: "ComputerHub",
        price: 2299,
        originalPrice: 2499,
        shipping: "Free",
        shippingTime: "3-5 days",
        inStock: false,
        rating: 4.3,
        url: "https://computerhub.example.com",
        logo: "/computerhub-logo.png",
        verified: false,
      },
      {
        name: "TechMart",
        price: 2349,
        originalPrice: 2499,
        shipping: "€14.99",
        shippingTime: "1-2 days",
        inStock: true,
        rating: 4.6,
        url: "https://techmart.example.com",
        logo: "/techmart-logo.png",
        verified: true,
      },
    ],
    featured: true,
    savings: 300,
  }

  const relatedDeals = [
    {
      id: 2,
      title: "MacBook Air M2",
      currentPrice: 1299,
      originalPrice: 1499,
      discount: 13,
      image: "/macbook-air-deal.jpg",
    },
    {
      id: 3,
      title: "iPad Pro 12.9-inch",
      currentPrice: 999,
      originalPrice: 1199,
      discount: 17,
      image: "/ipad-pro-deal.jpg",
    },
    {
      id: 4,
      title: "Apple Studio Display",
      currentPrice: 1499,
      originalPrice: 1699,
      discount: 12,
      image: "/studio-display-deal.jpg",
    },
  ]

  const bestStore = deal.stores.reduce((best, store) => (store.price < best.price ? store : best), deal.stores[0])

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
                  {/* Product Images */}
                  <div>
                    <div className="relative mb-4">
                      <img
                        src={deal.image || "/placeholder.svg?height=400&width=400&query=macbook pro"}
                        alt={deal.title}
                        className="w-full h-80 object-cover rounded-lg"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-accent text-accent-foreground">-{deal.discount}%</Badge>
                      </div>
                      {deal.featured && (
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary">Featured Deal</Badge>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {deal.images.map((image, index) => (
                        <img
                          key={index}
                          src={image || `/placeholder.svg?height=80&width=80&query=macbook ${index}`}
                          alt={`${deal.title} ${index + 1}`}
                          className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-2xl font-bold">{deal.title}</h1>
                        <p className="text-lg text-muted-foreground">{deal.brand}</p>
                        <div className="flex items-center mt-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="font-medium">{deal.rating}</span>
                            <span className="text-muted-foreground ml-1">({deal.reviews} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
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
                          <span className="font-medium">You save {formatEuro(deal.savings)}</span>
                        </div>
                      </div>

                      <Badge variant="outline" className="w-fit">
                        {deal.category}
                      </Badge>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Best Price Found
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img
                              src={bestStore.logo || "/placeholder.svg?height=24&width=24&query=store logo"}
                              alt={bestStore.name}
                              className="w-6 h-6 rounded"
                            />
                            <span className="font-medium">{bestStore.name}</span>
                            {bestStore.verified && <CheckCircle className="h-4 w-4 text-green-600" />}
                          </div>
                          <Button asChild>
                            <Link href={bestStore.url} target="_blank">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Go to Store
                            </Link>
                          </Button>
                        </div>
                      </div>
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

                  <Separator />

                  {/* Specifications */}
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Specifications</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(deal.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b">
                          <span className="font-medium">{key}</span>
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Comparison Table */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Price Comparison</CardTitle>
                <CardDescription>Compare prices from {deal.stores.length} different stores</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Shipping</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deal.stores.map((store, index) => (
                      <TableRow key={index} className={index === 0 ? "bg-muted/50" : ""}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <img
                              src={store.logo || "/placeholder.svg?height=24&width=24&query=store logo"}
                              alt={store.name}
                              className="w-6 h-6 rounded"
                            />
                            <span className="font-medium">{store.name}</span>
                            {store.verified && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {index === 0 && <Badge variant="secondary">Best Price</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-bold text-accent">{formatEuro(store.price)}</span>
                            {store.originalPrice > store.price && (
                              <div className="text-sm text-muted-foreground line-through">{formatEuro(store.originalPrice)}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Truck className="h-4 w-4 mr-1 text-muted-foreground" />
                            {formatEuroText(store.shipping as string)}
                          </div>
                        </TableCell>
                        <TableCell>{store.shippingTime}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {store.inStock ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                <span className="text-green-600">In Stock</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1 text-red-600" />
                                <span className="text-red-600">Out of Stock</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            {store.rating}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={store.inStock ? "default" : "outline"}
                            size="sm"
                            disabled={!store.inStock}
                            asChild={store.inStock}
                          >
                            {store.inStock ? (
                              <Link href={store.url} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Go to Store
                              </Link>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Unavailable
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" size="lg" asChild>
                  <Link href={bestStore.url} target="_blank">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Buy Now - {formatEuro(bestStore.price)}
                  </Link>
                </Button>
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

            {/* Deal Alert */}
            <Card>
              <CardHeader>
                <CardTitle>Price Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get notified when the price drops below your target.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Target Price (€)</label>
                    <input type="number" placeholder="2000" className="w-full mt-1 px-3 py-2 border rounded-md" />
                  </div>
                  <Button className="w-full">Set Price Alert</Button>
                </div>
              </CardContent>
            </Card>

            {/* Related Deals */}
            <Card>
              <CardHeader>
                <CardTitle>Related Deals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedDeals.map((relatedDeal) => (
                  <div key={relatedDeal.id} className="border rounded-lg p-3">
                    <div className="flex space-x-3">
                      <img
                        src={relatedDeal.image || "/placeholder.svg?height=60&width=60&query=product"}
                        alt={relatedDeal.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <Link href={`/deals/${relatedDeal.id}`}>
                          <h4 className="font-medium text-sm hover:text-accent transition-colors line-clamp-2">
                            {relatedDeal.title}
                          </h4>
                        </Link>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-accent">{formatEuro(relatedDeal.currentPrice)}</span>
                          <Badge variant="outline" className="text-xs">
                            -{relatedDeal.discount}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/deals">View All Deals</Link>
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
