export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, Clock } from 'lucide-react'
import BrandApprovalList from './BrandApprovalList'

export default async function BrandApprovalsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get pending brands
  const { data: pendingBrands } = await supabase
    .from('brands')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // Get recently actioned brands
  const { data: recentBrands } = await supabase
    .from('brands')
    .select('*')
    .in('status', ['approved', 'rejected'])
    .order('updated_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Brand Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve new brand applications</p>
      </div>

      {/* Pending Brands */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Pending Approval</h2>
            <p className="text-sm text-gray-500">{pendingBrands?.length || 0} brands awaiting review</p>
          </div>
        </div>

        {pendingBrands && pendingBrands.length > 0 ? (
          <BrandApprovalList brands={pendingBrands} />
        ) : (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No brands pending approval</p>
          </div>
        )}
      </div>

      {/* Recently Actioned */}
      {recentBrands && recentBrands.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recently Reviewed</h2>
            <p className="text-sm text-gray-500">Last 10 approved or rejected brands</p>
          </div>
          <div className="divide-y divide-gray-200">
            {recentBrands.map((brand) => (
              <div key={brand.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {brand.company_name || brand.name || 'Unnamed'}
                    </p>
                    <p className="text-sm text-gray-500">{brand.contact_email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  brand.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {brand.status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
