'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, FileText } from 'lucide-react'

interface Product {
  id: string
  sku_code: string
  product_name: string
  size: string | null
  unit_cost: number
  unit_price: number
}

interface POItem {
  productId: string
  quantity: number
}

interface CreatePOFormProps {
  brandId: string
  products: Product[]
}

export default function CreatePOForm({ brandId, products }: CreatePOFormProps) {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<POItem[]>([{ productId: '', quantity: 1 }])
  const router = useRouter()
  const supabase = createClient()

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof POItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId)
  }

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const product = getProduct(item.productId)
      if (product && item.quantity > 0) {
        return total + (product.unit_cost * item.quantity)
      }
      return total
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate items
    const validItems = items.filter(item => item.productId && item.quantity > 0)
    if (validItems.length === 0) {
      alert('Please add at least one item to the PO')
      return
    }

    setLoading(true)

    try {
      // Generate PO number
      const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`

      // Create PO
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          brand_id: brandId,
          po_number: poNumber,
          status: 'pending',
          total_amount: calculateTotal(),
          notes: notes || null,
        })
        .select()
        .single()

      if (poError) throw poError

      // Create PO items
      const poItems = validItems.map(item => {
        const product = getProduct(item.productId)!
        return {
          purchase_order_id: po.id,
          brand_product_id: item.productId,
          sku_code: product.sku_code,
          product_name: product.product_name,
          quantity: item.quantity,
          unit_cost: product.unit_cost,
          total_cost: product.unit_cost * item.quantity,
        }
      })

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItems)

      if (itemsError) throw itemsError

      router.push(`/admin/brands/${brandId}`)
      router.refresh()
    } catch (error: any) {
      alert(`Failed to create PO: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
          <p className="text-sm text-gray-500 mt-1">Select products and quantities</p>
        </div>

        <div className="p-6 space-y-4">
          {items.map((item, index) => {
            const product = getProduct(item.productId)
            const lineTotal = product ? product.unit_cost * item.quantity : 0

            return (
              <div key={index} className="flex gap-4 items-start">
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(index, 'productId', e.target.value)}
                  required
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                >
                  <option value="">Select product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku_code} - {product.product_name} {product.size ? `(${product.size})` : ''} - £{product.unit_cost.toFixed(2)}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  required
                  className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                  placeholder="Qty"
                />

                <div className="w-28 py-3 text-right font-medium">
                  £{lineTotal.toFixed(2)}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="p-3 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )
          })}

          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 text-shelfdrop-blue hover:text-[#D14A1F] text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Another Item
          </button>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total</span>
            <span>£{calculateTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any special instructions or notes..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
        />
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          Create Purchase Order
        </button>
      </div>
    </form>
  )
}
