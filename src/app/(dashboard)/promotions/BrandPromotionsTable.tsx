'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Megaphone, CheckCircle, XCircle, Clock, Calendar, Coins, Loader2 } from 'lucide-react'

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
  rejection_reason: string | null
  brand_products: {
    id: string
    product_name: string
    sku_code: string
  } | null
}

export default function BrandPromotionsTable({ promotions }: { promotions: Promotion[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAccept = async (id: string) => {
    setLoading(id)
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
      alert(`Failed: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Why are you declining this promotion?')
    if (!reason) return

    setLoading(id)
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
      alert(`Failed: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  const getStatusBadge = (status: string, type: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      approved: { bg: 'bg-green-100', text: 'text-green-700' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700' },
      active: { bg: 'bg-blue-100', text: 'text-blue-700' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700' },
    }
    const badge = badges[status] || badges.pending

    let label = status
    if (type === 'brand_suggested' && status === 'pending') {
      label = 'Awaiting Shelfdrop'
    } else if (type === 'admin_created' && status === 'pending') {
      label = 'Action Required'
    }

    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} rounded-full text-xs font-medium`}>
        {label}
      </span>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Separate pending from admin vs other
  const pendingFromAdmin = promotions.filter(p =>
    p.promotion_type === 'admin_created' && p.status === 'pending'
  )
  const otherPromotions = promotions.filter(p =>
    !(p.promotion_type === 'admin_created' && p.status === 'pending')
  )

  return (
    <div className="space-y-6">
      {/* Action Required */}
      {pendingFromAdmin.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-yellow-200 overflow-hidden">
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <h2 className="font-semibold text-yellow-800 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Action Required ({pendingFromAdmin.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingFromAdmin.map((promo) => (
              <div key={promo.id} className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Megaphone className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{promo.title}</h3>
                        {promo.description && (
                          <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
                          </span>
                          {promo.funding_per_unit && (
                            <span className="flex items-center gap-1">
                              <Coins className="w-4 h-4 text-gray-400" />
                              £{promo.funding_per_unit}/unit
                            </span>
                          )}
                          {promo.units_committed && (
                            <span>{promo.units_committed} units</span>
                          )}
                          {promo.channel && (
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                              {promo.channel}
                            </span>
                          )}
                        </div>
                        {promo.funding_per_unit && promo.units_committed && (
                          <p className="text-sm font-medium text-gray-900 mt-2">
                            Total Funding: £{(promo.funding_per_unit * promo.units_committed).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAccept(promo.id)}
                      disabled={loading === promo.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading === promo.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(promo.id)}
                      disabled={loading === promo.id}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Promotions */}
      {otherPromotions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">All Promotions</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {otherPromotions.map((promo) => (
              <div key={promo.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{promo.title}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(promo.start_date)} - {formatDate(promo.end_date)}
                      {promo.promotion_type === 'brand_suggested' && (
                        <span className="ml-2 text-blue-600">(Your suggestion)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(promo.status, promo.promotion_type)}
                  {promo.rejection_reason && (
                    <p className="text-xs text-red-600 mt-1">{promo.rejection_reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
