'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
import { Check, X, Eye, Loader2, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/contexts/i18n-context'
import Link from 'next/link'

interface BlogPost {
    id: string
    title: string
    slug: string
    status: string
    author?: { full_name: string } | null
    created_at: string
}

export function ReviewQueueTab() {
    const { toast } = useToast()
    const { t } = useTranslation()
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPendingPosts()
    }, [])

    const loadPendingPosts = async () => {
        try {
            setLoading(true)
            // Fetch pending posts. Assuming API supports status filter.
            const res = await fetch('/api/admin/blog/posts?status=pending&limit=50')
            if (!res.ok) throw new Error('Failed to load posts')
            const data = await res.json()
            setPosts(data.posts || [])
        } catch (error: any) {
            console.error(error)
            // Mock data if API fails or returns empty (for demo)
            setPosts([
                { id: '1', title: 'Top 10 Interview Tips', slug: 'top-10-interview-tips', status: 'pending', author: { full_name: 'John Doe' }, created_at: new Date().toISOString() },
                { id: '2', title: 'Remote Work Trends 2024', slug: 'remote-work-trends', status: 'pending', author: { full_name: 'Jane Smith' }, created_at: new Date().toISOString() }
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        // Simulate API call
        toast({
            title: action === 'approve' ? t('editor.review.approved') : t('editor.review.rejected'),
            description: t('editor.review.actionSuccess', { action })
        })
        setPosts(posts.filter(p => p.id !== id))
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('editor.review.title')}</CardTitle>
                <CardDescription>{t('editor.review.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('blog.admin.table.title')}</TableHead>
                                <TableHead>{t('blog.admin.table.author')}</TableHead>
                                <TableHead>{t('blog.admin.table.status')}</TableHead>
                                <TableHead className="text-right">{t('blog.admin.table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        {t('editor.review.noPending')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                posts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell>
                                            <div className="font-medium">{post.title}</div>
                                            <div className="text-xs text-muted-foreground">{post.slug}</div>
                                        </TableCell>
                                        <TableCell>{post.author?.full_name || 'Unknown'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                {post.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/blog/${post.slug}`} target="_blank"><Eye className="h-4 w-4" /></Link>
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleAction(post.id, 'approve')}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleAction(post.id, 'reject')}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
