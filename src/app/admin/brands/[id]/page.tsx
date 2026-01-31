export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Package, FileText } from 'lucide-react'
import AddProductForm from './AddProductForm'
import ProductList from './ProductList'

export default async function BrandDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get brand details
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!brand) {
    notFound()
  }

  // Get brand products
  const { data: products } = await supabase
    .from('brand_products')
    .select('*')
    .eq('brand_id', params.id)
    .order('created_at', { ascending: false })

  // Get purchase orders
  const { data: purchaseOrders } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('brand_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/brands"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {brand.company_name || brand.name || 'Brand'}
            </h1>
            <p className="text-gray-600">
              Status: <span className="capitalize">{brand.onboarding_status || 'pending'}</span>
            </p>
          </div>
        </div>
        <Link
          href={`/admin/brands/${params.id}/create-po`}
          className="flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Create PO
        </Link>
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-shelfdrop-blue" />
            <h2 className="text-lg font-semibold text-gray-900">Products ({products?.length || 0})</h2>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Product</h3>
          <AddProductForm brandId={params.id} />
        </div>

        <ProductList products={products || []} />
      </div>

      {/* Purchase Orders Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3">
          <FileText className="w-5 h-5 text-shelfdrop-blue" />
          <h2 className="text-lg font-semibold text-gray-900">Purchase Orders ({purchaseOrders?.length || 0})</h2>
        </div>

        {!purchaseOrders || purchaseOrders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No purchase orders yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{po.po_number}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(po.created_at).toLocaleDateString()} • £{po.total_amount?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  po.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  po.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {po.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
