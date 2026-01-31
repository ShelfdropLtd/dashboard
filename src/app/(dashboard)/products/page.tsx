export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, Plus, Clock, CheckCircle, XCircle } from 'lucide-react'
import BrandAddProductForm from './BrandAddProductForm'
import BrandProductsTable from './BrandProductsTable'

export default async function BrandProductsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get brand for this user
  const { data: brand } = await supabase
    .from('brands')
    .select('id, company_name, name')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  // Get products for this brand
  const { data: products } = await supabase
    .from('brand_products')
    .select('*')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })

  const pendingCount = products?.filter(p => p.status === 'pending').length || 0
  const approvedCount = products?.filter(p => p.status === 'approved').length || 0
  const rejectedCount = products?.filter(p => p.status === 'rejected').length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600 mt-1">Manage your product catalog</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending Approval</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
              <p className="text-sm text-gray-500">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Add New Product</h2>
        <p className="text-sm text-gray-500 mb-4">
          Submit products for Shelfdrop approval. Enter your wholesale price - we'll review and confirm before listing.
        </p>
        <BrandAddProductForm brandId={brand.id} />
      </div>

      {/* Products Table */}
      {products && products.length > 0 ? (
        <BrandProductsTable products={products} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Products Yet</h2>
          <p className="text-gray-500">Add your first product above to get started.</p>
        </div>
      )}
    </div>
  )
}
