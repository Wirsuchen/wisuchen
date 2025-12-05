'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Search, UserCog, Shield, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { format } from 'date-fns'
import { useTranslation } from '@/contexts/i18n-context'

interface User {
  id: string
  user_id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  is_subscribed?: boolean
  plan?: string
}

export function UserManagement() {
  const { t, tr } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { toast } = useToast()
  const PLANS = ['free', 'pro', 'premium']

  const ROLES = [
    { value: 'supervisor', label: t('admin.userManagement.roles.supervisor'), color: 'bg-red-500' },
    { value: 'admin', label: t('admin.userManagement.roles.admin'), color: 'bg-orange-500' },
    { value: 'moderator', label: t('admin.userManagement.roles.moderator'), color: 'bg-yellow-500' },
    { value: 'lister', label: t('admin.userManagement.roles.lister'), color: 'bg-blue-500' },
    { value: 'publisher', label: t('admin.userManagement.roles.publisher'), color: 'bg-indigo-500' },
    { value: 'blogger', label: t('admin.userManagement.roles.blogger'), color: 'bg-purple-500' },
    { value: 'editor', label: t('admin.userManagement.roles.editor'), color: 'bg-pink-500' },
    { value: 'analyst', label: t('admin.userManagement.roles.analyst'), color: 'bg-cyan-500' },
    { value: 'employer', label: t('admin.userManagement.roles.employer'), color: 'bg-green-500' },
    { value: 'job_seeker', label: t('admin.userManagement.roles.jobSeeker'), color: 'bg-gray-500' },
  ]

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error(t('admin.userManagement.errors.fetchUsers'))
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: t('admin.userManagement.errors.error'),
        description: t('admin.userManagement.errors.loadUsers'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSubscription = async (profileId: string, next: boolean) => {
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, is_subscribed: next })
      })
      if (!res.ok) throw new Error(t('admin.userManagement.errors.updateSubscription'))
      toast({ title: next ? t('admin.userManagement.subscription.subscribed') : t('admin.userManagement.subscription.unsubscribed') })
      fetchUsers()
    } catch (e) {
      toast({ title: t('admin.userManagement.errors.error'), description: t('admin.userManagement.errors.couldNotUpdateSubscription'), variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const updatePlan = async (profileId: string, plan: string) => {
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, plan })
      })
      if (!res.ok) throw new Error(t('admin.userManagement.errors.updatePlan'))
      toast({ title: t('admin.userManagement.plan.updated'), description: plan })
      fetchUsers()
    } catch (e) {
      toast({ title: t('admin.userManagement.errors.error'), description: t('admin.userManagement.errors.couldNotUpdatePlan'), variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
    setCurrentPage(1)
  }

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return

    setUpdating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: selectedUser.id,
          role: newRole,
        }),
      })

      if (!res.ok) throw new Error(t('admin.userManagement.errors.updateRole'))

      toast({
        title: t('admin.userManagement.role.updated'),
        description: tr('admin.userManagement.role.updateDescription', { email: selectedUser.email, role: newRole }),
      })

      setIsDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: t('admin.userManagement.errors.error'),
        description: t('admin.userManagement.errors.updateRole'),
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const openRoleDialog = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setIsDialogOpen(true)
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = ROLES.find((r) => r.value === role)
    return (
      <Badge className={`${roleConfig?.color || 'bg-gray-500'} text-white`}>
        {roleConfig?.label || role}
      </Badge>
    )
  }

  const getRoleStats = () => {
    const stats = ROLES.map((role) => ({
      ...role,
      count: users.filter((u) => u.role === role.value).length,
    }))
    return stats.filter((s) => s.count > 0)
  }

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.userManagement.stats.totalUsers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        {getRoleStats().slice(0, 4).map((stat) => (
          <Card key={stat.value}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}s</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                {t('admin.userManagement.title')}
              </CardTitle>
              <CardDescription>{t('admin.userManagement.description')}</CardDescription>
            </div>
            <Button onClick={fetchUsers} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('admin.userManagement.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.userManagement.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={t('admin.userManagement.filterByRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.userManagement.allRoles')}</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('admin.userManagement.noUsers')}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.userManagement.table.user')}</TableHead>
                      <TableHead>{t('admin.userManagement.table.email')}</TableHead>
                      <TableHead>{t('admin.userManagement.table.role')}</TableHead>
                      <TableHead>{t('admin.userManagement.table.subscription')}</TableHead>
                      <TableHead>{t('admin.userManagement.table.plan')}</TableHead>
                      <TableHead>{t('admin.userManagement.table.joined')}</TableHead>
                      <TableHead className="text-right">{t('admin.userManagement.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || t('admin.userManagement.table.noName')}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          <Switch
                            checked={!!user.is_subscribed}
                            onCheckedChange={(checked) => updateSubscription(user.id, checked)}
                            disabled={updating}
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={user.plan || 'free'} onValueChange={(v) => updatePlan(user.id, v)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PLANS.map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleDialog(user)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            {t('admin.userManagement.table.changeRole')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    {tr('admin.userManagement.pagination.showing', {
                      start: startIndex + 1,
                      end: Math.min(endIndex, filteredUsers.length),
                      total: filteredUsers.length
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.userManagement.dialog.changeRole')}</DialogTitle>
            <DialogDescription>
              {tr('admin.userManagement.dialog.updateRoleFor', { email: selectedUser?.email || '' })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">{t('admin.userManagement.dialog.selectNewRole')}</label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${role.color}`} />
                      {role.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              {t('admin.userManagement.dialog.currentRole')}: <strong>{selectedUser?.role}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('admin.userManagement.dialog.cancel')}
            </Button>
            <Button onClick={handleRoleChange} disabled={updating || newRole === selectedUser?.role}>
              {updating ? t('admin.userManagement.dialog.updating') : t('admin.userManagement.dialog.updateRole')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
