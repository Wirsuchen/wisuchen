import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageLayout } from '@/components/layout/page-layout'

export default async function BloggerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('id, role, full_name, email').eq('user_id', user.id).single()
  if (!profile || !['blogger','editor','supervisor','admin'].includes(profile.role as string)) redirect('/')
  return (
    <PageLayout showBackButton={false} containerClassName="max-w-7xl">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Blogger Panel</h1>
      </div>
    </PageLayout>
  )
}
