'use client'

import { PageLayout } from "@/components/layout/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Copy, CheckCircle, ExternalLink, BookOpen, Zap, Shield, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useTranslation } from "@/contexts/i18n-context"

const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://wirsuchen-six.vercel.app'

export default function ApiDocsPage() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">{t('apiDocs.title', 'API Documentation')}</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {t(
              'apiDocs.description',
              'Complete API reference for WIRsuchen platform. All endpoints are RESTful and return JSON responses.'
            )}
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
         
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Most endpoints require authentication via Supabase session cookies</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Rate Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">100 requests per minute per IP address</p>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints */}
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1">
            <TabsTrigger value="jobs">{t('apiDocs.tabs.jobs', 'Jobs')}</TabsTrigger>
            <TabsTrigger value="deals">{t('apiDocs.tabs.deals', 'Deals')}</TabsTrigger>
            <TabsTrigger value="user">{t('apiDocs.tabs.user', 'User')}</TabsTrigger>
            <TabsTrigger value="admin">{t('apiDocs.tabs.admin', 'Admin')}</TabsTrigger>
            <TabsTrigger value="payment">{t('apiDocs.tabs.payment', 'Payment')}</TabsTrigger>
          </TabsList>

          {/* Jobs API */}
          <TabsContent value="jobs" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.jobs.searchV1Title', 'Search Jobs (V1)')}</CardTitle>
                    <CardDescription>
                      {t('apiDocs.jobs.searchV1Description', 'Aggregated job search from multiple sources')}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">GET</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all sm:break-normal">/api/v1/jobs/search</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit"
                    onClick={() => copyToClipboard(`${baseUrl}/api/v1/jobs/search`, 'jobs-search')}
                  >
                    {copied === 'jobs-search' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.queryParams', 'Query Parameters:')}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><code>query</code> (string, optional) - Search keywords</li>
                    <li><code>location</code> (string, optional) - Job location</li>
                    <li><code>employmentType</code> (string, optional) - full_time, part_time, contract, freelance, internship, temporary</li>
                    <li><code>experienceLevel</code> (string, optional) - junior, mid, senior, lead, executive</li>
                    <li><code>salaryMin</code> (number, optional) - Minimum salary</li>
                    <li><code>salaryMax</code> (number, optional) - Maximum salary</li>
                    <li><code>page</code> (number, default: 1) - Page number</li>
                    <li><code>limit</code> (number, default: 100, max: 500) - Results per page</li>
                    <li><code>countries</code> (string, optional) - Comma-separated country codes (de,at,ch)</li>
                    <li><code>useCache</code> (boolean, default: true) - Use cached results</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.exampleRequest', 'Example Request:')}
                  </h4>
                  <div className="bg-muted p-4 rounded-lg relative">
                    <code className="text-xs sm:text-sm break-all block overflow-x-auto">
                      {baseUrl}/api/v1/jobs/search?query=developer&location=Berlin&limit=20&countries=de,at,ch
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`${baseUrl}/api/v1/jobs/search?query=developer&location=Berlin&limit=20&countries=de,at,ch`, 'jobs-example')}
                    >
                      {copied === 'jobs-example' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.response', 'Response:')}
                  </h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
{`{
  "success": true,
  "data": {
    "jobs": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1500,
      "totalPages": 75
    },
    "meta": {
      "sources": {
        "adzuna": 500,
        "rapidapi": 1000
      },
      "cached": false,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.jobs.legacyTitle', 'Get Jobs (Legacy)')}</CardTitle>
                    <CardDescription>
                      {t('apiDocs.jobs.legacyDescription', 'Database-first job search')}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">GET</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/jobs</code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.queryParams', 'Query Parameters:')}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><code>page</code> (number, default: 1)</li>
                    <li><code>limit</code> (number, default: 20)</li>
                    <li><code>category</code> (string, optional)</li>
                    <li><code>location</code> (string, optional)</li>
                    <li><code>type</code> (string, optional) - Employment type</li>
                    <li><code>remote</code> (boolean, optional)</li>
                    <li><code>search</code> (string, optional) - Search query</li>
                    <li><code>featured</code> (boolean, optional)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.jobs.createJobTitle', 'Create Job')}</CardTitle>
                    <CardDescription>
                      {t(
                        'apiDocs.jobs.createJobDescription',
                        'Create a new job posting (Auth required)'
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">POST</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/jobs</code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.requestBody', 'Request Body:')}
                  </h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
{`{
  "title": "Software Developer",
  "description": "Job description...",
  "category_id": "uuid",
  "company_id": "uuid",
  "location": "Berlin, Germany",
  "employment_type": "full_time",
  "salary_min": 50000,
  "salary_max": 70000
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.jobs.categoriesTitle', 'Get Categories')}</CardTitle>
                    <CardDescription>
                      {t(
                        'apiDocs.jobs.categoriesDescription',
                        'Get job/affiliate/blog categories'
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">GET</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/categories</code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.queryParams', 'Query Parameters:')}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><code>type</code> (string, optional) - job, affiliate, blog</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals API */}
          <TabsContent value="deals" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.deals.getDealsTitle', 'Get Deals')}</CardTitle>
                    <CardDescription>
                      {t('apiDocs.deals.getDealsDescription', 'Get affiliate deals and offers')}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">GET</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/deals</code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.queryParams', 'Query Parameters:')}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><code>page</code> (number, default: 1)</li>
                    <li><code>limit</code> (number, default: 20)</li>
                    <li><code>category</code> (string, optional)</li>
                    <li><code>minPrice</code> (number, optional)</li>
                    <li><code>maxPrice</code> (number, optional)</li>
                    <li><code>onSale</code> (boolean, optional)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.deals.searchOffersTitle', 'Search Offers (V1)')}</CardTitle>
                    <CardDescription>
                      {t(
                        'apiDocs.deals.searchOffersDescription',
                        'Search affiliate offers from multiple sources'
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">GET</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/v1/offers/search</code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.queryParams', 'Query Parameters:')}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><code>query</code> (string, optional) - Search keywords</li>
                    <li><code>category</code> (string, optional)</li>
                    <li><code>minPrice</code> (number, optional)</li>
                    <li><code>maxPrice</code> (number, optional)</li>
                    <li><code>onSale</code> (boolean, optional)</li>
                    <li><code>page</code> (number, default: 1)</li>
                    <li><code>limit</code> (number, default: 20)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User API */}
          <TabsContent value="user" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.user.currentUserTitle', 'Get Current User')}</CardTitle>
                    <CardDescription>
                      {t(
                        'apiDocs.user.currentUserDescription',
                        'Get authenticated user profile (Auth required)'
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">GET</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/me</code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.user.savedJobsTitle', "Get Saved Jobs")}</CardTitle>
                    <CardDescription>
                      {t(
                        'apiDocs.user.savedJobsDescription',
                        "Get user's saved jobs (Auth required)"
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">GET</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/saved/jobs</code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.user.saveJobTitle', 'Save Job')}</CardTitle>
                    <CardDescription>
                      {t(
                        'apiDocs.user.saveJobDescription',
                        "Save a job to user's favorites (Auth required)"
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">POST</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/saved/jobs</code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.requestBody', 'Request Body:')}
                  </h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
{`{
  "id": "job-id",
  "title": "Job Title",
  "company": "Company Name",
  "location": "Berlin"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.user.savedDealsTitle', 'Get Saved Deals')}</CardTitle>
                    <CardDescription>
                      {t(
                        'apiDocs.user.savedDealsDescription',
                        "Get user's saved deals (Auth required)"
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">GET</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/saved/deals</code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.user.submitApplicationTitle', 'Submit Application')}</CardTitle>
                    <CardDescription>
                      {t(
                        'apiDocs.user.submitApplicationDescription',
                        'Submit job application (Auth required)'
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">POST</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/applications</code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Request Body:</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
{`{
  "offer_id": "job-uuid",
  "notes": "Application notes"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin API */}
          <TabsContent value="admin" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.admin.importJobsTitle', 'Import Jobs')}</CardTitle>
                    <CardDescription>
                      {t(
                        'apiDocs.admin.importJobsDescription',
                        'Import jobs from external APIs (Admin only)'
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">POST</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/import/jobs</code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.requestBody', 'Request Body:')}
                  </h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
{`{
  "source": "adzuna",
  "params": {
    "what": "developer",
    "where": "Berlin"
  },
  "limit": 50
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.availableSources', 'Available Sources:')}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>adzuna</li>
                    <li>rapidapi-employment-agency</li>
                    <li>rapidapi-glassdoor</li>
                    <li>rapidapi-aggregate</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.admin.importAffiliatesTitle', 'Import Affiliates')}</CardTitle>
                    <CardDescription>
                      {t(
                        'apiDocs.admin.importAffiliatesDescription',
                        'Import affiliate deals (Admin only)'
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">POST</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/import/affiliates</code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.requestBody', 'Request Body:')}
                  </h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
{`{
  "source": "awin",
  "params": {
    "keywords": "technology"
  },
  "limit": 50
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.availableSources', 'Available Sources:')}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>awin</li>
                    <li>adcell</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.admin.adminStatsTitle', 'Get Admin Stats')}</CardTitle>
                    <CardDescription>
                      {t(
                        'apiDocs.admin.adminStatsDescription',
                        'Get platform statistics (Admin only)'
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">GET</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/admin/stats</code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment API */}
          <TabsContent value="payment" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.payment.createOrderTitle', 'Create PayPal Order')}</CardTitle>
                    <CardDescription>
                      {t(
                        'apiDocs.payment.createOrderDescription',
                        'Create a PayPal payment order (Auth required)'
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">POST</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/payment/paypal</code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    {t('apiDocs.sections.requestBody', 'Request Body:')}
                  </h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
{`{
  "amount": "29.99",
  "currency": "EUR",
  "description": "Premium Job Posting",
  "items": [
    {
      "name": "Premium Job Posting",
      "quantity": 1,
      "unit_amount": "29.99"
    }
  ]
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>{t('apiDocs.payment.paymentStatusTitle', 'Get Payment Status')}</CardTitle>
                    <CardDescription>
                      {t('apiDocs.payment.paymentStatusDescription', 'Get PayPal order status')}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit">GET</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">/api/payment/paypal?order_id=ORDER_ID</code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Additional Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t('apiDocs.sections.responseFormatTitle', 'Response Format')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t(
                'apiDocs.sections.responseFormatDescription',
                'All API responses follow a consistent format:'
              )}
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
{`{
  "success": true | false,
  "data": { ... },
  "error": "Error message (if success is false)"
}`}
            </pre>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{t('apiDocs.sections.errorCodesTitle', 'Error Codes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>
                <code className="bg-muted px-2 py-1 rounded">400</code> -
                {` ${t('apiDocs.errors.400', 'Bad Request (invalid parameters)')}`}
              </li>
              <li>
                <code className="bg-muted px-2 py-1 rounded">401</code> -
                {` ${t('apiDocs.errors.401', 'Unauthorized (authentication required)')}`}
              </li>
              <li>
                <code className="bg-muted px-2 py-1 rounded">403</code> -
                {` ${t('apiDocs.errors.403', 'Forbidden (insufficient permissions)')}`}
              </li>
              <li>
                <code className="bg-muted px-2 py-1 rounded">404</code> -
                {` ${t('apiDocs.errors.404', 'Not Found')}`}
              </li>
              <li>
                <code className="bg-muted px-2 py-1 rounded">429</code> -
                {` ${t(
                  'apiDocs.errors.429',
                  'Too Many Requests (rate limit exceeded)'
                )}`}
              </li>
              <li>
                <code className="bg-muted px-2 py-1 rounded">500</code> -
                {` ${t('apiDocs.errors.500', 'Internal Server Error')}`}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

