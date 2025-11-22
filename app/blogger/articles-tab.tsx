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
import { Edit, Trash2, Eye, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/contexts/i18n-context'
import Link from 'next/link'

interface BlogPost {
    id: string
    title: string
    slug: string
    status: 'draft' | 'pending' | 'published' | 'archived'
    views_count: number
    created_at: string
    author?: { full_name: string } | null
}

interface ArticlesTabProps {
    onEdit: (post: BlogPost) => void
}

export function ArticlesTab({ onEdit }: ArticlesTabProps) {
    const { toast } = useToast()
    const { t } = useTranslation()
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPosts()
    }, [])

    const loadPosts = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/blog/posts?limit=50')
            if (!res.ok) throw new Error('Failed to load posts')
            const data = await res.json()
            setPosts(data.posts || [])
        } catch (error: any) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('blog.admin.deleteConfirm.description'))) return
        try {
            await fetch(`/api/admin/blog/posts/${id}`, { method: 'DELETE' })
            setPosts(posts.filter(p => p.id !== id))
            toast({ title: t('blog.admin.deleted') })
        } catch (e) {
            toast({ title: t('common.error'), variant: 'destructive' })
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('blogger.articles.title')}</CardTitle>
                <CardDescription>{t('blogger.articles.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('blog.admin.table.title')}</TableHead>
                                <TableHead>{t('blog.admin.table.status')}</TableHead>
                                <TableHead>{t('blog.admin.table.views')}</TableHead>
                                <TableHead className="text-right">{t('blog.admin.table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">{t('blog.admin.noPostsFound')}</TableCell>
                                </TableRow>
                            ) : (
                                posts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell>
                                            <div className="font-medium">{post.title}</div>
                                            <div className="text-xs text-muted-foreground">{post.slug}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                                {post.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{post.views_count}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/blog/${post.slug}`} target="_blank"><Eye className="h-4 w-4" /></Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => onEdit(post)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
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
