'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Brand {
  id: string
  company_name: string | null
  name: string | null
  contact_email: string | null
  contact_name: string | null
  website: string | null
  current_channels: string[] | null
  target_channels: string[] | null
  product_categories: string[] | null
  created_at: string
}

interface BrandApprovalListProps {
  brands: Brand[]
}

export default function BrandApprovalList({ brands }: BrandApprovalListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleApprove = async (brandId: string) => {
    setLoading(brandId)

    try {
      const { error } = await supabase
        .from('brands')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', brandId)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      alert(`Failed to approve: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (brandId: string) => {
    setLoading(brandId)

    try {
      const { error } = await supabase
        .from('brands')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', brandId)

      if (error) throw error

      setShowRejectModal(null)
      setRejectionReason('')
      router.refresh()
    } catch (error: any) {
      alert(`Failed to reject: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <>
      <div className="divide-y divide-gray-200">
        {brands.map((brand) => (
          <div key={brand.id} className="p-6">
            <div className="flex items-start justify-between gap-6">
              {/* Brand Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {brand.company_name || brand.name || 'Unnamed Brand'}
                  </h3>
                  {brand.contact_name && (
                    <p className="text-sm text-gray-600">{brand.contact_name}</p>
                  )}
                  <p className="text-sm text-gray-500">{brand.contact_email}</p>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                    {brand.website && (
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-shelfdrop-blue hover:underline"
                      >
                        {brand.website}
                      </a>
                    )}
                    <span>Applied: {formatDate(brand.created_at)}</span>
                  </div>

                  {brand.product_categories && brand.product_categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {brand.product_categories.map((cat, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {brand.target_channels && brand.target_channels.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Target channels: </span>
                      <span className="text-xs text-gray-700">
                        {brand.target_channels.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(brand.id)}
                  disabled={loading === brand.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading === brand.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(brand.id)}
                  disabled={loading === brand.id}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">Reject Brand Application</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to reject this brand application?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={loading === showRejectModal}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading === showRejectModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
