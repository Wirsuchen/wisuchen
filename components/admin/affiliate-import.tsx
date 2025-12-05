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
import { useTranslation } from '@/contexts/i18n-context'

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
  const { t } = useTranslation()
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
      label: t('admin.affiliateImport.sources.awin'),
      description: t('admin.affiliateImport.sources.awinDescription'),
      features: [
        t('admin.affiliateImport.features.highQualityBrands'),
        t('admin.affiliateImport.features.realTimeTracking'),
        t('admin.affiliateImport.features.globalReach')
      ]
    },
    {
      value: 'adcell',
      label: t('admin.affiliateImport.sources.adcell'),
      description: t('admin.affiliateImport.sources.adcellDescription'),
      features: [
        t('admin.affiliateImport.features.germanMarketFocus'),
        t('admin.affiliateImport.features.productFeeds'),
        t('admin.affiliateImport.features.performanceTracking')
      ]
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
        title: t('admin.affiliateImport.errors.error'),
        description: t('admin.affiliateImport.errors.selectSource'),
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
          title: t('admin.affiliateImport.importStarted'),
          description: t('admin.affiliateImport.importingFrom', { source: importForm.source })
        })

        // Start polling for status
        pollImportStatus(data.import_run_id)
      } else {
        throw new Error(data.error || t('admin.affiliateImport.errors.importFailed'))
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: t('admin.affiliateImport.errors.importFailed'),
        description: error instanceof Error ? error.message : t('admin.affiliateImport.errors.unknownError'),
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
              title: t('admin.affiliateImport.importCompleted'),
              description: t('admin.affiliateImport.importResults', {
                created: data.import_run.created_records,
                updated: data.import_run.updated_records,
                failed: data.import_run.failed_records
              })
            })
            fetchImportRuns()
            fetchPrograms()
          } else if (data.import_run.status === 'failed') {
            clearInterval(pollInterval)
            toast({
              title: t('admin.affiliateImport.errors.importFailed'),
              description: data.import_run.error_log || t('admin.affiliateImport.errors.unknownError'),
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
          <h2 className="text-2xl font-bold">{t('admin.affiliateImport.title')}</h2>
          <p className="text-muted-foreground">{t('admin.affiliateImport.description')}</p>
        </div>
        <Button onClick={() => { fetchPrograms(); fetchImportRuns(); }} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('admin.affiliateImport.refresh')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import">{t('admin.affiliateImport.importOffers')}</TabsTrigger>
          <TabsTrigger value="programs">{t('admin.affiliateImport.programs.title')}</TabsTrigger>
          <TabsTrigger value="history">{t('admin.affiliateImport.importHistory')}</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {t('admin.affiliateImport.configuration.title')}
              </CardTitle>
              <CardDescription>
                {t('admin.affiliateImport.configuration.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">{t('admin.affiliateImport.form.affiliateNetwork')}</Label>
                  <Select
                    value={importForm.source}
                    onValueChange={(value) => setImportForm(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.affiliateImport.form.selectAffiliateNetwork')} />
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
                  <Label htmlFor="limit">{t('admin.affiliateImport.form.importLimit')}</Label>
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
                  <Label htmlFor="keywords">{t('admin.affiliateImport.form.keywords')}</Label>
                  <Input
                    id="keywords"
                    placeholder={t('admin.affiliateImport.form.keywordsPlaceholder')}
                    value={importForm.params.keywords}
                    onChange={(e) => setImportForm(prev => ({
                      ...prev,
                      params: { ...prev.params, keywords: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">{t('admin.affiliateImport.form.category')}</Label>
                  <Input
                    id="category"
                    placeholder={t('admin.affiliateImport.form.categoryPlaceholder')}
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
                  <Label htmlFor="min_commission">{t('admin.affiliateImport.form.minCommission')}</Label>
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
                  <Label htmlFor="max_commission">{t('admin.affiliateImport.form.maxCommission')}</Label>
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
                  <span className="text-sm">{t('admin.affiliateImport.form.hasCoupon')}</span>
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
                  <span className="text-sm">{t('admin.affiliateImport.form.onSaleOnly')}</span>
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
                    {t('admin.affiliateImport.importing')}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {t('admin.affiliateImport.startImport')}
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
                  {t('admin.affiliateImport.currentImport.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>{t('admin.affiliateImport.currentImport.network')}: {currentImport.affiliate_program?.name}</span>
                    <Badge className={getStatusColor(currentImport.status)}>
                      {currentImport.status}
                    </Badge>
                  </div>

                  {currentImport.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('admin.affiliateImport.currentImport.progress')}</span>
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
                        <div className="text-sm text-muted-foreground">{t('admin.affiliateImport.currentImport.created')}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{currentImport.updated_records}</div>
                        <div className="text-sm text-muted-foreground">{t('admin.affiliateImport.currentImport.updated')}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{currentImport.failed_records}</div>
                        <div className="text-sm text-muted-foreground">{t('admin.affiliateImport.currentImport.failed')}</div>
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
                {t('admin.affiliateImport.programs.title')}
              </CardTitle>
              <CardDescription>
                {t('admin.affiliateImport.programs.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {programs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('admin.affiliateImport.programs.noPrograms')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programs.map((program) => (
                    <Card key={program.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{program.name}</h3>
                          <Badge variant={program.is_active ? 'default' : 'secondary'}>
                            {program.is_active ? t('admin.affiliateImport.programs.active') : t('admin.affiliateImport.programs.inactive')}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('admin.affiliateImport.programs.provider')}:</span>
                            <span className="capitalize">{program.provider}</span>
                          </div>

                          {program.commission_rate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('admin.affiliateImport.programs.commission')}:</span>
                              <span>{program.commission_rate}%</span>
                            </div>
                          )}

                          {program.last_sync_at && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('admin.affiliateImport.programs.lastSync')}:</span>
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
                {t('admin.affiliateImport.history.title')}
              </CardTitle>
              <CardDescription>
                {t('admin.affiliateImport.history.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('admin.affiliateImport.history.noRuns')}
                </div>
              ) : (
                <div className="space-y-4">
                  {importRuns.map((run) => (
                    <div key={run.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          <span className="font-medium">{run.affiliate_program?.name || t('admin.affiliateImport.history.unknownNetwork')}</span>
                          <Badge variant="outline">{run.affiliate_program?.provider}</Badge>
                        </div>
                        <Badge className={getStatusColor(run.status)}>
                          {run.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">{t('admin.affiliateImport.history.total')}</div>
                          <div className="font-medium">{run.total_records}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">{t('admin.affiliateImport.history.created')}</div>
                          <div className="font-medium text-green-600">{run.created_records}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">{t('admin.affiliateImport.history.updated')}</div>
                          <div className="font-medium text-blue-600">{run.updated_records}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">{t('admin.affiliateImport.history.failed')}</div>
                          <div className="font-medium text-red-600">{run.failed_records}</div>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        {t('admin.affiliateImport.history.started')}: {new Date(run.started_at).toLocaleString()}
                        {run.completed_at && (
                          <> • {t('admin.affiliateImport.history.completed')}: {new Date(run.completed_at).toLocaleString()}</>
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
