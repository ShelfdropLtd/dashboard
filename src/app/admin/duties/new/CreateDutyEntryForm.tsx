'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Receipt, Calculator, AlertCircle } from 'lucide-react'

interface Brand {
  id: string
  name: string
  company_name: string
}

interface DutyRate {
  id: string
  category: string
  subcategory: string | null
  min_abv: number | null
  max_abv: number | null
  rate_amount: number
  rate_type: string
}

interface InboundShipment {
  id: string
  reference_number: string
  brand_id: string
  brands: { company_name: string } | { company_name: string }[] | null
}

interface Props {
  brands: Brand[]
  dutyRates: DutyRate[]
  inboundShipments: InboundShipment[]
}

const CATEGORIES = [
  { value: 'beer', label: 'Beer' },
  { value: 'cider', label: 'Cider & Perry' },
  { value: 'wine', label: 'Wine' },
  { value: 'spirits', label: 'Spirits' },
  { value: 'rtd', label: 'Ready-to-Drink' },
]

export default function CreateDutyEntryForm({ brands, dutyRates, inboundShipments }: Props) {
  const [brandId, setBrandId] = useState('')
  const [inboundShipmentId, setInboundShipmentId] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [category, setCategory] = useState('')
  const [abv, setAbv] = useState('')
  const [volume, setVolume] = useState('') // in litres
  const [quantity, setQuantity] = useState('')
  const [totalDutyAmount, setTotalDutyAmount] = useState('')
  const [hmrcPaymentRef, setHmrcPaymentRef] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [calculatedDuty, setCalculatedDuty] = useState<number | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Filter shipments by selected brand
  const filteredShipments = inboundShipments.filter(s => !brandId || s.brand_id === brandId)

  // Generate reference number
  useEffect(() => {
    const date = new Date()
    const ref = `DTY-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    setReferenceNumber(ref)
  }, [])

  // When shipment is selected, auto-fill brand
  useEffect(() => {
    if (inboundShipmentId) {
      const shipment = inboundShipments.find(s => s.id === inboundShipmentId)
      if (shipment) {
        setBrandId(shipment.brand_id)
      }
    }
  }, [inboundShipmentId, inboundShipments])

  // Calculate duty based on category, ABV, and volume
  useEffect(() => {
    if (!category || !volume) {
      setCalculatedDuty(null)
      return
    }

    const abvValue = parseFloat(abv) || 0
    const volumeValue = parseFloat(volume) || 0

    // Find matching duty rate
    const matchingRate = dutyRates.find(rate => {
      if (rate.category !== category) return false
      if (rate.min_abv && abvValue < rate.min_abv) return false
      if (rate.max_abv && abvValue > rate.max_abv) return false
      return true
    })

    if (matchingRate) {
      let duty = 0
      if (matchingRate.rate_type === 'per_litre_alcohol') {
        // Duty = (volume * ABV/100) * rate
        duty = (volumeValue * (abvValue / 100)) * matchingRate.rate_amount
      } else if (matchingRate.rate_type === 'per_hectolitre') {
        // Convert litres to hectolitres (divide by 100)
        duty = (volumeValue / 100) * matchingRate.rate_amount
      } else if (matchingRate.rate_type === 'fixed_per_unit') {
        const units = parseInt(quantity) || 1
        duty = units * matchingRate.rate_amount
      }
      setCalculatedDuty(Math.round(duty * 100) / 100)
    } else {
      setCalculatedDuty(null)
    }
  }, [category, abv, volume, quantity, dutyRates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandId || !totalDutyAmount) return

    setLoading(true)

    try {
      // Create the duty entry
      const { data: dutyEntry, error } = await supabase
        .from('duty_entries')
        .insert({
          brand_id: brandId,
          inbound_shipment_id: inboundShipmentId || null,
          reference_number: referenceNumber,
          entry_date: new Date().toISOString().split('T')[0],
          category: category || null,
          abv: parseFloat(abv) || null,
          volume_litres: parseFloat(volume) || null,
          quantity: parseInt(quantity) || null,
          total_duty_amount: parseFloat(totalDutyAmount),
          hmrc_payment_reference: hmrcPaymentRef || null,
          status: 'paid',
          notes: notes || null,
        })
        .select()
        .single()

      if (error) throw error

      // Create a P&L transaction for the duty
      if (dutyEntry) {
        const { error: txError } = await supabase
          .from('brand_transactions')
          .insert({
            brand_id: brandId,
            transaction_date: new Date().toISOString().split('T')[0],
            transaction_type: 'duty',
            amount: parseFloat(totalDutyAmount),
            reference_type: 'duty_entry',
            reference_id: dutyEntry.id,
            description: `Duty: ${referenceNumber} - ${category || 'Alcohol'} (${volume}L @ ${abv}% ABV)`,
            channel: 'all',
          })

        if (txError) {
          console.error('Failed to create P&L transaction:', txError)
          // Don't fail the duty entry creation, just log the error
        }
      }

      router.push('/admin/duties')
      router.refresh()
    } catch (error) {
      console.error('Error creating duty entry:', error)
      alert('Failed to create duty entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Brand & Shipment */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Brand & Shipment</h2>

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
              Link to Inbound Shipment
            </label>
            <select
              value={inboundShipmentId}
              onChange={(e) => setInboundShipmentId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            >
              <option value="">No linked shipment</option>
              {filteredShipments.map((shipment) => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.reference_number}
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
              HMRC Payment Reference
            </label>
            <input
              type="text"
              value={hmrcPaymentRef}
              onChange={(e) => setHmrcPaymentRef(e.target.value)}
              placeholder="Payment ref from HMRC"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Product Details for Calculation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Product Details</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calculator className="w-4 h-4" />
            Used for duty calculation
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ABV %
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={abv}
              onChange={(e) => setAbv(e.target.value)}
              placeholder="e.g., 40"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Volume (Litres)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="e.g., 1000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Units (optional)
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., 1000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>
        </div>

        {calculatedDuty !== null && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900">Calculated Duty (based on configured rates)</span>
            </div>
            <span className="text-xl font-bold text-blue-900">£{calculatedDuty.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Duty Amount */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Duty Amount</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Duty Paid to HMRC *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalDutyAmount}
                onChange={(e) => setTotalDutyAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              />
            </div>
            {calculatedDuty !== null && (
              <button
                type="button"
                onClick={() => setTotalDutyAmount(calculatedDuty.toString())}
                className="mt-2 text-sm text-shelfdrop-blue hover:underline"
              >
                Use calculated amount (£{calculatedDuty.toFixed(2)})
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-900 font-medium">This amount will be charged to the brand</p>
            <p className="text-sm text-amber-700">
              The duty amount entered here will appear on the brand&apos;s P&L as a cost and will be included in their next invoice.
            </p>
          </div>
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
          placeholder="Additional details about this duty entry..."
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
          disabled={loading || !brandId || !totalDutyAmount}
          className="px-6 py-3 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <Receipt className="w-5 h-5" />
              Record Duty Entry
            </>
          )}
        </button>
      </div>
    </form>
  )
}
