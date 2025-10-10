'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Package
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface AffiliateProgram {
  id: string
  name: string
  provider: string
  commission_rate?: number
  is_active: boolean
  last_sync_at?: string
}

interface ImportRun {
  id: string
  status: 'running' | 'completed' | 'failed'
  total_records: number
  processed_records: number
  created_records: number
  updated_records: number
  failed_records: number
  started_at: string
  completed_at?: string
  error_log?: string
  affiliate_program?: {
    name: string
    provider: string
  }
}

export function AffiliateImportManager() {
  const [activeTab, setActiveTab] = useState('import')
  const [isImporting, setIsImporting] = useState(false)
  const [programs, setPrograms] = useState<AffiliateProgram[]>([])
  const [importRuns, setImportRuns] = useState<ImportRun[]>([])
  const [currentImport, setCurrentImport] = useState<ImportRun | null>(null)
  const { toast } = useToast()

  // Import form state
  const [importForm, setImportForm] = useState({
    source: '',
    params: {
      keywords: '',
      category: '',
      min_commission: '',
      max_commission: '',
      advertiser_ids: [] as string[],
      program_ids: [] as string[],
      has_coupon: false,
      on_sale: false,
      limit: 50
    }
  })

  const affiliateSources = [
    { 
      value: 'awin', 
      label: 'Awin Network', 
      description: 'Global affiliate network with 15,000+ advertisers',
      features: ['High-quality brands', 'Real-time tracking', 'Global reach']
    },
    { 
      value: 'adcell', 
      label: 'Adcell Network', 
      description: 'German affiliate network with local focus',
      features: ['German market focus', 'Product feeds', 'Performance tracking']
    }
  ]

  useEffect(() => {
    fetchPrograms()
    fetchImportRuns()
  }, [])

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/import/affiliates?action=programs')
      const data = await response.json()

      if (response.ok) {
        setPrograms(data.programs || [])
      }
    } catch (error) {
      console.error('Fetch programs error:', error)
    }
  }

  const fetchImportRuns = async () => {
    try {
      const response = await fetch('/api/import/affiliates')
      const data = await response.json()

      if (response.ok) {
        setImportRuns(data.import_runs || [])
      }
    } catch (error) {
      console.error('Fetch import runs error:', error)
    }
  }

  const handleImport = async () => {
    if (!importForm.source) {
      toast({
        title: 'Error',
        description: 'Please select an affiliate source',
        variant: 'destructive'
      })
      return
    }

    setIsImporting(true)
    
    try {
      const response = await fetch('/api/import/affiliates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: importForm.source,
          params: {
            ...importForm.params,
            min_commission: importForm.params.min_commission ? parseFloat(importForm.params.min_commission) : undefined,
            max_commission: importForm.params.max_commission ? parseFloat(importForm.params.max_commission) : undefined
          },
          limit: importForm.params.limit
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Import Started',
          description: `Importing affiliate offers from ${importForm.source}...`
        })

        // Start polling for status
        pollImportStatus(data.import_run_id)
      } else {
        throw new Error(data.error || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setIsImporting(false)
    }
  }

  const pollImportStatus = async (importRunId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/import/affiliates?import_run_id=${importRunId}`)
        const data = await response.json()

        if (response.ok) {
          setCurrentImport(data.import_run)

          if (data.import_run.status === 'completed') {
            clearInterval(pollInterval)
            toast({
              title: 'Import Completed',
              description: `Created: ${data.import_run.created_records}, Updated: ${data.import_run.updated_records}, Failed: ${data.import_run.failed_records}`
            })
            fetchImportRuns()
            fetchPrograms()
          } else if (data.import_run.status === 'failed') {
            clearInterval(pollInterval)
            toast({
              title: 'Import Failed',
              description: data.import_run.error_log || 'Unknown error',
              variant: 'destructive'
            })
          }
        }
      } catch (error) {
        console.error('Status polling error:', error)
        clearInterval(pollInterval)
      }
    }, 3000)

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Affiliate Import Manager</h2>
          <p className="text-muted-foreground">Import affiliate offers from partner networks</p>
        </div>
        <Button onClick={() => { fetchPrograms(); fetchImportRuns(); }} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import">Import Offers</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Import Configuration
              </CardTitle>
              <CardDescription>
                Configure and start importing affiliate offers from partner networks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Affiliate Network</Label>
                  <Select
                    value={importForm.source}
                    onValueChange={(value) => setImportForm(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select affiliate network" />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliateSources.map(source => (
                        <SelectItem key={source.value} value={source.value}>
                          <div>
                            <div className="font-medium">{source.label}</div>
                            <div className="text-sm text-muted-foreground">{source.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limit">Import Limit</Label>
                  <Input
                    id="limit"
                    type="number"
                    min="1"
                    max="200"
                    value={importForm.params.limit}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, limit: parseInt(e.target.value) || 50 }
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    placeholder="e.g., technology, fashion, travel"
                    value={importForm.params.keywords}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, keywords: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Electronics, Clothing, Books"
                    value={importForm.params.category}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, category: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_commission">Min Commission (%)</Label>
                  <Input
                    id="min_commission"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="5.0"
                    value={importForm.params.min_commission}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, min_commission: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_commission">Max Commission (%)</Label>
                  <Input
                    id="max_commission"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="50.0"
                    value={importForm.params.max_commission}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, max_commission: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={importForm.params.has_coupon}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, has_coupon: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Has Coupon Code</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={importForm.params.on_sale}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, on_sale: e.target.checked }
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">On Sale Only</span>
                </label>
              </div>

              <Button 
                onClick={handleImport} 
                disabled={isImporting || !importForm.source}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Import
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {currentImport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(currentImport.status)}
                  Current Import Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Network: {currentImport.affiliate_program?.name}</span>
                    <Badge className={getStatusColor(currentImport.status)}>
                      {currentImport.status}
                    </Badge>
                  </div>

                  {currentImport.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{currentImport.processed_records} / {currentImport.total_records || '?'}</span>
                      </div>
                      <Progress 
                        value={currentImport.total_records ? 
                          (currentImport.processed_records / currentImport.total_records) * 100 : 0
                        } 
                      />
                    </div>
                  )}

                  {currentImport.status === 'completed' && (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{currentImport.created_records}</div>
                        <div className="text-sm text-muted-foreground">Created</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{currentImport.updated_records}</div>
                        <div className="text-sm text-muted-foreground">Updated</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{currentImport.failed_records}</div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                    </div>
                  )}

                  {currentImport.error_log && (
                    <Alert variant="destructive">
                      <AlertDescription>{currentImport.error_log}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Affiliate Programs
              </CardTitle>
              <CardDescription>
                Manage your affiliate program connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {programs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No affiliate programs found. Start an import to create program connections.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programs.map((program) => (
                    <Card key={program.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{program.name}</h3>
                          <Badge variant={program.is_active ? 'default' : 'secondary'}>
                            {program.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Provider:</span>
                            <span className="capitalize">{program.provider}</span>
                          </div>
                          
                          {program.commission_rate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Commission:</span>
                              <span>{program.commission_rate}%</span>
                            </div>
                          )}
                          
                          {program.last_sync_at && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Sync:</span>
                              <span>{new Date(program.last_sync_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Import History
              </CardTitle>
              <CardDescription>
                View previous affiliate import runs and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No import runs found. Start your first import above.
                </div>
              ) : (
                <div className="space-y-4">
                  {importRuns.map((run) => (
                    <div key={run.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          <span className="font-medium">{run.affiliate_program?.name || 'Unknown Network'}</span>
                          <Badge variant="outline">{run.affiliate_program?.provider}</Badge>
                        </div>
                        <Badge className={getStatusColor(run.status)}>
                          {run.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total</div>
                          <div className="font-medium">{run.total_records}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Created</div>
                          <div className="font-medium text-green-600">{run.created_records}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Updated</div>
                          <div className="font-medium text-blue-600">{run.updated_records}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Failed</div>
                          <div className="font-medium text-red-600">{run.failed_records}</div>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        Started: {new Date(run.started_at).toLocaleString()}
                        {run.completed_at && (
                          <> • Completed: {new Date(run.completed_at).toLocaleString()}</>
                        )}
                      </div>

                      {run.error_log && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription className="text-xs">{run.error_log}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
