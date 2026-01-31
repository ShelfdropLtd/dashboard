'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, Package, Clock, CheckCircle, XCircle, Pencil, X } from 'lucide-react'

interface Product {
  id: string
  sku_code: string
  product_name: string
  size: string | null
  unit_cost: number
  unit_price: number
  wholesale_price: number | null
  status: string
  brand_id: string
  brands: {
    id: string
    company_name: string | null
    name: string | null
  }
}

interface Brand {
  id: string
  company_name: string | null
  name: string | null
}

interface ProductsTableProps {
  products: Product[]
  brands: Brand[]
}

export default function ProductsTable({ products, brands }: ProductsTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Edit form state
  const [editForm, setEditForm] = useState({
    brand_id: '',
    sku_code: '',
    product_name: '',
    size: '',
    unit_cost: '',
    unit_price: '',
    status: ''
  })

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

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setEditForm({
      brand_id: product.brand_id,
      sku_code: product.sku_code,
      product_name: product.product_name,
      size: product.size || '',
      unit_cost: product.unit_cost?.toString() || '',
      unit_price: product.unit_price?.toString() || '',
      status: product.status || 'pending'
    })
  }

  const handleSave = async () => {
    if (!editingProduct) return

    setSaving(true)

    try {
      const updateData: any = {
        brand_id: editForm.brand_id,
        sku_code: editForm.sku_code,
        product_name: editForm.product_name,
        size: editForm.size || null,
        unit_cost: parseFloat(editForm.unit_cost),
        unit_price: editForm.unit_price ? parseFloat(editForm.unit_price) : null,
        status: editForm.status,
      }

      // Update timestamps based on status change
      if (editForm.status === 'approved' && editingProduct.status !== 'approved') {
        updateData.approved_at = new Date().toISOString()
        updateData.rejected_at = null
        updateData.rejection_reason = null
      } else if (editForm.status === 'rejected' && editingProduct.status !== 'rejected') {
        updateData.rejected_at = new Date().toISOString()
        updateData.approved_at = null
      }

      const { error } = await supabase
        .from('brand_products')
        .update(updateData)
        .eq('id', editingProduct.id)

      if (error) throw error

      setEditingProduct(null)
      router.refresh()
    } catch (error: any) {
      alert(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
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
                  {product.brands?.company_name || product.brands?.name || 'Unknown'}
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
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-1 text-gray-400 hover:text-shelfdrop-blue transition-colors"
                      title="Edit product"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting === product.id}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete product"
                    >
                      {deleting === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">Edit Product</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  value={editForm.brand_id}
                  onChange={(e) => setEditForm({ ...editForm, brand_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.company_name || brand.name || 'Unnamed Brand'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={editForm.sku_code}
                    onChange={(e) => setEditForm({ ...editForm, sku_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <input
                    type="text"
                    value={editForm.size}
                    onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={editForm.product_name}
                  onChange={(e) => setEditForm({ ...editForm, product_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.unit_cost}
                    onChange={(e) => setEditForm({ ...editForm, unit_cost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.unit_price}
                    onChange={(e) => setEditForm({ ...editForm, unit_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
