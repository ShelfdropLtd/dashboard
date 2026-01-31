'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, X } from 'lucide-react'

interface DeleteButtonProps {
  id: string
  type: 'user' | 'brand' | 'order'
  name: string
}

export default function DeleteButton({ id, type, name }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)

    try {
      let error = null

      switch (type) {
        case 'user':
          // Delete profile (user auth record stays but profile is removed)
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id)
          error = profileError

          // Also delete any brands associated with this user
          await supabase
            .from('brands')
            .delete()
            .eq('user_id', id)
          break

        case 'brand':
          // Delete related records first
          await supabase.from('sku_offers').delete().eq('brand_id', id)
          await supabase.from('contracts').delete().eq('brand_id', id)
          await supabase.from('shipping_plans').delete().eq('brand_id', id)

          // Delete the brand
          const { error: brandError } = await supabase
            .from('brands')
            .delete()
            .eq('id', id)
          error = brandError
          break

        case 'order':
          // Delete order items first
          await supabase.from('order_items').delete().eq('order_id', id)

          // Delete the order
          const { error: orderError } = await supabase
            .from('orders')
            .delete()
            .eq('id', id)
          error = orderError
          break
      }

      if (error) {
        console.error('Delete error:', error)
        alert(`Failed to delete: ${error.message}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete. Check console for details.')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600">Delete {name}?</span>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
