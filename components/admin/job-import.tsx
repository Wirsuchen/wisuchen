'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Download, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Database,
  Search,
  Filter
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

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
  source?: {
    name: string
    type: string
  }
}

export function JobImportManager() {
  const [activeTab, setActiveTab] = useState('import')
  const [isImporting, setIsImporting] = useState(false)
  const [importRuns, setImportRuns] = useState<ImportRun[]>([])
  const [currentImport, setCurrentImport] = useState<ImportRun | null>(null)
  const { toast } = useToast()

  // Import form state
  const [importForm, setImportForm] = useState({
    source: '',
    params: {
      query: '',
      location: '',
      category: '',
      employment_type: '',
      salary_min: '',
      salary_max: '',
      page: 1,
      limit: 50
    }
  })

  const jobSources = [
    { value: 'adzuna', label: 'Adzuna (German Jobs)', description: 'Official German job board API' },
    { value: 'rapidapi-employment-agency', label: 'Employment Agency API', description: 'Via RapidAPI' },
    { value: 'rapidapi-glassdoor', label: 'Glassdoor API', description: 'Company reviews and jobs' },
    { value: 'rapidapi-upwork', label: 'Upwork API', description: 'Freelance projects' },
    { value: 'rapidapi-active-jobs', label: 'Active Jobs DB', description: 'Aggregated job database' },
    { value: 'rapidapi-aggregate', label: 'Multi-Source Import', description: 'Import from multiple APIs' }
  ]

  const handleImport = async () => {
    if (!importForm.source) {
      toast({
        title: 'Error',
        description: 'Please select a job source',
        variant: 'destructive'
      })
      return
    }

    setIsImporting(true)
    
    try {
      const response = await fetch('/api/import/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: importForm.source,
          params: {
            ...importForm.params,
            salary_min: importForm.params.salary_min ? parseInt(importForm.params.salary_min) : undefined,
            salary_max: importForm.params.salary_max ? parseInt(importForm.params.salary_max) : undefined
          },
          limit: importForm.params.limit
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Import Started',
          description: `Importing jobs from ${importForm.source}...`
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
        const response = await fetch(`/api/import/jobs?import_run_id=${importRunId}`)
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
    }, 2000)

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000)
  }

  const fetchImportRuns = async () => {
    try {
      const response = await fetch('/api/import/jobs')
      const data = await response.json()

      if (response.ok) {
        setImportRuns(data.import_runs || [])
      }
    } catch (error) {
      console.error('Fetch import runs error:', error)
    }
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
          <h2 className="text-2xl font-bold">Job Import Manager</h2>
          <p className="text-muted-foreground">Import jobs from external APIs</p>
        </div>
        <Button onClick={fetchImportRuns} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import">Import Jobs</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Import Configuration
              </CardTitle>
              <CardDescription>
                Configure and start a new job import from external APIs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Job Source</Label>
                  <Select
                    value={importForm.source}
                    onValueChange={(value) => setImportForm(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job source" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobSources.map(source => (
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
                    max="100"
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
                  <Label htmlFor="query">Search Query</Label>
                  <Input
                    id="query"
                    placeholder="e.g., software developer, marketing"
                    value={importForm.params.query}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, query: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Berlin, Munich, Hamburg"
                    value={importForm.params.location}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, location: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select
                    value={importForm.params.employment_type}
                    onValueChange={(value) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, employment_type: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any type</SelectItem>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary_min">Min Salary (€)</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    placeholder="30000"
                    value={importForm.params.salary_min}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, salary_min: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary_max">Max Salary (€)</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    placeholder="80000"
                    value={importForm.params.salary_max}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, salary_max: e.target.value }
                    }))}
                  />
                </div>
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
                    <span>Source: {currentImport.source?.name}</span>
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

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Import History
              </CardTitle>
              <CardDescription>
                View previous job import runs and their results
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
                          <span className="font-medium">{run.source?.name || 'Unknown Source'}</span>
                          <Badge variant="outline">{run.source?.type}</Badge>
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
