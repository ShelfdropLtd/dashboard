'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Megaphone } from 'lucide-react'

interface Brand {
  id: string
  company_name: string | null
  name: string | null
}

interface Product {
  id: string
  product_name: string
  sku_code: string
}

export default function CreatePromotionForm({ brands }: { brands: Brand[] }) {
  const [loading, setLoading] = useState(false)
  const [brandId, setBrandId] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [fundingPerUnit, setFundingPerUnit] = useState('')
  const [unitsCommitted, setUnitsCommitted] = useState('')
  const [discountPercentage, setDiscountPercentage] = useState('')
  const [channel, setChannel] = useState('')
  const [notes, setNotes] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (brandId) {
      loadProducts(brandId)
    } else {
      setProducts([])
      setProductId('')
    }
  }, [brandId])

  const loadProducts = async (id: string) => {
    const { data } = await supabase
      .from('brand_products')
      .select('id, product_name, sku_code')
      .eq('brand_id', id)
      .eq('status', 'approved')
      .order('product_name')

    setProducts(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!brandId || !title || !startDate || !endDate) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('promotions')
        .insert({
          brand_id: brandId,
          product_id: productId || null,
          title,
          description: description || null,
          promotion_type: 'admin_created',
          status: 'pending',
          start_date: startDate,
          end_date: endDate,
          funding_per_unit: fundingPerUnit ? parseFloat(fundingPerUnit) : null,
          units_committed: unitsCommitted ? parseInt(unitsCommitted) : null,
          discount_percentage: discountPercentage ? parseFloat(discountPercentage) : null,
          channel: channel || null,
          notes: notes || null,
          created_by: 'admin',
        })

      if (error) throw error

      router.push('/admin/promotions')
    } catch (error: any) {
      alert(`Failed to create promotion: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const channels = ['Amazon', 'Tesco', 'Ocado', 'Shopify D2C', 'All Channels']

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Basic Information</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
          >
            <option value="">Select a brand...</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.company_name || brand.name}
              </option>
            ))}
          </select>
        </div>

        {brandId && products.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product (Optional)</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            >
              <option value="">All products / Brand-wide</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.product_name} ({product.sku_code})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Amazon Prime Day 2024"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Details about the promotion..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
          >
            <option value="">Select channel...</option>
            {channels.map((ch) => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Funding & Commitment</h2>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Funding Per Unit (£)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={fundingPerUnit}
              onChange={(e) => setFundingPerUnit(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Units Committed</label>
            <input
              type="number"
              min="0"
              value={unitsCommitted}
              onChange={(e) => setUnitsCommitted(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>
        </div>

        {fundingPerUnit && unitsCommitted && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Total Funding Required: <span className="font-semibold text-gray-900">
                £{(parseFloat(fundingPerUnit) * parseInt(unitsCommitted)).toFixed(2)}
              </span>
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes for internal reference..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Megaphone className="w-4 h-4" />
              Create Promotion
            </>
          )}
        </button>
      </div>
    </form>
  )
}
