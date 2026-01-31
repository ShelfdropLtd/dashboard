'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

export default function DataManagementActions() {
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const deleteTable = async (table: string, displayName: string) => {
    if (confirmDelete !== table) {
      setConfirmDelete(table)
      return
    }

    setLoading(table)

    try {
      // For profiles, we need special handling
      if (table === 'profiles') {
        // Delete all non-admin profiles
        const { error } = await supabase
          .from('profiles')
          .delete()
          .neq('email', 'george@shelfdrop.com')

        if (error) throw error
      } else if (table === 'brands') {
        // Delete brands (this will cascade to brand_products, POs, invoices)
        const { error } = await supabase
          .from('brands')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Just to ensure we have a valid query

        if (error) throw error
      } else if (table === 'brand_products') {
        const { error } = await supabase
          .from('brand_products')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (error) throw error
      } else if (table === 'purchase_orders') {
        // Delete PO items first, then POs
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (itemsError) throw itemsError

        const { error } = await supabase
          .from('purchase_orders')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (error) throw error
      } else if (table === 'invoices') {
        // Delete invoice items first, then invoices
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (itemsError) throw itemsError

        const { error } = await supabase
          .from('invoices')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (error) throw error
      }

      setConfirmDelete(null)
      router.refresh()
    } catch (error: any) {
      alert(`Failed to delete ${displayName}: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  const deleteAll = async () => {
    if (confirmDelete !== 'all') {
      setConfirmDelete('all')
      return
    }

    setLoading('all')

    try {
      // Delete in order of dependencies
      // 1. Invoice items
      await supabase.from('invoice_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // 2. Invoices
      await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // 3. PO items
      await supabase.from('purchase_order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // 4. POs
      await supabase.from('purchase_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // 5. Brand products
      await supabase.from('brand_products').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // 6. Brands
      await supabase.from('brands').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // 7. Profiles (except admin)
      await supabase.from('profiles').delete().neq('email', 'george@shelfdrop.com')

      setConfirmDelete(null)
      router.refresh()
    } catch (error: any) {
      alert(`Failed to delete all data: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  const actions = [
    { table: 'profiles', label: 'Delete All Users', description: 'Remove all user profiles (except admin)' },
    { table: 'brands', label: 'Delete All Brands', description: 'Remove all brands and their data' },
    { table: 'brand_products', label: 'Delete All Products', description: 'Remove all brand products' },
    { table: 'purchase_orders', label: 'Delete All POs', description: 'Remove all purchase orders' },
    { table: 'invoices', label: 'Delete All Invoices', description: 'Remove all invoices' },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Delete Individual Tables</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {actions.map((action) => (
            <div key={action.table} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{action.label}</p>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
              <button
                onClick={() => deleteTable(action.table, action.label)}
                disabled={loading === action.table}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  confirmDelete === action.table
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border border-red-300 text-red-600 hover:bg-red-50'
                }`}
              >
                {loading === action.table ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {confirmDelete === action.table ? 'Click to Confirm' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Delete All */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Nuclear Option</h3>
            <p className="text-sm text-red-700 mt-1">
              Delete ALL data from the database (except your admin account). This will wipe everything clean.
            </p>
            <button
              onClick={deleteAll}
              disabled={loading === 'all'}
              className={`mt-4 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                confirmDelete === 'all'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {loading === 'all' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {confirmDelete === 'all' ? 'Click Again to Confirm DELETE ALL' : 'Delete Everything'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
