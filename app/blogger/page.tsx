import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageLayout } from '@/components/layout/page-layout'
import { defaultLocale } from '@/i18n/config'
import { getTranslation } from '@/i18n/utils'
import { BloggerContent } from './blogger-client'

export default async function BloggerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('id, role, full_name, email').eq('user_id', user.id).single()
  if (!profile || !['blogger', 'editor', 'supervisor', 'admin'].includes(profile.role as string)) redirect('/')
  return (
    <PageLayout showBackButton={false} containerClassName="max-w-7xl">
      <BloggerContent />
    </PageLayout>
  )
}
