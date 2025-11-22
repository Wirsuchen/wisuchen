'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/contexts/i18n-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Search, Save, Loader2 } from "lucide-react"

interface User {
    id: string
    user_id: string
    email: string
    full_name: string
    role: string
    created_at: string
    is_subscribed: boolean
    plan: string
}

export function UserManagementTab() {
    const { t } = useTranslation()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users)
            }
        } catch (error) {
            console.error('Failed to fetch users', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        setUpdating(userId)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_id: userId, role: newRole }),
            })

            if (res.ok) {
                toast({ title: t('supervisor.users.updateSuccess') })
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
            } else {
                toast({ title: t('supervisor.users.updateFailed'), variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: t('common.error'), variant: 'destructive' })
        } finally {
            setUpdating(null)
        }
    }

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('supervisor.users.title')}</CardTitle>
                <CardDescription>{t('supervisor.users.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('supervisor.users.searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                    />
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('supervisor.users.name')}</TableHead>
                                <TableHead>{t('supervisor.users.email')}</TableHead>
                                <TableHead>{t('supervisor.users.role')}</TableHead>
                                <TableHead>{t('supervisor.users.status')}</TableHead>
                                <TableHead>{t('supervisor.users.joined')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        {t('supervisor.users.noUsersFound')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={user.role}
                                                onValueChange={(value) => handleRoleUpdate(user.id, value)}
                                                disabled={updating === user.id}
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user">User</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="supervisor">Supervisor</SelectItem>
                                                    <SelectItem value="moderator">Moderator</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {user.is_subscribed ? (
                                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                                                    Pro
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                                                    Free
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
