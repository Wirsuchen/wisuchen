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

const permissions: Permission[] = [
  { feature: 'Manage Users & Roles', supervisor: true, admin: true, moderator: false, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
  { feature: 'Manage Categories', supervisor: true, admin: true, moderator: true, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
  { feature: 'Manage Job Sources', supervisor: true, admin: true, moderator: false, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
  { feature: 'View All Offers', supervisor: true, admin: true, moderator: true, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
  { feature: 'Create Job Offers', supervisor: true, admin: true, moderator: true, lister: true, publisher: true, blogger: false, editor: false, analyst: false },
  { feature: 'Approve/Reject Content', supervisor: true, admin: true, moderator: true, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
  { feature: 'Create Blog Posts', supervisor: true, admin: true, moderator: true, lister: false, publisher: false, blogger: true, editor: true, analyst: false },
  { feature: 'Edit Any Blog Post', supervisor: true, admin: true, moderator: true, lister: false, publisher: false, blogger: false, editor: true, analyst: false },
  { feature: 'View Analytics', supervisor: true, admin: true, moderator: false, lister: false, publisher: false, blogger: false, editor: false, analyst: true },
  { feature: 'View Audit Logs', supervisor: true, admin: true, moderator: false, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
  { feature: 'Manage Settings', supervisor: true, admin: true, moderator: false, lister: false, publisher: false, blogger: false, editor: false, analyst: false },
  { feature: 'Create Company', supervisor: true, admin: true, moderator: true, lister: true, publisher: true, blogger: false, editor: false, analyst: false },
  { feature: 'Upload Media', supervisor: true, admin: true, moderator: true, lister: true, publisher: true, blogger: true, editor: true, analyst: true },
]

const roles = [
  { key: 'supervisor', name: 'Supervisor', color: 'bg-red-500', description: 'Full system access' },
  { key: 'admin', name: 'Admin', color: 'bg-orange-500', description: 'Manage content & users' },
  { key: 'moderator', name: 'Moderator', color: 'bg-yellow-500', description: 'Content moderation' },
  { key: 'lister', name: 'Lister', color: 'bg-blue-500', description: 'Job ad management' },
  { key: 'publisher', name: 'Publisher', color: 'bg-indigo-500', description: 'Post job listings' },
  { key: 'blogger', name: 'Blogger', color: 'bg-purple-500', description: 'Write articles' },
  { key: 'editor', name: 'Editor', color: 'bg-pink-500', description: 'Edit all articles' },
  { key: 'analyst', name: 'Analyst', color: 'bg-cyan-500', description: 'View analytics' },
]

export function RolePermissions() {
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
            <CardTitle>Role Permissions Matrix</CardTitle>
          </div>
          <CardDescription>
            Detailed permissions for each role in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Feature / Permission</TableHead>
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
                <CardTitle className="text-sm">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Has permission</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-gray-300" />
                  <span>No permission</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Assign minimum required permissions</p>
                <p>• Review permissions regularly</p>
                <p>• Use supervisor role sparingly</p>
                <p>• Enable 2FA for admin roles</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
