export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user has a brand
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
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
    case 'active':
      // Stay on dashboard
      break
    case 'rejected':
      redirect('/onboarding/pending')
    default:
      // If status is null/undefined, go to onboarding
      if (!brand.onboarding_status) {
        redirect('/onboarding')
      }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {brand.company_name || brand.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">£0.00</p>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Orders</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
          <p className="text-sm text-gray-500 mt-1">Pending fulfillment</p>
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Inventory</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
          <p className="text-sm text-gray-500 mt-1">Units in stock</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-500 text-sm">No recent activity to show.</p>
      </div>
    </div>
  )
}
