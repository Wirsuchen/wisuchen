import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PayPalCheckout } from '@/components/payment/paypal-checkout'
import { PageLayout } from '@/components/layout/page-layout'

export default async function PaymentPage() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  return (
    <PageLayout showBackButton={true} containerClassName="max-w-4xl">
      <PayPalCheckout />
    </PageLayout>
  )
}
