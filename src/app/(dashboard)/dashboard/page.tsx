export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, ShoppingCart, FileText, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function BrandDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get brand for this user
  const { data: brand } = await supabase
    .from('brands')
    .select('id, company_name, name, status')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  if (brand.status === 'pending') {
    redirect('/pending')
  }

  // Get stats
  const { count: productsCount } = await supabase
    .from('brand_products')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brand.id)
    .eq('status', 'approved')

  const { count: pendingProductsCount } = await supabase
    .from('brand_products')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brand.id)
    .eq('status', 'pending')

  const { count: posCount } = await supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brand.id)

  const { count: pendingPosCount } = await supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brand.id)
    .eq('status', 'pending')

  const { count: invoicesCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brand.id)

  // Get recent POs
  const { data: recentPOs } = await supabase
    .from('purchase_orders')
    .select('id, po_number, status, total_amount, created_at')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Approved Products', value: productsCount || 0, icon: Package, href: '/products', color: 'bg-green-100 text-green-600' },
    { label: 'Pending Products', value: pendingProductsCount || 0, icon: Clock, href: '/products', color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Purchase Orders', value: posCount || 0, icon: ShoppingCart, href: '/orders', color: 'bg-blue-100 text-blue-600' },
    { label: 'Awaiting Response', value: pendingPosCount || 0, icon: Clock, href: '/orders', color: 'bg-orange-100 text-orange-600' },
    { label: 'Invoices', value: invoicesCount || 0, icon: FileText, href: '/invoices', color: 'bg-purple-100 text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {brand.company_name || brand.name}
        </h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your account</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

      {/* Recent POs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Purchase Orders</h2>
          <Link href="/orders" className="text-sm text-shelfdrop-blue hover:underline">
            View all
          </Link>
        </div>

        {recentPOs && recentPOs.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {recentPOs.map((po) => (
              <Link
                key={po.id}
                href={`/orders/${po.id}`}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{po.po_number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(po.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    £{po.total_amount?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No purchase orders yet. Shelfdrop will send you orders when they're ready.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/products"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <Package className="w-8 h-8 text-shelfdrop-blue mb-3" />
          <h3 className="font-semibold text-gray-900">Add Products</h3>
          <p className="text-sm text-gray-500 mt-1">
            Submit new products for Shelfdrop to sell on your behalf
          </p>
        </Link>

        <Link
          href="/invoices"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <FileText className="w-8 h-8 text-shelfdrop-blue mb-3" />
          <h3 className="font-semibold text-gray-900">Create Invoice</h3>
          <p className="text-sm text-gray-500 mt-1">
            Generate invoices from accepted purchase orders
          </p>
        </Link>
      </div>
    </div>
  )
}
