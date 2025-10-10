import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin/dashboard'
import { PageLayout } from '@/components/layout/page-layout'

export default async function AdminPage() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile and check permissions
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  // Check if user has admin privileges
  if (!['supervisor', 'admin', 'moderator'].includes(profile.role)) {
    redirect('/')
  }

  return (
    <PageLayout showBackButton={false} containerClassName="max-w-7xl">
      <AdminDashboard />
    </PageLayout>
  )
}
