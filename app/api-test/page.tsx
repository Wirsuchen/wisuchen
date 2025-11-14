'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, ArrowLeft, PlayCircle, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

interface TestResult {
  endpoint: string
  method: string
  status: 'pending' | 'success' | 'error'
  statusCode?: number
  data?: any
  error?: string
  timestamp: string
}

export default function ApiTestPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [results, setResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  const addResult = (result: Omit<TestResult, 'timestamp'>) => {
    setResults(prev => [{
      ...result,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev])
  }

  const clearResults = () => {
    setResults([])
  }

  const testEndpoint = async (
    name: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any
  ) => {
    setCurrentTest(name)
    setTesting(true)

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(endpoint, options)
      const data = await response.json()

      addResult({
        endpoint: name,
        method,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : JSON.stringify(data, null, 2)
      })
    } catch (error: any) {
      addResult({
        endpoint: name,
        method,
        status: 'error',
        error: error.message
      })
    } finally {
      setTesting(false)
      setCurrentTest(null)
    }
  }

  // Test functions for each endpoint category
  const testCategories = async () => {
    await testEndpoint('Get All Categories', '/api/categories', 'GET')
    await testEndpoint('Get Job Categories', '/api/categories?type=job', 'GET')
    await testEndpoint('Get Affiliate Categories', '/api/categories?type=affiliate', 'GET')
    await testEndpoint('Search Categories', '/api/categories?search=tech&limit=5', 'GET')
  }

  const testJobs = async () => {
    await testEndpoint('Get All Jobs', '/api/jobs', 'GET')
    await testEndpoint('Get Jobs (Paginated)', '/api/jobs?page=1&limit=10', 'GET')
    await testEndpoint('Search Jobs', '/api/jobs?search=developer', 'GET')
    await testEndpoint('Filter Jobs by Location', '/api/jobs?location=Berlin', 'GET')
    await testEndpoint('Filter Jobs by Type', '/api/jobs?employment_type=full-time', 'GET')
  }

  const testCreateJob = async () => {
    const dummyJob = {
      title: 'Test Senior Developer Position',
      company: 'Test Tech Company',
      description: 'This is a test job posting created via API testing interface. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      location: 'Berlin, Germany',
      employment_type: 'full-time',
      salary_min: 60000,
      salary_max: 90000,
      offer_type: 'job',
      status: 'pending'
    }
    await testEndpoint('Create Job (POST)', '/api/jobs', 'POST', dummyJob)
  }

  const testImportJobs = async () => {
    await testEndpoint('Get Import Status', '/api/import/jobs', 'GET')
  }

  const testImportAffiliates = async () => {
    // Test with action=programs parameter to list affiliate programs
    await testEndpoint('Get Affiliate Programs', '/api/import/affiliates?action=programs', 'GET')
    // Test without action to get import runs (may return empty array)
    await testEndpoint('Get Affiliate Import Runs', '/api/import/affiliates', 'GET')
  }

  const testPayment = async () => {
    // Payment status requires order_id or invoice_id - test without params to show expected error
    // In a real scenario, you would provide: /api/payment/paypal?order_id=xxx or ?invoice_id=xxx
    await testEndpoint('Get Payment Status (no params - expected 400)', '/api/payment/paypal', 'GET')
  }

  const testCreatePayment = async () => {
    const dummyPayment = {
      amount: 29.99,
      currency: 'EUR',
      description: 'Test Premium Plan Payment',
      item_type: 'pricing_plan',
      item_id: 'test-plan-id'
    }
    await testEndpoint('Create PayPal Order', '/api/payment/paypal', 'POST', dummyPayment)
  }

  const testHealth = async () => {
    await testEndpoint('Health Check', '/api/health', 'GET')
  }

  const testAllEndpoints = async () => {
    await testHealth()
    await testCategories()
    await testJobs()
    await testImportJobs()
    await testImportAffiliates()
    await testPayment()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard" className="inline-flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Testing Playground</h1>
            <p className="text-muted-foreground mt-2">
              Test all API endpoints with dummy data and see live results
            </p>
          </div>
          <Badge variant="outline" className="h-8">
            {user.name}
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Run common test suites</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={testHealth}
            disabled={testing}
            variant="outline"
          >
            {currentTest === 'Health Check' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            Test Health
          </Button>
          <Button
            onClick={testAllEndpoints}
            disabled={testing}
          >
            {testing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            Run All Tests
          </Button>
          <Button
            onClick={clearResults}
            variant="destructive"
            disabled={results.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Results
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Testing Endpoints */}
        <div>
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>

            {/* Categories Tests */}
            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Categories API</CardTitle>
                  <CardDescription>Test category endpoints</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={testCategories}
                    disabled={testing}
                    className="w-full"
                    variant="outline"
                  >
                    {testing && currentTest?.includes('Categories') ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="mr-2 h-4 w-4" />
                    )}
                    Test All Category Endpoints
                  </Button>

                  <div className="space-y-2 pt-2 border-t">
                    <Button
                      onClick={() => testEndpoint('Get All Categories', '/api/categories', 'GET')}
                      disabled={testing}
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      GET /api/categories
                    </Button>
                    <Button
                      onClick={() => testEndpoint('Get Job Categories', '/api/categories?type=job', 'GET')}
                      disabled={testing}
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      GET /api/categories?type=job
                    </Button>
                    <Button
                      onClick={() => testEndpoint('Get Affiliate Categories', '/api/categories?type=affiliate', 'GET')}
                      disabled={testing}
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      GET /api/categories?type=affiliate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Jobs Tests */}
            <TabsContent value="jobs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Jobs API</CardTitle>
                  <CardDescription>Test job CRUD operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={testJobs}
                    disabled={testing}
                    className="w-full"
                    variant="outline"
                  >
                    {testing && currentTest?.includes('Jobs') ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="mr-2 h-4 w-4" />
                    )}
                    Test All Job GET Endpoints
                  </Button>

                  <div className="space-y-2 pt-2 border-t">
                    <Button
                      onClick={() => testEndpoint('Get All Jobs', '/api/jobs', 'GET')}
                      disabled={testing}
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      GET /api/jobs
                    </Button>
                    <Button
                      onClick={() => testEndpoint('Search Jobs', '/api/jobs?search=developer', 'GET')}
                      disabled={testing}
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      GET /api/jobs?search=developer
                    </Button>
                    <Button
                      onClick={testCreateJob}
                      disabled={testing}
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      POST /api/jobs (Create Job)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other Tests */}
            <TabsContent value="other" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Import APIs</CardTitle>
                  <CardDescription>Test import endpoints</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={testImportJobs}
                    disabled={testing}
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    GET /api/import/jobs
                  </Button>
                  <Button
                    onClick={testImportAffiliates}
                    disabled={testing}
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    GET /api/import/affiliates
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment API</CardTitle>
                  <CardDescription>Test payment endpoints</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={testPayment}
                    disabled={testing}
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    GET /api/payment/paypal
                  </Button>
                  <Button
                    onClick={testCreatePayment}
                    disabled={testing}
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    POST /api/payment/paypal
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System</CardTitle>
                  <CardDescription>System endpoints</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={testHealth}
                    disabled={testing}
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    GET /api/health
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Results Panel */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Test Results</CardTitle>
                  <CardDescription>
                    {results.length} test{results.length !== 1 ? 's' : ''} executed
                  </CardDescription>
                </div>
                {results.length > 0 && (
                  <Badge variant="outline">
                    {results.filter(r => r.status === 'success').length} passed
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto space-y-3">
              {results.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No tests run yet. Click any test button to get started!
                  </AlertDescription>
                </Alert>
              ) : (
                results.map((result, index) => (
                  <Card key={index} className={`
                    ${result.status === 'success' ? 'border-green-500/50' : ''}
                    ${result.status === 'error' ? 'border-red-500/50' : ''}
                  `}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {result.status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <CardTitle className="text-sm">{result.endpoint}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {result.method}
                            </Badge>
                            {result.statusCode && (
                              <Badge 
                                variant={result.status === 'success' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {result.statusCode}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {result.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {result.error ? (
                        <pre className="text-xs bg-red-50 dark:bg-red-950 p-2 rounded overflow-x-auto text-red-600 dark:text-red-400">
                          {result.error}
                        </pre>
                      ) : result.data ? (
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      ) : null}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
