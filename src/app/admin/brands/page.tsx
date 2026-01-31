export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, ChevronRight, Package, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export default async function AdminBrandsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get all approved brands with stats
  const { data: brands } = await supabase
    .from('brands')
    .select(`
      id,
      company_name,
      name,
      contact_email,
      status,
      created_at
    `)
    .eq('status', 'approved')
    .order('company_name', { ascending: true })

  // Get product counts per brand
  const { data: productCounts } = await supabase
    .from('brand_products')
    .select('brand_id')
    .eq('status', 'approved')

  // Get PO counts per brand
  const { data: poCounts } = await supabase
    .from('purchase_orders')
    .select('brand_id')

  // Create lookup maps
  const productCountMap: Record<string, number> = {}
  productCounts?.forEach((p) => {
    productCountMap[p.brand_id] = (productCountMap[p.brand_id] || 0) + 1
  })

  const poCountMap: Record<string, number> = {}
  poCounts?.forEach((p) => {
    poCountMap[p.brand_id] = (poCountMap[p.brand_id] || 0) + 1
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-600 mt-1">Manage approved brands</p>
        </div>
      </div>

      {!brands || brands.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Brands Yet</h2>
          <p className="text-gray-500">Approved brands will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Products</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">POs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {brand.company_name || brand.name || 'Unnamed'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {brand.contact_email || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                      <Package className="w-4 h-4 text-gray-400" />
                      {productCountMap[brand.id] || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                      <ShoppingCart className="w-4 h-4 text-gray-400" />
                      {poCountMap[brand.id] || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(brand.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/brands/${brand.id}`}
                      className="inline-flex items-center gap-1 text-[#F15A2B] hover:underline text-sm"
                    >
                      Manage
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
