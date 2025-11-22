'use client'

import { useTranslation } from '@/contexts/i18n-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Settings, FileText, ShieldAlert, Activity } from "lucide-react"
import { UserManagementTab } from './user-management-tab'
import { ConfigTab } from './config-tab'
import { OverviewTab } from './overview-tab'
import { LogsTab } from './logs-tab'
import { EscalationTab } from './escalation-tab'

export function SupervisorContent() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('supervisor.panel.title')}</h1>
        <p className="text-muted-foreground">{t('supervisor.panel.description')}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            {t('supervisor.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            {t('supervisor.tabs.users')}
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            {t('supervisor.tabs.config')}
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            {t('supervisor.tabs.logs')}
          </TabsTrigger>
          <TabsTrigger value="escalation">
            <ShieldAlert className="h-4 w-4 mr-2" />
            {t('supervisor.tabs.escalation')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagementTab />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <ConfigTab />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <LogsTab />
        </TabsContent>

        <TabsContent value="escalation" className="space-y-4">
          <EscalationTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
