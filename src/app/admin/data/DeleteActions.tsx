'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Users, Building2, FileText, Truck, Loader2 } from 'lucide-react'

interface DeleteActionsProps {
  usersCount: number
  brandsCount: number
  invoicesCount: number
  shipmentsCount: number
}

export default function DeleteActions({
  usersCount,
  brandsCount,
  invoicesCount,
  shipmentsCount,
}: DeleteActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (type: string) => {
    setLoading(type)

    try {
      switch (type) {
        case 'users':
          // Delete profiles (keeps auth.users but removes profile data)
          await supabase.from('profiles').delete().neq('email', 'george@shelfdrop.com')
          break

        case 'brands':
          // Delete related data first
          await supabase.from('sku_offers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('shipping_plan_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('shipping_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          // Delete brands
          await supabase.from('brands').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          break

        case 'invoices':
          await supabase.from('invoice_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          break

        case 'shipments':
          await supabase.from('shipping_plan_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('shipping_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          break

        case 'all':
          // Delete everything except admin
          await supabase.from('sku_offers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('shipping_plan_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('shipping_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('invoice_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('brands').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          await supabase.from('profiles').delete().neq('email', 'george@shelfdrop.com')
          break
      }

      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Some deletions may have failed. Check console for details.')
    } finally {
      setLoading(null)
      setConfirmDelete(null)
    }
  }

  const DeleteCard = ({
    type,
    title,
    count,
    icon: Icon,
    description,
  }: {
    type: string
    title: string
    count: number
    icon: any
    description: string
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{count} records</p>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-3 mb-4">{description}</p>

      {confirmDelete === type ? (
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmDelete(null)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDelete(type)}
            disabled={loading === type}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === type ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Confirm Delete
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(type)}
          className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete All {title}
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DeleteCard
          type="users"
          title="Users"
          count={usersCount}
          icon={Users}
          description="Delete all user profiles (except your admin account)"
        />
        <DeleteCard
          type="brands"
          title="Brands"
          count={brandsCount}
          icon={Building2}
          description="Delete all brands and their related data (offers, contracts, shipments)"
        />
        <DeleteCard
          type="invoices"
          title="Invoices"
          count={invoicesCount}
          icon={FileText}
          description="Delete all invoices and invoice items"
        />
        <DeleteCard
          type="shipments"
          title="Shipments"
          count={shipmentsCount}
          icon={Truck}
          description="Delete all shipping plans and items"
        />
      </div>

      {/* Delete All Button */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="font-semibold text-red-900 mb-2">Nuclear Option</h3>
        <p className="text-sm text-red-700 mb-4">
          Delete ALL test data at once. This will remove all users (except admin), brands, orders, invoices, and shipments.
        </p>

        {confirmDelete === 'all' ? (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(null)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete('all')}
              disabled={loading === 'all'}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading === 'all' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Yes, Delete Everything
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete('all')}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete All Test Data
          </button>
        )}
      </div>
    </div>
  )
}
