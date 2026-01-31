'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, CheckCircle } from 'lucide-react'

interface Brand {
  id: string
  name: string
  company_name: string
}

const TRANSACTION_TYPES = [
  { value: 'sale', label: 'Sale (Revenue)', isPositive: true },
  { value: 'commission', label: 'Commission', isPositive: false },
  { value: 'fulfilment', label: 'Fulfilment Cost', isPositive: false },
  { value: 'duty', label: 'Duty Charge', isPositive: false },
  { value: 'promotion_funding', label: 'Promotion Funding', isPositive: false },
  { value: 'storage', label: 'Storage Fee', isPositive: false },
  { value: 'refund', label: 'Refund', isPositive: false },
  { value: 'inbound_shipping', label: 'Inbound Shipping', isPositive: false },
  { value: 'adjustment', label: 'Adjustment', isPositive: true },
]

export default function DataImportForm({ brands }: { brands: Brand[] }) {
  const [brandId, setBrandId] = useState('')
  const [transactionType, setTransactionType] = useState('')
  const [amount, setAmount] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const selectedType = TRANSACTION_TYPES.find(t => t.value === transactionType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandId || !transactionType || !amount) return

    setLoading(true)
    setSuccess(false)

    try {
      // Calculate the actual amount (negative for costs)
      const numericAmount = parseFloat(amount)
      const finalAmount = selectedType?.isPositive ? numericAmount : -Math.abs(numericAmount)

      // Get month and year from date
      const date = new Date(transactionDate)
      const periodYear = date.getFullYear()
      const periodMonth = date.getMonth() + 1

      const { error } = await supabase
        .from('brand_transactions')
        .insert({
          brand_id: brandId,
          transaction_type: transactionType,
          transaction_date: transactionDate,
          amount: finalAmount,
          description: description || null,
          reference: reference || null,
          period_year: periodYear,
          period_month: periodMonth,
        })

      if (error) throw error

      setSuccess(true)

      // Reset form
      setAmount('')
      setDescription('')
      setReference('')

      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('Failed to add transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">Transaction added successfully!</p>
        </div>
      )}

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
            Transaction Type *
          </label>
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
          >
            <option value="">Select type</option>
            {TRANSACTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (£) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">£</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>
          {selectedType && (
            <p className={`text-xs mt-1 ${selectedType.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              Will be recorded as {selectedType.isPositive ? 'positive (credit)' : 'negative (debit)'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Amazon UK January sales"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g., Invoice #, Order ID, Report date"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !brandId || !transactionType || !amount}
          className="px-6 py-3 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add Transaction
            </>
          )}
        </button>
      </div>
    </form>
  )
}
