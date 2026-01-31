export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Database, Users, Building2, FileText, ShoppingCart, Package } from 'lucide-react'
import DataManagementActions from './DataManagementActions'

export default async function DataManagementPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get counts for each table
  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: brandsCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })

  const { count: productsCount } = await supabase
    .from('brand_products')
    .select('*', { count: 'exact', head: true })

  const { count: posCount } = await supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })

  const { count: invoicesCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })

  const stats = [
    { label: 'Users/Profiles', count: usersCount || 0, icon: Users, table: 'profiles' },
    { label: 'Brands', count: brandsCount || 0, icon: Building2, table: 'brands' },
    { label: 'Products', count: productsCount || 0, icon: Package, table: 'brand_products' },
    { label: 'Purchase Orders', count: posCount || 0, icon: ShoppingCart, table: 'purchase_orders' },
    { label: 'Invoices', count: invoicesCount || 0, icon: FileText, table: 'invoices' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
        <p className="text-gray-600 mt-1">Manage and clean up test data</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-yellow-800 text-sm">
          <strong>Warning:</strong> Deleting data is permanent and cannot be undone. Use with caution.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.table} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <stat.icon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <DataManagementActions />
    </div>
  )
}
