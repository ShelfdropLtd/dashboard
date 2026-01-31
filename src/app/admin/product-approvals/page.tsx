export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, Clock } from 'lucide-react'
import ProductApprovalList from './ProductApprovalList'

export default async function ProductApprovalsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get pending products with brand info
  const { data: pendingProducts } = await supabase
    .from('brand_products')
    .select('*, brands(id, company_name, name)')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  // Get recently actioned products
  const { data: recentProducts } = await supabase
    .from('brand_products')
    .select('*, brands(id, company_name, name)')
    .in('status', ['approved', 'rejected'])
    .order('approved_at', { ascending: false, nullsFirst: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve brand product submissions</p>
      </div>

      {/* Pending Products */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Pending Approval</h2>
            <p className="text-sm text-gray-500">{pendingProducts?.length || 0} products awaiting review</p>
          </div>
        </div>

        {pendingProducts && pendingProducts.length > 0 ? (
          <ProductApprovalList products={pendingProducts} />
        ) : (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No products pending approval</p>
          </div>
        )}
      </div>

      {/* Recently Actioned */}
      {recentProducts && recentProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recently Reviewed</h2>
            <p className="text-sm text-gray-500">Last 10 approved or rejected products</p>
          </div>
          <div className="divide-y divide-gray-200">
            {recentProducts.map((product: any) => (
              <div key={product.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-gray-500">
                      {product.brands?.company_name || product.brands?.name} • {product.sku_code}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {product.status === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    £{product.unit_cost?.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
