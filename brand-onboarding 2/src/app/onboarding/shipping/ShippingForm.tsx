'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Truck, Package, Plus, Minus, Loader2, CheckCircle } from 'lucide-react'

interface SkuOffer {
  id: string
  product_name: string
  sku_code: string | null
  ean_barcode: string | null
  units_per_case: number | null
}

interface ShippingFormProps {
  brandId: string
  acceptedOffers: SkuOffer[]
  hasSubmittedPlan: boolean
}

interface LineItem {
  sku_offer_id: string
  product_name: string
  sku_code: string
  ean_barcode: string
  cases_qty: number
  units_per_case: number
}

export default function ShippingForm({ brandId, acceptedOffers, hasSubmittedPlan }: ShippingFormProps) {
  const [loading, setLoading] = useState(false)
  const [planName, setPlanName] = useState('Initial Stock Shipment')
  const [shipFromAddress, setShipFromAddress] = useState('')
  const [shipFromContact, setShipFromContact] = useState('')
  const [shipFromPhone, setShipFromPhone] = useState('')
  const [expectedShipDate, setExpectedShipDate] = useState('')
  const [carrierName, setCarrierName] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>(
    acceptedOffers.map(offer => ({
      sku_offer_id: offer.id,
      product_name: offer.product_name,
      sku_code: offer.sku_code || '',
      ean_barcode: offer.ean_barcode || '',
      cases_qty: 0,
      units_per_case: offer.units_per_case || 6,
    }))
  )

  const router = useRouter()
  const supabase = createClient()

  const updateLineQty = (index: number, qty: number) => {
    const updated = [...lineItems]
    updated[index].cases_qty = Math.max(0, qty)
    setLineItems(updated)
  }

  const totalCases = lineItems.reduce((sum, item) => sum + item.cases_qty, 0)
  const totalUnits = lineItems.reduce((sum, item) => sum + (item.cases_qty * item.units_per_case), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (totalCases === 0) {
      alert('Please add at least one case to your shipment')
      return
    }

    if (!shipFromAddress || !expectedShipDate) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      // Create shipping plan
      const { data: plan, error: planError } = await supabase
        .from('shipping_plans')
        .insert({
          brand_id: brandId,
          plan_name: planName,
          ship_from_address: shipFromAddress,
          ship_from_contact: shipFromContact,
          ship_from_phone: shipFromPhone,
          expected_ship_date: expectedShipDate,
          carrier_name: carrierName || null,
          brand_notes: notes || null,
          total_cases: totalCases,
          total_units: totalUnits,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (planError) throw planError

      // Create line items
      const itemsToInsert = lineItems
        .filter(item => item.cases_qty > 0)
        .map(item => ({
          shipping_plan_id: plan.id,
          sku_offer_id: item.sku_offer_id,
          product_name: item.product_name,
          sku_code: item.sku_code,
          ean_barcode: item.ean_barcode,
          cases_qty: item.cases_qty,
          units_per_case: item.units_per_case,
        }))

      const { error: itemsError } = await supabase
        .from('shipping_plan_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      // Update brand stage
      await supabase
        .from('brands')
        .update({
          onboarding_stage: 'onboarding_complete',
          onboarding_completed_at: new Date().toISOString(),
          status: 'approved',
        })
        .eq('id', brandId)

      router.push('/onboarding/complete')
    } catch (err) {
      console.error('Error creating shipping plan:', err)
      alert('Failed to create shipping plan')
    } finally {
      setLoading(false)
    }
  }

  if (hasSubmittedPlan) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Shipping Plan Submitted!</h3>
            <p className="text-gray-600 mb-4">
              Your shipping plan has been submitted. Once your stock arrives and is processed,
              your onboarding will be complete.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-dark transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-gray-400" />
            Shipping Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipment Name
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ship From Address *
            </label>
            <textarea
              value={shipFromAddress}
              onChange={(e) => setShipFromAddress(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
              placeholder="Full address where stock is being sent from"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={shipFromContact}
                onChange={(e) => setShipFromContact(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={shipFromPhone}
                onChange={(e) => setShipFromPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Ship Date *
              </label>
              <input
                type="date"
                value={expectedShipDate}
                onChange={(e) => setExpectedShipDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carrier / Courier
              </label>
              <input
                type="text"
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                placeholder="e.g. DPD, Palletways"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
              placeholder="Any special instructions or notes"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-400" />
            Products to Ship
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={item.sku_offer_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.product_name}</p>
                  <p className="text-sm text-gray-500">
                    {item.sku_code && `SKU: ${item.sku_code} • `}
                    {item.units_per_case} units per case
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateLineQty(index, item.cases_qty - 1)}
                    className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="text-center">
                    <input
                      type="number"
                      value={item.cases_qty}
                      onChange={(e) => updateLineQty(index, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded"
                      min="0"
                    />
                    <p className="text-xs text-gray-500">cases</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateLineQty(index, item.cases_qty + 1)}
                    className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <div className="text-right w-20">
                    <p className="font-medium text-gray-900">{item.cases_qty * item.units_per_case}</p>
                    <p className="text-xs text-gray-500">units</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t flex justify-end gap-8">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Cases</p>
              <p className="text-2xl font-bold text-gray-900">{totalCases}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Units</p>
              <p className="text-2xl font-bold text-brand-accent">{totalUnits}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <button
        type="submit"
        disabled={loading || totalCases === 0}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Truck className="h-5 w-5" />
            Submit Shipping Plan
          </>
        )}
      </button>
    </form>
  )
}
