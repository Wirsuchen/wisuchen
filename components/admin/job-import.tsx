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
import { useTranslation } from '@/contexts/i18n-context'

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
  const { t } = useTranslation()
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
    { value: 'adzuna', label: t('admin.jobImport.sources.adzuna'), description: t('admin.jobImport.sources.adzunaDescription') },
    { value: 'rapidapi-employment-agency', label: t('admin.jobImport.sources.employmentAgency'), description: t('admin.jobImport.sources.viaRapidAPI') },
    { value: 'rapidapi-glassdoor', label: t('admin.jobImport.sources.glassdoor'), description: t('admin.jobImport.sources.glassdoorDescription') },
    { value: 'rapidapi-upwork', label: t('admin.jobImport.sources.upwork'), description: t('admin.jobImport.sources.freelanceProjects') },
    { value: 'rapidapi-active-jobs', label: t('admin.jobImport.sources.activeJobsDB'), description: t('admin.jobImport.sources.aggregatedDatabase') },
    { value: 'rapidapi-aggregate', label: t('admin.jobImport.sources.multiSource'), description: t('admin.jobImport.sources.multiSourceDescription') }
  ]

  const handleImport = async () => {
    if (!importForm.source) {
      toast({
        title: t('admin.jobImport.errors.error'),
        description: t('admin.jobImport.errors.selectSource'),
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
            // Map UI 'any' selection to undefined so backend treats it as not filtered
            employment_type:
              importForm.params.employment_type && importForm.params.employment_type !== 'any'
                ? importForm.params.employment_type
                : undefined,
            salary_min: importForm.params.salary_min ? parseInt(importForm.params.salary_min) : undefined,
            salary_max: importForm.params.salary_max ? parseInt(importForm.params.salary_max) : undefined
          },
          limit: importForm.params.limit
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: t('admin.jobImport.importStarted'),
          description: t('admin.jobImport.importingFrom', { source: importForm.source })
        })

        // Start polling for status
        pollImportStatus(data.import_run_id)
      } else {
        throw new Error(data.error || t('admin.jobImport.errors.importFailed'))
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: t('admin.jobImport.errors.importFailed'),
        description: error instanceof Error ? error.message : t('admin.jobImport.errors.unknownError'),
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
              title: t('admin.jobImport.importCompleted'),
              description: t('admin.jobImport.importResults', { 
                created: data.import_run.created_records, 
                updated: data.import_run.updated_records, 
                failed: data.import_run.failed_records 
              })
            })
            fetchImportRuns()
          } else if (data.import_run.status === 'failed') {
            clearInterval(pollInterval)
            toast({
              title: t('admin.jobImport.errors.importFailed'),
              description: data.import_run.error_log || t('admin.jobImport.errors.unknownError'),
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
          <h2 className="text-2xl font-bold">{t('admin.jobImport.title')}</h2>
          <p className="text-muted-foreground">{t('admin.jobImport.description')}</p>
        </div>
        <Button onClick={fetchImportRuns} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('admin.jobImport.refresh')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import">{t('admin.jobImport.importJobs')}</TabsTrigger>
          <TabsTrigger value="history">{t('admin.jobImport.importHistory')}</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                {t('admin.jobImport.configuration.title')}
              </CardTitle>
              <CardDescription>
                {t('admin.jobImport.configuration.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">{t('admin.jobImport.form.jobSource')}</Label>
                  <Select
                    value={importForm.source}
                    onValueChange={(value) => setImportForm(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.jobImport.form.selectJobSource')} />
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
                  <Label htmlFor="limit">{t('admin.jobImport.form.importLimit')}</Label>
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
                  <Label htmlFor="query">{t('admin.jobImport.form.searchQuery')}</Label>
                  <Input
                    id="query"
                    placeholder={t('admin.jobImport.form.searchQueryPlaceholder')}
                    value={importForm.params.query}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, query: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">{t('admin.jobImport.form.location')}</Label>
                  <Input
                    id="location"
                    placeholder={t('admin.jobImport.form.locationPlaceholder')}
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
                  <Label htmlFor="employment_type">{t('admin.jobImport.form.employmentType')}</Label>
                  <Select
                    value={importForm.params.employment_type}
                    onValueChange={(value) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, employment_type: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.jobImport.form.anyType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t('admin.jobImport.form.anyType')}</SelectItem>
                      <SelectItem value="full_time">{t('admin.jobImport.form.fullTime')}</SelectItem>
                      <SelectItem value="part_time">{t('admin.jobImport.form.partTime')}</SelectItem>
                      <SelectItem value="contract">{t('admin.jobImport.form.contract')}</SelectItem>
                      <SelectItem value="freelance">{t('admin.jobImport.form.freelance')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary_min">{t('admin.jobImport.form.minSalary')}</Label>
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
                  <Label htmlFor="salary_max">{t('admin.jobImport.form.maxSalary')}</Label>
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
                    {t('admin.jobImport.importing')}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {t('admin.jobImport.startImport')}
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
                  {t('admin.jobImport.currentImport.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>{t('admin.jobImport.currentImport.source')}: {currentImport.source?.name}</span>
                    <Badge className={getStatusColor(currentImport.status)}>
                      {currentImport.status}
                    </Badge>
                  </div>

                  {currentImport.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('admin.jobImport.currentImport.progress')}</span>
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
                        <div className="text-sm text-muted-foreground">{t('admin.jobImport.currentImport.created')}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{currentImport.updated_records}</div>
                        <div className="text-sm text-muted-foreground">{t('admin.jobImport.currentImport.updated')}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{currentImport.failed_records}</div>
                        <div className="text-sm text-muted-foreground">{t('admin.jobImport.currentImport.failed')}</div>
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
                {t('admin.jobImport.history.title')}
              </CardTitle>
              <CardDescription>
                {t('admin.jobImport.history.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('admin.jobImport.history.noRuns')}
                </div>
              ) : (
                <div className="space-y-4">
                  {importRuns.map((run) => (
                    <div key={run.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          <span className="font-medium">{run.source?.name || t('admin.jobImport.history.unknownSource')}</span>
                          <Badge variant="outline">{run.source?.type}</Badge>
                        </div>
                        <Badge className={getStatusColor(run.status)}>
                          {run.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">{t('admin.jobImport.history.total')}</div>
                          <div className="font-medium">{run.total_records}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">{t('admin.jobImport.history.created')}</div>
                          <div className="font-medium text-green-600">{run.created_records}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">{t('admin.jobImport.history.updated')}</div>
                          <div className="font-medium text-blue-600">{run.updated_records}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">{t('admin.jobImport.history.failed')}</div>
                          <div className="font-medium text-red-600">{run.failed_records}</div>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        {t('admin.jobImport.history.started')}: {new Date(run.started_at).toLocaleString()}
                        {run.completed_at && (
                          <> • {t('admin.jobImport.history.completed')}: {new Date(run.completed_at).toLocaleString()}</>
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
