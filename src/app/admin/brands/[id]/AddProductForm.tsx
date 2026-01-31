'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'

interface AddProductFormProps {
  brandId: string
}

export default function AddProductForm({ brandId }: AddProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [skuCode, setSkuCode] = useState('')
  const [productName, setProductName] = useState('')
  const [size, setSize] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('brand_products')
        .insert({
          brand_id: brandId,
          sku_code: skuCode,
          product_name: productName,
          size: size || null,
          unit_cost: parseFloat(unitCost),
          unit_price: parseFloat(unitPrice),
        })

      if (error) throw error

      // Clear form
      setSkuCode('')
      setProductName('')
      setSize('')
      setUnitCost('')
      setUnitPrice('')

      router.refresh()
    } catch (error: any) {
      alert(`Failed to add product: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-6 gap-3">
      <input
        type="text"
        value={skuCode}
        onChange={(e) => setSkuCode(e.target.value)}
        placeholder="SKU Code"
        required
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
      />
      <input
        type="text"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        placeholder="Product Name"
        required
        className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
      />
      <input
        type="text"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        placeholder="Size (e.g. 70cl)"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
      />
      <input
        type="number"
        step="0.01"
        value={unitCost}
        onChange={(e) => setUnitCost(e.target.value)}
        placeholder="Cost (£)"
        required
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-[#F15A2B] text-white rounded-lg hover:bg-[#D14A1F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Add
          </>
        )}
      </button>
    </form>
  )
}
