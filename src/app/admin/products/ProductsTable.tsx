'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, Package, Clock, CheckCircle, XCircle } from 'lucide-react'

interface Product {
  id: string
  sku_code: string
  product_name: string
  size: string | null
  unit_cost: number
  unit_price: number
  wholesale_price: number | null
  status: string
  brands: {
    id: string
    company_name: string | null
    name: string | null
  }
}

interface ProductsTableProps {
  products: Product[]
}

export default function ProductsTable({ products }: ProductsTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (productId: string) => {
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Wholesale</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Agreed</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
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
              <td className="px-6 py-4 text-sm text-gray-600">
                {product.brands?.company_name || product.brands?.name || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{product.size || '-'}</td>
              <td className="px-6 py-4 text-sm text-gray-600 text-right">
                £{product.wholesale_price?.toFixed(2) || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                £{product.unit_cost?.toFixed(2)}
              </td>
              <td className="px-6 py-4">
                {product.status === 'approved' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Approved
                  </span>
                )}
                {product.status === 'pending' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                )}
                {product.status === 'rejected' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                    <XCircle className="w-3 h-3" />
                    Rejected
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => handleDelete(product.id)}
                  disabled={deleting === product.id}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting === product.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
