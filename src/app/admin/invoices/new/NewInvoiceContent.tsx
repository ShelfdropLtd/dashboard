'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Loader2, Plus, Trash2 } from 'lucide-react'

interface Brand {
  id: string
  company_name: string | null
  name: string | null
}

interface Product {
  id: string
  sku_code: string
  product_name: string
  size: string | null
  unit_cost: number
}

interface InvoiceItem {
  product_id: string
  product_name: string
  sku_code: string
  quantity: number
  unit_price: number
}

export default function NewInvoiceContent({ brands }: { brands: Brand[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const brandIdParam = searchParams.get('brand')

  const [loading, setLoading] = useState(false)
  const [brandId, setBrandId] = useState(brandIdParam || '')
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [notes, setNotes] = useState('')

  // Load products when brand changes
  useEffect(() => {
    if (brandId) {
      loadProducts(brandId)
    } else {
      setProducts([])
    }
  }, [brandId])

  const loadProducts = async (id: string) => {
    const { data } = await supabase
      .from('brand_products')
      .select('id, sku_code, product_name, size, unit_cost')
      .eq('brand_id', id)
      .eq('status', 'approved')
      .order('product_name')

    setProducts(data || [])
  }

  const addItem = () => {
    if (products.length === 0) return

    const firstProduct = products[0]
    setItems([
      ...items,
      {
        product_id: firstProduct.id,
        product_name: firstProduct.product_name,
        sku_code: firstProduct.sku_code,
        quantity: 1,
        unit_price: firstProduct.unit_cost,
      },
    ])
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]

    if (field === 'product_id') {
      const product = products.find((p) => p.id === value)
      if (product) {
        newItems[index] = {
          ...newItems[index],
          product_id: value,
          product_name: product.product_name,
          sku_code: product.sku_code,
          unit_price: product.unit_cost,
        }
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }

    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!brandId || items.length === 0) {
      alert('Please select a brand and add at least one item')
      return
    }

    setLoading(true)

    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          brand_id: brandId,
          invoice_number: invoiceNumber,
          status: 'draft',
          total_amount: calculateTotal(),
          notes: notes || null,
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create invoice items
      const invoiceItems = items.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        product_name: item.product_name,
        sku_code: item.sku_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)

      if (itemsError) throw itemsError

      router.push('/admin/invoices')
    } catch (error: any) {
      alert(`Failed to create invoice: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <p className="text-gray-600 mt-1">Create a new invoice for a brand</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Brand *
          </label>
          <select
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value)
              setItems([])
            }}
            required
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
          >
            <option value="">Choose a brand...</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.company_name || brand.name || 'Unnamed'}
              </option>
            ))}
          </select>
        </div>

        {/* Invoice Items */}
        {brandId && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Invoice Items</h2>
              <button
                type="button"
                onClick={addItem}
                disabled={products.length === 0}
                className="px-4 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No approved products for this brand. Add products first.
              </p>
            ) : items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No items added. Click "Add Item" to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="col-span-5">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.product_name} ({product.sku_code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Qty"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Price"
                      />
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      £{(item.quantity * item.unit_price).toFixed(2)}
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <div className="text-right">
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-4 text-xl font-bold text-gray-900">
                      £{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {brandId && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              placeholder="Any additional notes for this invoice..."
            />
          </div>
        )}

        {/* Submit */}
        {brandId && items.length > 0 && (
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
                  <FileText className="w-4 h-4" />
                  Create Invoice
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
