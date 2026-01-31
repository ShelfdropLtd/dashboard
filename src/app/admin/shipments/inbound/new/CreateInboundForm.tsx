'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, Package } from 'lucide-react'

interface Brand {
  id: string
  name: string
  company_name: string
}

interface Product {
  id: string
  name: string
  sku: string
}

interface ShipmentItem {
  productId: string
  quantityExpected: number
  unitCost: number
}

export default function CreateInboundForm({ brands }: { brands: Brand[] }) {
  const [brandId, setBrandId] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [isBonded, setIsBonded] = useState(false)
  const [bondWarehouseRef, setBondWarehouseRef] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ShipmentItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Generate reference number
  useEffect(() => {
    const date = new Date()
    const ref = `IN-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    setReferenceNumber(ref)
  }, [])

  // Load products when brand changes
  useEffect(() => {
    async function loadProducts() {
      if (!brandId) {
        setProducts([])
        setItems([])
        return
      }

      setLoadingProducts(true)
      const { data } = await supabase
        .from('brand_products')
        .select('id, name, sku')
        .eq('brand_id', brandId)
        .eq('status', 'approved')
        .order('name')

      setProducts(data || [])
      setLoadingProducts(false)
    }

    loadProducts()
  }, [brandId, supabase])

  const addItem = () => {
    setItems([...items, { productId: '', quantityExpected: 1, unitCost: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof ShipmentItem, value: string | number) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandId || items.length === 0) return

    setLoading(true)

    try {
      // Create shipment
      const { data: shipment, error: shipmentError } = await supabase
        .from('inbound_shipments')
        .insert({
          brand_id: brandId,
          reference_number: referenceNumber,
          carrier: carrier || null,
          tracking_number: trackingNumber || null,
          expected_date: expectedDate || null,
          is_bonded: isBonded,
          bond_warehouse_ref: isBonded ? bondWarehouseRef : null,
          notes: notes || null,
          status: 'pending',
        })
        .select()
        .single()

      if (shipmentError) throw shipmentError

      // Create shipment items
      const itemsToInsert = items.map((item) => ({
        shipment_id: shipment.id,
        product_id: item.productId,
        quantity_expected: item.quantityExpected,
        unit_cost: item.unitCost || null,
      }))

      const { error: itemsError } = await supabase
        .from('inbound_shipment_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      router.push('/admin/shipments')
      router.refresh()
    } catch (error) {
      console.error('Error creating shipment:', error)
      alert('Failed to create shipment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Shipment Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Shipment Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand *
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.company_name || brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number *
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carrier
            </label>
            <input
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="e.g., DPD, DHL, Palletways"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracking Number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Arrival Date
            </label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBonded}
                onChange={(e) => setIsBonded(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-shelfdrop-green focus:ring-shelfdrop-green"
              />
              <span className="text-sm font-medium text-gray-700">Bonded Stock</span>
            </label>
          </div>

          {isBonded && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bond Warehouse Reference
              </label>
              <input
                type="text"
                value={bondWarehouseRef}
                onChange={(e) => setBondWarehouseRef(e.target.value)}
                placeholder="HMRC bond reference"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Shipment Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Products in Shipment</h2>
          <button
            type="button"
            onClick={addItem}
            disabled={!brandId || loadingProducts}
            className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {!brandId ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Select a brand to add products</p>
          </div>
        ) : loadingProducts ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No products added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    min="1"
                    value={item.quantityExpected}
                    onChange={(e) => updateItem(index, 'quantityExpected', parseInt(e.target.value))}
                    placeholder="Qty"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                  />
                </div>
                <div className="w-32">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitCost || ''}
                      onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value))}
                      placeholder="Cost"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !brandId || items.length === 0}
          className="px-6 py-3 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          Create Shipment
        </button>
      </div>
    </form>
  )
}
