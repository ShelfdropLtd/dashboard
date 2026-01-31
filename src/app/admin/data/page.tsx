export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trash2, Users, Building2, ShoppingCart, AlertTriangle } from 'lucide-react'
import DeleteButton from './DeleteButton'

export default async function DataManagementPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get all users (excluding current admin)
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, role, created_at')
    .neq('id', user.id)
    .order('created_at', { ascending: false })

  // Get all brands
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, company_name, onboarding_status, created_at')
    .order('created_at', { ascending: false })

  // Get all orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
        <p className="text-gray-600 mt-1">Delete test data and manage records</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-yellow-800">Warning</h3>
          <p className="text-sm text-yellow-700">
            Deletions are permanent and cannot be undone. Be careful when deleting records.
          </p>
        </div>
      </div>

      {/* Users Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <Users className="w-5 h-5 text-[#F15A2B]" />
          <h2 className="font-semibold text-gray-900">Users ({users?.length || 0})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {!users || users.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">No users to display</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{u.email}</p>
                  <p className="text-sm text-gray-500">
                    {u.role} • Created {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <DeleteButton
                  id={u.id}
                  type="user"
                  name={u.email || 'User'}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Brands/Applications Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-[#F15A2B]" />
          <h2 className="font-semibold text-gray-900">Brands / Applications ({brands?.length || 0})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {!brands || brands.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">No brands to display</p>
          ) : (
            brands.map((brand) => (
              <div key={brand.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {brand.company_name || brand.name || 'Unnamed Brand'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: {brand.onboarding_status || 'draft'} • Created {new Date(brand.created_at).toLocaleDateString()}
                  </p>
                </div>
                <DeleteButton
                  id={brand.id}
                  type="brand"
                  name={brand.company_name || brand.name || 'Brand'}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Orders Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <ShoppingCart className="w-5 h-5 text-[#F15A2B]" />
          <h2 className="font-semibold text-gray-900">Orders ({orders?.length || 0})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {!orders || orders.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">No orders to display</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {order.order_number || `Order ${order.id.slice(0, 8)}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: {order.status} • Created {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <DeleteButton
                  id={order.id}
                  type="order"
                  name={order.order_number || 'Order'}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
