'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/contexts/i18n-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Check, X, Loader2, FileText, Briefcase } from "lucide-react"

interface Item {
    id: string
    title: string
    author: string
    status: string
    created_at: string
    type: 'job' | 'post'
}

export function ContentApprovalTab() {
    const { t } = useTranslation()
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(true)
    const [activeType, setActiveType] = useState('job')

    useEffect(() => {
        fetchItems()
    }, [activeType])

    const fetchItems = async () => {
        setLoading(true)
        try {
            // In a real app, we would fetch from /api/admin/offers?status=pending or /api/admin/blog/posts?status=pending
            // For now, we'll simulate fetching
            await new Promise(resolve => setTimeout(resolve, 1000))

            const mockItems: Item[] = activeType === 'job' ? [
                { id: '1', title: 'Senior React Developer', author: 'Tech Corp', status: 'pending', created_at: '2023-11-20', type: 'job' },
                { id: '2', title: 'Backend Engineer', author: 'Startup Inc', status: 'pending', created_at: '2023-11-21', type: 'job' },
            ] : [
                { id: '3', title: 'Top 10 React Tips', author: 'John Doe', status: 'pending', created_at: '2023-11-22', type: 'post' },
            ]
            setItems(mockItems)
        } catch (error) {
            console.error('Failed to fetch items', error)
            toast({ title: t('common.error'), variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500))
            setItems(items.filter(item => item.id !== id))
            toast({ title: action === 'approve' ? t('moderator.approved') : t('moderator.rejected') })
        } catch (error) {
            toast({ title: t('common.error'), variant: 'destructive' })
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('moderator.approval.title')}</CardTitle>
                <CardDescription>{t('moderator.approval.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeType} onValueChange={setActiveType} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="job">
                            <Briefcase className="h-4 w-4 mr-2" />
                            {t('moderator.approval.jobs')}
                        </TabsTrigger>
                        <TabsTrigger value="post">
                            <FileText className="h-4 w-4 mr-2" />
                            {t('moderator.approval.posts')}
                        </TabsTrigger>
                    </TabsList>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('moderator.approval.itemTitle')}</TableHead>
                                    <TableHead>{t('moderator.approval.author')}</TableHead>
                                    <TableHead>{t('moderator.approval.date')}</TableHead>
                                    <TableHead>{t('moderator.approval.status')}</TableHead>
                                    <TableHead>{t('moderator.approval.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            {t('moderator.approval.noItems')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.title}</TableCell>
                                            <TableCell>{item.author}</TableCell>
                                            <TableCell>{item.created_at}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleAction(item.id, 'approve')}>
                                                        <Check className="h-4 w-4 mr-1" />
                                                        {t('common.approve')}
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleAction(item.id, 'reject')}>
                                                        <X className="h-4 w-4 mr-1" />
                                                        {t('common.reject')}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    )
}
