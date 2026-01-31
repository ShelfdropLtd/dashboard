'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface Product {
  id: string
  sku_code: string
  product_name: string
  size: string | null
  wholesale_price: number | null
  unit_cost: number
  status: string
  rejection_reason: string | null
  submitted_at: string | null
  approved_at: string | null
  rejected_at: string | null
}

interface BrandProductsTableProps {
  products: Product[]
}

export default function BrandProductsTable({ products }: BrandProductsTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (productId: string, status: string) => {
    if (status !== 'pending') {
      alert('You can only delete pending products')
      return
    }

    if (!confirm('Are you sure you want to delete this product?')) return

    setDeleting(productId)

    try {
      const { error } = await supabase
        .from('brand_products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        )
      default:
        return null
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Your Price</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Agreed Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="font-medium text-gray-900">{product.product_name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{product.sku_code}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{product.size || '-'}</td>
              <td className="px-6 py-4 text-sm text-gray-600 text-right">
                £{product.wholesale_price?.toFixed(2) || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-right">
                {product.status === 'approved' ? (
                  <span className="font-medium text-gray-900">£{product.unit_cost?.toFixed(2)}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  {getStatusBadge(product.status)}
                  {product.status === 'rejected' && product.rejection_reason && (
                    <div className="flex items-start gap-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{product.rejection_reason}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {formatDate(product.submitted_at)}
              </td>
              <td className="px-6 py-4 text-right">
                {product.status === 'pending' && (
                  <button
                    onClick={() => handleDelete(product.id, product.status)}
                    disabled={deleting === product.id}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting === product.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
