'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

interface Product {
  id: string
  sku_code: string
  product_name: string
  size: string | null
  unit_cost: number
  unit_price: number
}

interface ProductListProps {
  products: Product[]
}

export default function ProductList({ products }: ProductListProps) {
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

  if (products.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No products added yet. Add products above to create POs.
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
          <th className="px-6 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {products.map((product) => (
          <tr key={product.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.sku_code}</td>
            <td className="px-6 py-4 text-sm text-gray-900">{product.product_name}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{product.size || '-'}</td>
            <td className="px-6 py-4 text-sm text-gray-900 text-right">£{product.unit_cost?.toFixed(2)}</td>
            <td className="px-6 py-4 text-sm text-gray-900 text-right">£{product.unit_price?.toFixed(2)}</td>
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
  )
}
