import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageLayout } from '@/components/layout/page-layout'
import { defaultLocale } from '@/i18n/config'
import { getTranslation } from '@/i18n/utils'

export default async function AnalystPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('id, role, full_name, email').eq('user_id', user.id).single()
  if (!profile || !['analyst','supervisor','admin'].includes(profile.role as string)) redirect('/')
  return (
    <PageLayout showBackButton={false} containerClassName="max-w-7xl">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">
          {getTranslation(defaultLocale, 'admin.roles.analystPanelTitle', 'Analyst Panel')}
        </h1>
      </div>
    </PageLayout>
  )
}
