export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin by email (simple check)
  if (user.email === 'george@shelfdrop.co') {
    redirect('/admin')
  }

  // For brand users, check their brand status
  const { data: brand } = await supabase
    .from('brands')
    .select('id, onboarding_status')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  switch (brand.onboarding_status) {
    case 'pending':
      redirect('/onboarding/pending')
    case 'approved':
    case 'pricing_review':
      redirect('/onboarding/pricing')
    case 'pricing_accepted':
    case 'contract_pending':
      redirect('/onboarding/contracts')
    case 'contract_signed':
    case 'shipping_setup':
      redirect('/onboarding/shipping')
    case 'active':
      redirect('/dashboard')
    default:
      redirect('/onboarding')
  }
}
