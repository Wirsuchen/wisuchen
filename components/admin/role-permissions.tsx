'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Shield, Check, X } from 'lucide-react'
import { useTranslation } from '@/contexts/i18n-context'

interface Permission {
  feature: string
  supervisor: boolean
  admin: boolean
  moderator: boolean
  lister: boolean
  publisher: boolean
  blogger: boolean
  editor: boolean
  analyst: boolean
}

export function RolePermissions() {
  const { t } = useTranslation()

  const permissions: Permission[] = [
    { feature: t('admin.rolePermissions.permissions.manageUsers'), supervisor: true, admin: true, moderator: false, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
    { feature: t('admin.rolePermissions.permissions.manageCategories'), supervisor: true, admin: true, moderator: true, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
    { feature: t('admin.rolePermissions.permissions.manageJobSources'), supervisor: true, admin: true, moderator: false, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
    { feature: t('admin.rolePermissions.permissions.viewAllOffers'), supervisor: true, admin: true, moderator: true, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
    { feature: t('admin.rolePermissions.permissions.createJobOffers'), supervisor: true, admin: true, moderator: true, lister: true, publisher: true, blogger: false, editor: false, analyst: false },
    { feature: t('admin.rolePermissions.permissions.approveContent'), supervisor: true, admin: true, moderator: true, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
    { feature: t('admin.rolePermissions.permissions.createBlogPosts'), supervisor: true, admin: true, moderator: true, lister: false, publisher: false, blogger: true, editor: true, analyst: false },
    { feature: t('admin.rolePermissions.permissions.editAnyBlogPost'), supervisor: true, admin: true, moderator: true, lister: false, publisher: false, blogger: false, editor: true, analyst: false },
    { feature: t('admin.rolePermissions.permissions.viewAnalytics'), supervisor: true, admin: true, moderator: false, lister: false, publisher: false, blogger: false, editor: false, analyst: true },
    { feature: t('admin.rolePermissions.permissions.viewAuditLogs'), supervisor: true, admin: true, moderator: false, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
    { feature: t('admin.rolePermissions.permissions.manageSettings'), supervisor: true, admin: true, moderator: false, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
    { feature: t('admin.rolePermissions.permissions.createCompany'), supervisor: true, admin: true, moderator: true, lister: true, publisher: true, blogger: false, editor: false, analyst: false },
    { feature: t('admin.rolePermissions.permissions.uploadMedia'), supervisor: true, admin: true, moderator: true, lister: true, publisher: true, blogger: true, editor: true, analyst: true },
  ]

  const roles = [
    { key: 'supervisor', name: t('admin.rolePermissions.roles.supervisor'), color: 'bg-red-500', description: t('admin.rolePermissions.roleDescriptions.supervisor') },
    { key: 'admin', name: t('admin.rolePermissions.roles.admin'), color: 'bg-orange-500', description: t('admin.rolePermissions.roleDescriptions.admin') },
    { key: 'moderator', name: t('admin.rolePermissions.roles.moderator'), color: 'bg-yellow-500', description: t('admin.rolePermissions.roleDescriptions.moderator') },
    { key: 'lister', name: t('admin.rolePermissions.roles.lister'), color: 'bg-blue-500', description: t('admin.rolePermissions.roleDescriptions.lister') },
    { key: 'publisher', name: t('admin.rolePermissions.roles.publisher'), color: 'bg-indigo-500', description: t('admin.rolePermissions.roleDescriptions.publisher') },
    { key: 'blogger', name: t('admin.rolePermissions.roles.blogger'), color: 'bg-purple-500', description: t('admin.rolePermissions.roleDescriptions.blogger') },
    { key: 'editor', name: t('admin.rolePermissions.roles.editor'), color: 'bg-pink-500', description: t('admin.rolePermissions.roleDescriptions.editor') },
    { key: 'analyst', name: t('admin.rolePermissions.roles.analyst'), color: 'bg-cyan-500', description: t('admin.rolePermissions.roleDescriptions.analyst') },
  ]
  const Icon = ({ hasPermission }: { hasPermission: boolean }) => {
    return hasPermission ? (
      <Check className="h-5 w-5 text-green-500" />
    ) : (
      <X className="h-5 w-5 text-gray-300" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Role Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {roles.map((role) => (
          <Card key={role.key}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${role.color}`} />
                <CardTitle className="text-base">{role.name}</CardTitle>
              </div>
              <CardDescription className="text-xs">{role.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>{t('admin.rolePermissions.title')}</CardTitle>
          </div>
          <CardDescription>
            {t('admin.rolePermissions.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">{t('admin.rolePermissions.table.feature')}</TableHead>
                  {roles.map((role) => (
                    <TableHead key={role.key} className="text-center min-w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-3 h-3 rounded-full ${role.color}`} />
                        <span className="text-xs">{role.name}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{permission.feature}</TableCell>
                    <TableCell className="text-center">
                      <Icon hasPermission={permission.supervisor} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Icon hasPermission={permission.admin} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Icon hasPermission={permission.moderator} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Icon hasPermission={permission.lister} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Icon hasPermission={permission.publisher} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Icon hasPermission={permission.blogger} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Icon hasPermission={permission.editor} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Icon hasPermission={permission.analyst} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('admin.rolePermissions.legend.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{t('admin.rolePermissions.legend.hasPermission')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-gray-300" />
                  <span>{t('admin.rolePermissions.legend.noPermission')}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('admin.rolePermissions.bestPractices.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• {t('admin.rolePermissions.bestPractices.assignMinimum')}</p>
                <p>• {t('admin.rolePermissions.bestPractices.reviewRegularly')}</p>
                <p>• {t('admin.rolePermissions.bestPractices.useSupervisorSparingly')}</p>
                <p>• {t('admin.rolePermissions.bestPractices.enable2FA')}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
