import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageLayout } from '@/components/layout/page-layout'
import { defaultLocale } from '@/i18n/config'
import { getTranslation } from '@/i18n/utils'
import { ListerClient } from './lister-client'

export default async function ListerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('id, role, full_name, email').eq('user_id', user.id).single()
  if (!profile || !['lister', 'supervisor', 'admin'].includes(profile.role as string)) redirect('/')
  return (
    <PageLayout showBackButton={false} containerClassName="max-w-7xl">
      <ListerClient />
    </PageLayout>
  )
}
