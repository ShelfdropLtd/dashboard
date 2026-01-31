'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Megaphone, Trash2, Loader2, CheckCircle, XCircle, Clock, Calendar, Coins, Package } from 'lucide-react'

interface Promotion {
  id: string
  title: string
  description: string | null
  promotion_type: string
  status: string
  start_date: string
  end_date: string
  funding_per_unit: number | null
  units_committed: number | null
  discount_percentage: number | null
  channel: string | null
  created_by: string | null
  brands: {
    id: string
    company_name: string | null
    name: string | null
  }
  brand_products: {
    id: string
    product_name: string
    sku_code: string
  } | null
}

interface PromotionsTableProps {
  promotions: Promotion[]
}

export default function PromotionsTable({ promotions }: PromotionsTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return

    setDeleting(id)
    try {
      await supabase.from('promotions').delete().eq('id', id)
      router.refresh()
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const handleApprove = async (id: string) => {
    setUpdating(id)
    try {
      await supabase
        .from('promotions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', id)
      router.refresh()
    } catch (error: any) {
      alert(`Failed to approve: ${error.message}`)
    } finally {
      setUpdating(null)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection:')
    if (!reason) return

    setUpdating(id)
    try {
      await supabase
        .from('promotions')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString()
        })
        .eq('id', id)
      router.refresh()
    } catch (error: any) {
      alert(`Failed to reject: ${error.message}`)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: string, type: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      active: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Megaphone },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: CheckCircle },
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 ${badge.bg} ${badge.text} rounded-full text-xs`}>
        <Icon className="w-3 h-3" />
        {status}
        {type === 'brand_suggested' && (
          <span className="ml-1 text-xs opacity-75">(Brand)</span>
        )}
      </span>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotion</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Funding</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {promotions.map((promo) => (
            <tr key={promo.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{promo.title}</p>
                    {promo.brand_products && (
                      <p className="text-sm text-gray-500">{promo.brand_products.product_name}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {promo.brands?.company_name || promo.brands?.name || 'Unknown'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                {promo.funding_per_unit ? (
                  <div className="flex items-center justify-end gap-1">
                    <Coins className="w-4 h-4 text-gray-400" />
                    £{promo.funding_per_unit.toFixed(2)}/unit
                  </div>
                ) : promo.discount_percentage ? (
                  `${promo.discount_percentage}% off`
                ) : '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 text-right">
                {promo.units_committed || '-'}
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(promo.status, promo.promotion_type)}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {promo.promotion_type === 'brand_suggested' && promo.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(promo.id)}
                        disabled={updating === promo.id}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(promo.id)}
                        disabled={updating === promo.id}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(promo.id)}
                    disabled={deleting === promo.id}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    {deleting === promo.id ? (
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
  )
}
