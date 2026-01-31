'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Package, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Product {
  id: string
  sku_code: string
  product_name: string
  size: string | null
  wholesale_price: number | null
  unit_cost: number
  submitted_at: string | null
  brands: {
    id: string
    company_name: string | null
    name: string | null
  }
}

interface ProductApprovalListProps {
  products: Product[]
}

export default function ProductApprovalList({ products }: ProductApprovalListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleApprove = async (productId: string, wholesalePrice: number) => {
    const agreedPrice = prices[productId] ? parseFloat(prices[productId]) : wholesalePrice

    if (isNaN(agreedPrice) || agreedPrice <= 0) {
      alert('Please enter a valid price')
      return
    }

    setLoading(productId)

    try {
      const { error } = await supabase
        .from('brand_products')
        .update({
          status: 'approved',
          unit_cost: agreedPrice,
          approved_at: new Date().toISOString(),
        })
        .eq('id', productId)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      alert(`Failed to approve: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (productId: string) => {
    const reason = rejectionReasons[productId]

    if (!reason?.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setLoading(productId)

    try {
      const { error } = await supabase
        .from('brand_products')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', productId)

      if (error) throw error

      setShowRejectModal(null)
      router.refresh()
    } catch (error: any) {
      alert(`Failed to reject: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <>
      <div className="divide-y divide-gray-200">
        {products.map((product) => (
          <div key={product.id} className="p-6">
            <div className="flex items-start justify-between gap-6">
              {/* Product Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product.product_name}</h3>
                  <p className="text-sm text-gray-500">
                    {product.brands?.company_name || product.brands?.name}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>SKU: {product.sku_code}</span>
                    {product.size && <span>Size: {product.size}</span>}
                    <span>Submitted: {formatDate(product.submitted_at)}</span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="w-64 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Brand's Price:</span>
                  <span className="font-medium text-gray-900">
                    £{product.wholesale_price?.toFixed(2) || product.unit_cost?.toFixed(2)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Agreed Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={prices[product.id] ?? product.wholesale_price ?? product.unit_cost}
                    onChange={(e) => setPrices({ ...prices, [product.id]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(product.id, product.wholesale_price || product.unit_cost)}
                  disabled={loading === product.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading === product.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(product.id)}
                  disabled={loading === product.id}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">Reject Product</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectionReasons[showRejectModal] || ''}
                onChange={(e) => setRejectionReasons({ ...rejectionReasons, [showRejectModal]: e.target.value })}
                placeholder="e.g. Price too high, need more product details..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={loading === showRejectModal}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading === showRejectModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
