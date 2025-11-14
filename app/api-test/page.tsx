'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
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
  const [results, setResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)
  const [currentTest, setCurrentTest] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>
              You need to be signed in to use the API testing playground.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login?redirect=/api-test">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
    body?: any,
    expectedStatus?: number // Optional: if provided, treat this status as success
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
      
      // Try to parse JSON, but handle non-JSON responses gracefully
      let data: any = {}
      
      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      
      // Read response text once (can only be read once)
      const responseText = await response.text().catch(() => '')
      
      if (isJson) {
        try {
          data = responseText ? JSON.parse(responseText) : {}
        } catch (error: any) {
          // JSON parsing failed
          data = { 
            error: `JSON parse error: ${error.message}`,
            rawResponse: responseText.substring(0, 500)
          }
        }
      } else {
        // Non-JSON response (HTML, text, empty, etc.)
        data = { 
          error: `Non-JSON response (${contentType || 'unknown'})`,
          status: response.status,
          statusText: response.statusText,
          preview: responseText.substring(0, 200),
          isEmpty: !responseText || responseText.trim().length === 0
        }
      }

      // Check if response matches expected status (for validation tests)
      const isSuccess = expectedStatus 
        ? response.status === expectedStatus 
        : response.ok

      addResult({
        endpoint: name,
        method,
        status: isSuccess ? 'success' : 'error',
        statusCode: response.status,
        data: isSuccess ? data : undefined,
        error: isSuccess ? undefined : JSON.stringify(data, null, 2)
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
    try {
      // Step 1: Ensure test data exists in database (category and company)
      const setupResponse = await fetch('/api/test/setup')
      const setupData = await setupResponse.json()
      
      if (!setupResponse.ok || !setupData.test_data) {
        addResult({
          endpoint: 'Test Setup (GET)',
          method: 'GET',
          status: 'error',
          statusCode: setupResponse.status,
          error: JSON.stringify(setupData, null, 2)
        })
        return
      }

      const { category_id, company_id } = setupData.test_data

      // Step 2: Create test job with required data from database
    const dummyJob = {
        title: `[TEST] Senior Developer Position - ${Date.now()}`,
        description: 'This is a TEST job posting created via API testing interface. This job will be automatically deleted after 2 seconds. Lorem ipsum dolor sit amet, consectetur adipiscing elit. We are looking for an experienced developer to join our team.',
      location: 'Berlin, Germany',
        employment_type: 'full_time', // Use enum value format (full_time, not full-time)
      salary_min: 60000,
      salary_max: 90000,
        salary_currency: 'EUR',
        salary_period: 'yearly',
        status: 'pending',
        category_id: category_id,
        company_id: company_id
      }
      
      // Create the job
      const createResponse = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dummyJob)
      })
      
      const createData = await createResponse.json()
      
      // Add result for creation
      addResult({
        endpoint: 'Create Test Job (POST)',
        method: 'POST',
        status: createResponse.ok ? 'success' : 'error',
        statusCode: createResponse.status,
        data: createResponse.ok ? createData : undefined,
        error: createResponse.ok ? undefined : JSON.stringify(createData, null, 2)
      })

      // Step 3: If creation was successful, wait 2 seconds then delete
      if (createResponse.ok && createData.job?.id) {
        const jobId = createData.job.id
        
        // Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Delete the test job
        const deleteResponse = await fetch(`/api/jobs/${jobId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })
        
        const deleteData = await deleteResponse.json()
        
        // Add result for deletion
        addResult({
          endpoint: 'Delete Test Job (DELETE)',
          method: 'DELETE',
          status: deleteResponse.ok ? 'success' : 'error',
          statusCode: deleteResponse.status,
          data: deleteResponse.ok ? deleteData : undefined,
          error: deleteResponse.ok ? undefined : JSON.stringify(deleteData, null, 2)
        })
      }
    } catch (error: any) {
      addResult({
        endpoint: 'Create Test Job (Error)',
        method: 'POST',
        status: 'error',
        error: error.message || 'Unknown error occurred'
      })
    }
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
    // Test 1: Validation - should return 400 when no parameters provided
    await testEndpoint(
      'Get Payment Status (validation - no params)', 
      '/api/payment/paypal', 
      'GET',
      undefined,
      400 // Expected status code for validation error
    )
    
    // Test 2: Create a payment order first, then test status retrieval
    // This tests the full flow
    const createResponse = await fetch('/api/payment/paypal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 29.99,
        currency: 'EUR',
        description: 'Test Payment Status Check'
      })
    })
    
    if (createResponse.ok) {
      const createData = await createResponse.json()
      // Test getting payment status with the created order_id
      await testEndpoint(
        'Get Payment Status (with order_id)', 
        `/api/payment/paypal?order_id=${createData.order_id}`, 
        'GET'
      )
    }
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
    await testEndpoint('API Status', '/api/v1/status', 'GET')
  }

  const testUserProfile = async () => {
    await testEndpoint('Get Current User', '/api/me', 'GET')
    await testEndpoint('Get User Profile', '/api/user/profile', 'GET')
    await testEndpoint('Get User Stats', '/api/user/stats', 'GET')
  }

  const testJobsAdvanced = async () => {
    await testEndpoint('Get Job by ID (invalid)', '/api/jobs/invalid-id-12345', 'GET', undefined, 404)
    await testEndpoint('Search Jobs V1', '/api/v1/jobs/search?query=developer&location=Berlin', 'GET')
    await testEndpoint('Search Jobs V1 (no params)', '/api/v1/jobs/search', 'GET')
  }

  const testDeals = async () => {
    await testEndpoint('Get All Deals', '/api/deals', 'GET')
    await testEndpoint('Get Deals (Paginated)', '/api/deals?page=1&limit=10', 'GET')
    await testEndpoint('Search Deals', '/api/deals?search=laptop', 'GET')
    await testEndpoint('Get Deals Test', '/api/deals/test', 'GET')
  }

  const testSavedItems = async () => {
    await testEndpoint('Get Saved Items', '/api/saved', 'GET')
    // Note: /api/saved/jobs and /api/saved/deals are POST-only (for saving)
    // Use /api/user/saved-deals for GET requests
    await testEndpoint('Get User Saved Deals', '/api/user/saved-deals', 'GET')
    await testEndpoint('Get User Saved Deals (with limit)', '/api/user/saved-deals?limit=5', 'GET')
  }

  const testPaymentAdvanced = async () => {
    // Test validation scenarios
    await testEndpoint(
      'Create Payment (missing amount)', 
      '/api/payment/paypal', 
      'POST',
      { currency: 'EUR', description: 'Test' },
      400
    )
    
    await testEndpoint(
      'Create Payment (missing description)', 
      '/api/payment/paypal', 
      'POST',
      { amount: 29.99, currency: 'EUR' },
      400
    )

    // Test with invoice_id instead of order_id
    const createResponse = await fetch('/api/payment/paypal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 19.99,
        currency: 'EUR',
        description: 'Test Invoice Payment'
      })
    })
    
    if (createResponse.ok) {
      const createData = await createResponse.json()
      // Test getting payment status with invoice_id
      await testEndpoint(
        'Get Payment Status (with invoice_id)', 
        `/api/payment/paypal?invoice_id=${createData.invoice_id}`, 
        'GET'
      )
    }
  }

  const testCategoriesAdvanced = async () => {
    await testEndpoint('Get Categories (with limit)', '/api/categories?limit=5', 'GET')
    await testEndpoint('Get Categories (with search)', '/api/categories?search=tech', 'GET')
    await testEndpoint('Get Categories (invalid type)', '/api/categories?type=invalid', 'GET')
  }

  const testOffers = async () => {
    await testEndpoint('Search Offers V1', '/api/v1/offers/search?query=developer', 'GET')
    await testEndpoint('Search Offers V1 (no params)', '/api/v1/offers/search', 'GET')
  }

  const testApplications = async () => {
    await testEndpoint('Get Applications', '/api/applications', 'GET')
  }

  const testNewsletter = async () => {
    await testEndpoint(
      'Subscribe Newsletter (missing email)', 
      '/api/newsletter/subscribe', 
      'POST',
      {},
      400
    )
    await testEndpoint(
      'Subscribe Newsletter (invalid email)', 
      '/api/newsletter/subscribe', 
      'POST',
      { email: 'invalid-email' },
      400
    )
  }

  const testImportAdvanced = async () => {
    await testEndpoint('Get Import Run by ID (invalid)', '/api/import/affiliates?import_run_id=invalid-id', 'GET', undefined, 404)
    await testEndpoint('Get Import Jobs Status', '/api/import/jobs', 'GET')
  }

  const testAllEndpoints = async () => {
    await testHealth()
    await testCategories()
    await testCategoriesAdvanced()
    await testJobs()
    await testJobsAdvanced()
    await testOffers()
    await testDeals()
    await testImportJobs()
    await testImportAffiliates()
    await testImportAdvanced()
    await testPayment()
    await testPaymentAdvanced()
    await testUserProfile()
    await testSavedItems()
    await testApplications()
    await testNewsletter()
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
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

            {/* Payment Tests */}
            <TabsContent value="payment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment API</CardTitle>
                  <CardDescription>Test PayPal payment endpoints</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={testPayment}
                    disabled={testing}
                    className="w-full"
                    variant="outline"
                  >
                    {testing && currentTest?.includes('Payment') ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="mr-2 h-4 w-4" />
                    )}
                    Test Payment Status & Flow
                  </Button>
                  <Button
                    onClick={testPaymentAdvanced}
                    disabled={testing}
                    className="w-full"
                    variant="outline"
                  >
                    {testing && currentTest?.includes('Payment') ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="mr-2 h-4 w-4" />
                    )}
                    Test Payment Validation
                  </Button>

                  <div className="space-y-2 pt-2 border-t">
                    <Button
                      onClick={testCreatePayment}
                      disabled={testing}
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      POST /api/payment/paypal (Create Order)
                    </Button>
                    <Button
                      onClick={() => testEndpoint(
                        'Get Payment Status (validation)', 
                        '/api/payment/paypal', 
                        'GET',
                        undefined,
                        400
                      )}
                      disabled={testing}
                      variant="ghost"
                      className="w-full justify-start"
                      size="sm"
                    >
                      GET /api/payment/paypal (No Params - 400)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other Tests */}
            <TabsContent value="other" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User & Profile</CardTitle>
                  <CardDescription>Test user endpoints</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={testUserProfile}
                    disabled={testing}
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    Test All User Endpoints
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Deals & Offers</CardTitle>
                  <CardDescription>Test deals and offers endpoints</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={testDeals}
                    disabled={testing}
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    Test All Deals Endpoints
                  </Button>
                  <Button
                    onClick={testOffers}
                    disabled={testing}
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    Test Offers V1 Search
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Saved Items</CardTitle>
                  <CardDescription>Test saved items endpoints</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={testSavedItems}
                    disabled={testing}
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    Test All Saved Items Endpoints
                  </Button>
                </CardContent>
              </Card>

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
                  <Button
                    onClick={testImportAdvanced}
                    disabled={testing}
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    Test Import Advanced
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Applications & Newsletter</CardTitle>
                  <CardDescription>Test applications and newsletter</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={testApplications}
                    disabled={testing}
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    GET /api/applications
                  </Button>
                  <Button
                    onClick={testNewsletter}
                    disabled={testing}
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    Test Newsletter Validation
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
