export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, Plus } from 'lucide-react'
import ProductsTable from './ProductsTable'
import BrandFilter from './BrandFilter'
import AdminAddProductForm from './AdminAddProductForm'

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams: { brand?: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get all brands for filter and add product form
  const { data: brands } = await supabase
    .from('brands')
    .select('id, company_name, name')
    .eq('status', 'approved')
    .order('company_name', { ascending: true })

  // Get products (filtered by brand if specified)
  let query = supabase
    .from('brand_products')
    .select('*, brands(id, company_name, name)')
    .order('created_at', { ascending: false })

  if (searchParams.brand) {
    query = query.eq('brand_id', searchParams.brand)
  }

  const { data: products } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage all brand products</p>
        </div>
      </div>

      {/* Add Product Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-[#F15A2B]" />
          <h2 className="font-semibold text-gray-900">Add Product</h2>
        </div>
        <AdminAddProductForm brands={brands || []} />
      </div>

      <BrandFilter
        brands={brands || []}
        selectedBrandId={searchParams.brand}
      />

      {!products || products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Products</h2>
          <p className="text-gray-500">
            {searchParams.brand
              ? 'No products for this brand yet'
              : 'No products have been added yet'}
          </p>
        </div>
      ) : (
        <ProductsTable products={products} brands={brands || []} />
      )}
    </div>
  )
}
