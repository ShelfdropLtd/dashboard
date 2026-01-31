'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Save, X, AlertCircle } from 'lucide-react'

interface DutyRate {
  id: string
  category: string
  subcategory: string | null
  min_abv: number | null
  max_abv: number | null
  rate_amount: number
  rate_type: string
  effective_from: string
  effective_to: string | null
}

interface Props {
  initialRates: DutyRate[]
}

const CATEGORIES = [
  { value: 'beer', label: 'Beer' },
  { value: 'cider', label: 'Cider & Perry' },
  { value: 'wine', label: 'Wine' },
  { value: 'spirits', label: 'Spirits' },
  { value: 'rtd', label: 'Ready-to-Drink' },
]

const RATE_TYPES = [
  { value: 'per_litre_alcohol', label: 'Per litre of pure alcohol' },
  { value: 'per_hectolitre', label: 'Per hectolitre of product' },
  { value: 'fixed_per_unit', label: 'Fixed per unit' },
]

export default function DutyRatesManager({ initialRates }: Props) {
  const [rates, setRates] = useState<DutyRate[]>(initialRates)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    category: 'beer',
    subcategory: '',
    min_abv: '',
    max_abv: '',
    rate_amount: '',
    rate_type: 'per_litre_alcohol',
    effective_from: new Date().toISOString().split('T')[0],
  })

  const resetForm = () => {
    setFormData({
      category: 'beer',
      subcategory: '',
      min_abv: '',
      max_abv: '',
      rate_amount: '',
      rate_type: 'per_litre_alcohol',
      effective_from: new Date().toISOString().split('T')[0],
    })
    setEditingId(null)
    setIsAdding(false)
    setError(null)
  }

  const startEdit = (rate: DutyRate) => {
    setFormData({
      category: rate.category,
      subcategory: rate.subcategory || '',
      min_abv: rate.min_abv?.toString() || '',
      max_abv: rate.max_abv?.toString() || '',
      rate_amount: rate.rate_amount.toString(),
      rate_type: rate.rate_type,
      effective_from: rate.effective_from,
    })
    setEditingId(rate.id)
    setIsAdding(false)
  }

  const handleSave = async () => {
    if (!formData.rate_amount || parseFloat(formData.rate_amount) <= 0) {
      setError('Please enter a valid rate amount')
      return
    }

    setLoading(true)
    setError(null)

    const rateData = {
      category: formData.category,
      subcategory: formData.subcategory || null,
      min_abv: formData.min_abv ? parseFloat(formData.min_abv) : null,
      max_abv: formData.max_abv ? parseFloat(formData.max_abv) : null,
      rate_amount: parseFloat(formData.rate_amount),
      rate_type: formData.rate_type,
      effective_from: formData.effective_from,
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('duty_rates')
          .update(rateData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('duty_rates')
          .insert([rateData])

        if (error) throw error
      }

      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save rate')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rate?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('duty_rates')
        .delete()
        .eq('id', id)

      if (error) throw error
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to delete rate')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    const colors: Record<string, string> = {
      beer: 'bg-amber-100 text-amber-700',
      cider: 'bg-orange-100 text-orange-700',
      wine: 'bg-purple-100 text-purple-700',
      spirits: 'bg-blue-100 text-blue-700',
      rtd: 'bg-pink-100 text-pink-700',
    }
    return colors[category] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Duty Rate' : 'Add New Duty Rate'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <input
                type="text"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                placeholder="e.g., still, sparkling"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate Type *
              </label>
              <select
                value={formData.rate_type}
                onChange={(e) => setFormData({ ...formData, rate_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              >
                {RATE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min ABV %
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.min_abv}
                onChange={(e) => setFormData({ ...formData, min_abv: e.target.value })}
                placeholder="e.g., 1.2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max ABV %
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.max_abv}
                onChange={(e) => setFormData({ ...formData, max_abv: e.target.value })}
                placeholder="e.g., 8.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate Amount (£) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.rate_amount}
                onChange={(e) => setFormData({ ...formData, rate_amount: e.target.value })}
                placeholder="e.g., 28.74"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective From *
              </label>
              <input
                type="date"
                value={formData.effective_from}
                onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Rate'}
            </button>
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rates Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Configured Duty Rates</h2>
          {!isAdding && !editingId && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-blue text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Rate
            </button>
          )}
        </div>

        {rates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-4">No duty rates configured yet</p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Rate
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    ABV Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Effective
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getCategoryIcon(rate.category)}`}>
                          {rate.category}
                        </span>
                        {rate.subcategory && (
                          <span className="text-sm text-gray-500">{rate.subcategory}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {rate.min_abv && rate.max_abv
                        ? `${rate.min_abv}% - ${rate.max_abv}%`
                        : rate.min_abv
                        ? `>${rate.min_abv}%`
                        : rate.max_abv
                        ? `<${rate.max_abv}%`
                        : 'All ABV'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-semibold text-gray-900">
                        £{rate.rate_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {rate.rate_type === 'per_litre_alcohol' && 'Per L alcohol'}
                      {rate.rate_type === 'per_hectolitre' && 'Per hectolitre'}
                      {rate.rate_type === 'fixed_per_unit' && 'Per unit'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(rate.effective_from).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(rate)}
                          className="p-2 text-gray-400 hover:text-shelfdrop-blue transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rate.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-blue-900 mb-2">UK Alcohol Duty Rates</h4>
        <p className="text-sm text-blue-700 mb-2">
          These rates are used to calculate duty when releasing stock from bond. Make sure to update rates when HMRC announces changes.
        </p>
        <p className="text-sm text-blue-600">
          Current rates effective from August 2024. Last HMRC update applied.
        </p>
      </div>
    </div>
  )
}
