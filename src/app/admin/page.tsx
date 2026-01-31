export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, Package, ShoppingCart, FileText, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get stats
  const { count: brandsCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')

  const { count: pendingBrandsCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: productsCount } = await supabase
    .from('brand_products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')

  const { count: pendingProductsCount } = await supabase
    .from('brand_products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: posCount } = await supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })

  const { count: invoicesCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })

  // Get recent activity
  const { data: recentBrands } = await supabase
    .from('brands')
    .select('id, company_name, name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentPOs } = await supabase
    .from('purchase_orders')
    .select('id, po_number, status, created_at, brands(company_name, name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Active Brands', value: brandsCount || 0, icon: Building2, href: '/admin/brands', color: 'bg-blue-100 text-blue-600' },
    { label: 'Pending Brands', value: pendingBrandsCount || 0, icon: Clock, href: '/admin/approvals', color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Approved Products', value: productsCount || 0, icon: Package, href: '/admin/products', color: 'bg-green-100 text-green-600' },
    { label: 'Pending Products', value: pendingProductsCount || 0, icon: Clock, href: '/admin/product-approvals', color: 'bg-orange-100 text-orange-600' },
    { label: 'Purchase Orders', value: posCount || 0, icon: ShoppingCart, href: '/admin/brands', color: 'bg-purple-100 text-purple-600' },
    { label: 'Invoices', value: invoicesCount || 0, icon: FileText, href: '/admin/brands', color: 'bg-pink-100 text-pink-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, George</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className={`p-2 rounded-lg w-fit ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Brands */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Brands</h2>
            <Link href="/admin/brands" className="text-sm text-[#F15A2B] hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentBrands?.map((brand) => (
              <Link
                key={brand.id}
                href={`/admin/brands/${brand.id}`}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {brand.company_name || brand.name || 'Unnamed'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(brand.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  brand.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : brand.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {brand.status}
                </span>
              </Link>
            ))}
            {(!recentBrands || recentBrands.length === 0) && (
              <div className="p-8 text-center text-gray-500">No brands yet</div>
            )}
          </div>
        </div>

        {/* Recent POs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recent Purchase Orders</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentPOs?.map((po: any) => (
              <div key={po.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{po.po_number}</p>
                    <p className="text-sm text-gray-500">
                      {po.brands?.company_name || po.brands?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  po.status === 'accepted'
                    ? 'bg-green-100 text-green-700'
                    : po.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : po.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {po.status}
                </span>
              </div>
            ))}
            {(!recentPOs || recentPOs.length === 0) && (
              <div className="p-8 text-center text-gray-500">No purchase orders yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
