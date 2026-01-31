'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'

interface BrandAddProductFormProps {
  brandId: string
}

export default function BrandAddProductForm({ brandId }: BrandAddProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [skuCode, setSkuCode] = useState('')
  const [productName, setProductName] = useState('')
  const [size, setSize] = useState('')
  const [wholesalePrice, setWholesalePrice] = useState('')
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
          wholesale_price: parseFloat(wholesalePrice),
          unit_cost: parseFloat(wholesalePrice), // Initially same, admin can adjust
          status: 'pending',
          submitted_at: new Date().toISOString(),
        })

      if (error) throw error

      // Clear form
      setSkuCode('')
      setProductName('')
      setSize('')
      setWholesalePrice('')

      router.refresh()
    } catch (error: any) {
      alert(`Failed to add product: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU Code *</label>
          <input
            type="text"
            value={skuCode}
            onChange={(e) => setSkuCode(e.target.value)}
            placeholder="e.g. GIN-001"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Premium London Dry Gin"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="e.g. 70cl"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex items-end gap-4">
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price (£) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={wholesalePrice}
            onChange={(e) => setWholesalePrice(e.target.value)}
            placeholder="0.00"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[#F15A2B] text-white rounded-lg hover:bg-[#D14A1F] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Submit for Approval
            </>
          )}
        </button>
      </div>
    </form>
  )
}
