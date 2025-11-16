'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Calendar,
  TrendingUp,
  FileText,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/contexts/i18n-context'

interface BlogPost {
  id: string
  title: string
  slug: string
  status: 'draft' | 'pending' | 'published' | 'archived'
  views_count: number
  likes_count: number
  published_at: string | null
  created_at: string
  excerpt: string | null
  featured_image_url: string | null
  category?: { name: string; slug: string } | null
  author?: { full_name: string } | null
}

export default function BlogManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, tr } = useTranslation()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [statusFilter])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const url = `/api/admin/blog/posts?${statusFilter !== 'all' ? `status=${statusFilter}&` : ''}limit=100`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load posts')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('blog.admin.loadError'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!postToDelete) return
    
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/blog/posts/${postToDelete}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: t('blog.admin.deleteError') }))
        throw new Error(error.error || t('blog.admin.deleteError'))
      }
      
      toast({
        title: t('blog.admin.deleted'),
        description: t('blog.admin.deleteSuccess'),
      })
      
      setDeleteDialogOpen(false)
      setPostToDelete(null)
      loadPosts()
    } catch (error: any) {
      toast({
        title: t('blog.admin.deleteFailed'),
        description: error.message || t('blog.admin.deleteError'),
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusChange = async (postId: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const res = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: t('blog.admin.updateError') }))
        throw new Error(error.error || t('blog.admin.statusUpdateError'))
      }
      
      toast({
        title: t('blog.admin.statusUpdated'),
        description: t('blog.admin.statusChanged', { status: newStatus }),
      })
      
      loadPosts()
    } catch (error: any) {
      toast({
        title: t('blog.admin.updateFailed'),
        description: error.message || t('blog.admin.statusUpdateError'),
        variant: 'destructive',
      })
    }
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      published: 'default',
      draft: 'secondary',
      pending: 'outline',
      archived: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('blog.admin.title')}</h1>
          <p className="text-muted-foreground">{t('blog.admin.description')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/blog/create">
            <Plus className="h-4 w-4 mr-2" />
            {t('blog.admin.createNew')}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('blog.admin.searchPlaceholder')}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                {t('blog.admin.filter.all')}
              </Button>
              <Button
                variant={statusFilter === 'published' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('published')}
                size="sm"
              >
                {t('blog.admin.filter.published')}
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('draft')}
                size="sm"
              >
                {t('blog.admin.filter.draft')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>{tr('blog.admin.allPosts', { count: filteredPosts.length })}</CardTitle>
          <CardDescription>{t('blog.admin.manageContent')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('blog.admin.noPostsFound')}</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/blog/create">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('blog.admin.createFirst')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('blog.admin.table.title')}</TableHead>
                    <TableHead>{t('blog.admin.table.status')}</TableHead>
                    <TableHead>{t('blog.admin.table.category')}</TableHead>
                    <TableHead>{t('blog.admin.table.author')}</TableHead>
                    <TableHead>{t('blog.admin.table.views')}</TableHead>
                    <TableHead>{t('blog.admin.table.published')}</TableHead>
                    <TableHead className="text-right">{t('blog.admin.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {post.featured_image_url && (
                            <img
                              src={post.featured_image_url}
                              alt={post.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{post.title}</div>
                            <div className="text-sm text-muted-foreground">{post.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(post.status)}
                      </TableCell>
                      <TableCell>
                        {post.category ? (
                          <Badge variant="outline">{post.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{post.author?.full_name || t('blog.admin.unknown')}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <TrendingUp className="h-3 w-3 mr-1 text-muted-foreground" />
                          {post.views_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {post.published_at ? (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(post.published_at).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/blog/edit/${post.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPostToDelete(post.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('blog.admin.deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('blog.admin.deleteConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('blog.admin.deleting')}
                </>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

