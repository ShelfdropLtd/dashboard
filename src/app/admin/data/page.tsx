export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Database, Users, Building2, FileText, ShoppingCart, Package, Upload, Download, Truck, Receipt, AlertTriangle, CheckCircle, Clock, RefreshCw, FileSpreadsheet } from 'lucide-react'
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

  const { count: transactionsCount } = await supabase
    .from('brand_transactions')
    .select('*', { count: 'exact', head: true })

  const stats = [
    { label: 'Users', count: usersCount || 0, icon: Users, table: 'profiles' },
    { label: 'Brands', count: brandsCount || 0, icon: Building2, table: 'brands' },
    { label: 'Products', count: productsCount || 0, icon: Package, table: 'brand_products' },
    { label: 'Orders', count: posCount || 0, icon: ShoppingCart, table: 'purchase_orders' },
    { label: 'Transactions', count: transactionsCount || 0, icon: Receipt, table: 'brand_transactions' },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-shelfdrop-blue">Data Management</h1>
        <p className="text-gray-600 mt-1">Import, export, and manage your data</p>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/data/import"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-shelfdrop-green hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-shelfdrop-green transition-colors">
            <Upload className="w-6 h-6 text-green-600 group-hover:text-black" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Import Data</h3>
          <p className="text-sm text-gray-600">
            Add sales, transactions, or inventory data from CSV or manual entry
          </p>
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-shelfdrop-blue hover:shadow-md transition-all group cursor-pointer">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Export Reports</h3>
          <p className="text-sm text-gray-600">
            Download financial reports, transaction history, or inventory data
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-75">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            Auto Sync
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Soon</span>
          </h3>
          <p className="text-sm text-gray-600">
            Connect Amazon, Shopify, or accounting software
          </p>
        </div>
      </div>

      {/* Data Health */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">System Status</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Database</p>
              <p className="text-sm text-green-600">Connected</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-gray-900">Last Import</p>
              <p className="text-sm text-yellow-600">No imports yet</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Database className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Integrations</p>
              <p className="text-sm text-gray-500">Not configured</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning & Actions */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <strong>Warning:</strong> Deleting data is permanent. Use with caution.
        </p>
      </div>

      <DataManagementActions />
    </div>
  )
}
