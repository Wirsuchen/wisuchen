import { Heart, Trash2, ExternalLink, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLayout } from "@/components/layout/page-layout"
import Link from "next/link"

export default function SavedPage() {
  const savedJobs = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      company: "TechCorp Inc.",
      location: "San Francisco, CA",
      salary: "$120,000 - $150,000",
      type: "Full-time",
      savedDate: "2024-01-15",
      logo: "/abstract-tech-logo.png",
    },
    {
      id: 2,
      title: "Product Manager",
      company: "StartupXYZ",
      location: "Remote",
      salary: "$100,000 - $130,000",
      type: "Full-time",
      savedDate: "2024-01-14",
      logo: "/abstract-startup-logo.png",
    },
  ]

  const savedDeals = [
    {
      id: 1,
      title: "MacBook Pro 14-inch M3",
      originalPrice: 1999,
      currentPrice: 1699,
      discount: 15,
      store: "Apple Store",
      savedDate: "2024-01-16",
      image: "/macbook-pro-deal.png",
    },
    {
      id: 2,
      title: "Sony WH-1000XM5 Headphones",
      originalPrice: 399,
      currentPrice: 299,
      discount: 25,
      store: "Best Buy",
      savedDate: "2024-01-15",
      image: "/sony-headphones-deal.png",
    },
  ]

  return (
    <PageLayout containerClassName="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved Items</h1>
        <p className="text-muted-foreground">Keep track of your favorite jobs and deals in one place.</p>
      </div>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="jobs">Saved Jobs ({savedJobs.length})</TabsTrigger>
          <TabsTrigger value="deals">Saved Deals ({savedDeals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6">
          <div className="grid gap-6">
            {savedJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={job.logo || "/placeholder.svg"}
                        alt={job.company}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="text-base">{job.company}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Heart className="h-4 w-4 fill-current text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{job.location}</span>
                    </div>
                    <Badge variant="secondary">{job.type}</Badge>
                    <div className="text-sm font-medium text-primary">{job.salary}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      Saved on {new Date(job.savedDate).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Job
                        </Button>
                      </Link>
                      <Button size="sm">Apply Now</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {savedJobs.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No saved jobs yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start saving jobs you're interested in to keep track of them here.
                  </p>
                  <Link href="/jobs">
                    <Button>Browse Jobs</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deals" className="mt-6">
          <div className="grid gap-6">
            {savedDeals.map((deal) => (
              <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={deal.image || "/placeholder.svg"}
                        alt={deal.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <CardTitle className="text-xl">{deal.title}</CardTitle>
                        <CardDescription className="text-base">{deal.store}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Heart className="h-4 w-4 fill-current text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-primary">${deal.currentPrice}</div>
                      <div className="text-sm text-muted-foreground line-through">${deal.originalPrice}</div>
                      <Badge variant="destructive">{deal.discount}% OFF</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      Saved on {new Date(deal.savedDate).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/deals/${deal.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Deal
                        </Button>
                      </Link>
                      <Button size="sm">Go to Store</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {savedDeals.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No saved deals yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start saving deals you're interested in to keep track of them here.
                  </p>
                  <Link href="/deals">
                    <Button>Browse Deals</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
