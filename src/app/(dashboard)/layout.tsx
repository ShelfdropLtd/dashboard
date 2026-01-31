export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // If admin, let them through to dashboard
  if (profile?.role === 'admin') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    )
  }

  // For brand users, check if they have a brand and onboarding status
  const { data: brand } = await supabase
    .from('brands')
    .select('id, onboarding_status')
    .eq('user_id', user.id)
    .single()

  // If no brand, redirect to onboarding
  if (!brand) {
    redirect('/onboarding')
  }

  // Route based on onboarding status
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
    case 'rejected':
      redirect('/onboarding/pending')
    case 'active':
      // Stay on dashboard - onboarding complete
      break
    default:
      // If status is null/undefined/draft, go to onboarding
      redirect('/onboarding')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
