'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'

interface Brand {
  id: string
  company_name: string | null
  name: string | null
}

interface AdminAddProductFormProps {
  brands: Brand[]
}

export default function AdminAddProductForm({ brands }: AdminAddProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [brandId, setBrandId] = useState('')
  const [skuCode, setSkuCode] = useState('')
  const [productName, setProductName] = useState('')
  const [size, setSize] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!brandId) {
      alert('Please select a brand')
      return
    }

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
          unit_price: unitPrice ? parseFloat(unitPrice) : null,
          wholesale_price: parseFloat(unitCost),
          status: 'approved', // Admin-added products are auto-approved
          approved_at: new Date().toISOString(),
        })

      if (error) throw error

      // Clear form
      setBrandId('')
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
          >
            <option value="">Select a brand...</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.company_name || brand.name || 'Unnamed Brand'}
              </option>
            ))}
          </select>
        </div>
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
        <div className="w-36">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (£) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            placeholder="0.00"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
          />
        </div>
        <div className="w-36">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price (£)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="0.00"
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
              Add Product
            </>
          )}
        </button>
      </div>
    </form>
  )
}
