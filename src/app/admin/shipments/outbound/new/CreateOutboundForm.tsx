'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Truck } from 'lucide-react'

interface Brand {
  id: string
  name: string
  company_name: string
}

interface Order {
  id: string
  reference_number: string
  brand_id: string
  brands: { company_name: string } | { company_name: string }[] | null
}

const CARRIERS = [
  'DPD',
  'DHL',
  'Royal Mail',
  'Parcelforce',
  'UPS',
  'FedEx',
  'Evri',
  'Yodel',
  'Palletways',
  'Other'
]

const DESTINATION_TYPES = [
  { value: 'customer', label: 'Direct to Customer' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'amazon_fba', label: 'Amazon FBA' },
  { value: 'other', label: 'Other' }
]

export default function CreateOutboundForm({ brands, orders }: { brands: Brand[], orders: Order[] }) {
  const [brandId, setBrandId] = useState('')
  const [purchaseOrderId, setPurchaseOrderId] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [destinationType, setDestinationType] = useState('customer')
  const [destinationName, setDestinationName] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [shippingCost, setShippingCost] = useState('')
  const [handlingFee, setHandlingFee] = useState('')
  const [packagingCost, setPackagingCost] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Filter orders by selected brand
  const filteredOrders = orders.filter(o => !brandId || o.brand_id === brandId)

  // Generate reference number
  useEffect(() => {
    const date = new Date()
    const ref = `OUT-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    setReferenceNumber(ref)
  }, [])

  // When order is selected, auto-fill brand
  useEffect(() => {
    if (purchaseOrderId) {
      const order = orders.find(o => o.id === purchaseOrderId)
      if (order) {
        setBrandId(order.brand_id)
      }
    }
  }, [purchaseOrderId, orders])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandId) return

    setLoading(true)

    try {
      // Create the shipment
      const { data: shipment, error } = await supabase
        .from('outbound_shipments')
        .insert({
          brand_id: brandId,
          purchase_order_id: purchaseOrderId || null,
          reference_number: referenceNumber,
          carrier: carrier,
          tracking_number: trackingNumber || null,
          destination_type: destinationType,
          destination_name: destinationName || null,
          status: 'pending',
          shipping_cost: parseFloat(shippingCost) || 0,
          handling_fee: parseFloat(handlingFee) || 0,
          packaging_cost: parseFloat(packagingCost) || 0,
        })
        .select()
        .single()

      if (error) throw error

      // If there are costs, create a P&L transaction
      const totalCostValue = (parseFloat(shippingCost) || 0) + (parseFloat(handlingFee) || 0) + (parseFloat(packagingCost) || 0)

      if (totalCostValue > 0 && shipment) {
        const { error: txError } = await supabase
          .from('brand_transactions')
          .insert({
            brand_id: brandId,
            transaction_date: new Date().toISOString().split('T')[0],
            transaction_type: 'fulfilment',
            amount: totalCostValue,
            reference_type: 'outbound_shipment',
            reference_id: shipment.id,
            description: `Fulfilment: ${referenceNumber} - ${carrier} to ${destinationType}`,
            channel: destinationType === 'amazon_fba' ? 'amazon' : 'direct',
          })

        if (txError) {
          console.error('Failed to create P&L transaction:', txError)
          // Don't fail the shipment creation, just log the error
        }
      }

      router.push('/admin/shipments')
      router.refresh()
    } catch (error) {
      console.error('Error creating shipment:', error)
      alert('Failed to create shipment')
    } finally {
      setLoading(false)
    }
  }

  const totalCost = (parseFloat(shippingCost) || 0) + (parseFloat(handlingFee) || 0) + (parseFloat(packagingCost) || 0)

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
              Link to Purchase Order
            </label>
            <select
              value={purchaseOrderId}
              onChange={(e) => setPurchaseOrderId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            >
              <option value="">No linked order</option>
              {filteredOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.reference_number}
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
              Carrier *
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            >
              <option value="">Select carrier</option>
              {CARRIERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracking Number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Add when dispatched"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination Type *
            </label>
            <select
              value={destinationType}
              onChange={(e) => setDestinationType(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            >
              {DESTINATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination Name
            </label>
            <input
              type="text"
              value={destinationName}
              onChange={(e) => setDestinationName(e.target.value)}
              placeholder="e.g., Amazon LTN4, John Smith"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Costs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Fulfilment Costs</h2>
        <p className="text-sm text-gray-500 mb-6">These costs will be charged to the brand</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Cost
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Handling Fee
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={handlingFee}
                onChange={(e) => setHandlingFee(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Packaging Cost
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={packagingCost}
                onChange={(e) => setPackagingCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-shelfdrop-yellow/20 rounded-lg flex items-center justify-between">
          <span className="font-medium text-gray-900">Total Cost to Brand</span>
          <span className="text-2xl font-bold text-gray-900">£{totalCost.toFixed(2)}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Special instructions, contents, etc."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
        />
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
          disabled={loading || !brandId || !carrier}
          className="px-6 py-3 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Truck className="w-5 h-5" />
              Create Shipment
            </>
          )}
        </button>
      </div>
    </form>
  )
}
