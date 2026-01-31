'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Megaphone, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  product_name: string
  sku_code: string
}

export default function SuggestPromotionPage() {
  const [loading, setLoading] = useState(false)
  const [brandId, setBrandId] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [channel, setChannel] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadBrandAndProducts()
  }, [])

  const loadBrandAndProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (brand) {
      setBrandId(brand.id)

      const { data: prods } = await supabase
        .from('brand_products')
        .select('id, product_name, sku_code')
        .eq('brand_id', brand.id)
        .eq('status', 'approved')
        .order('product_name')

      setProducts(prods || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !startDate || !endDate) {
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
          promotion_type: 'brand_suggested',
          status: 'pending',
          start_date: startDate,
          end_date: endDate,
          channel: channel || null,
          created_by: 'brand',
        })

      if (error) throw error

      router.push('/promotions')
    } catch (error: any) {
      alert(`Failed to submit: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const channels = ['Amazon', 'Tesco', 'Ocado', 'Shopify D2C', 'All Channels']

  return (
    <div className="max-w-2xl">
      <Link
        href="/promotions"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Promotions
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suggest a Promotion</h1>
        <p className="text-gray-600 mt-1">
          Have an idea for a promotional campaign? Submit it here and Shelfdrop will review.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {products.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product (Optional)
              </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Promotion Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Summer Sale - 20% off all Gins"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Describe your promotion idea, target audience, expected outcomes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposed Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposed End Date *
              </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Channel
            </label>
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

        <div className="flex justify-end gap-4">
          <Link
            href="/promotions"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Megaphone className="w-4 h-4" />
                Submit Suggestion
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
