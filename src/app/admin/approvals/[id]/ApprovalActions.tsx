'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ApprovalActionsProps {
  brandId: string
  brandName: string | null
}

const REJECTION_REASONS = [
  'Incomplete application',
  'Missing compliance documentation',
  'Invalid bank details',
  'Products not suitable for our platform',
  'Unable to verify company information',
  'Other',
]

export default function ApprovalActions({ brandId, brandName }: ApprovalActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleApprove = async () => {
    if (!confirm(`Are you sure you want to approve ${brandName}?`)) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('brands')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', brandId)

      if (error) throw error

      router.push('/admin/approvals')
      router.refresh()
    } catch (err) {
      console.error('Error approving brand:', err)
      alert('Failed to approve brand')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    const finalReason = rejectionReason === 'Other' ? customReason : rejectionReason

    if (!finalReason) {
      alert('Please select or enter a rejection reason')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('brands')
        .update({
          status: 'rejected',
          rejection_reason: finalReason,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', brandId)

      if (error) throw error

      router.push('/admin/approvals')
      router.refresh()
    } catch (err) {
      console.error('Error rejecting brand:', err)
      alert('Failed to reject brand')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-yellow-800">This application is pending review</p>
            <p className="text-sm text-yellow-700">Review all details before approving or rejecting</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Approve
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please select a reason for rejecting this application. This will be visible to the applicant.
            </p>

            <div className="space-y-2 mb-4">
              {REJECTION_REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={rejectionReason === reason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="text-brand-accent focus:ring-brand-accent"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>

            {rejectionReason === 'Other' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Please specify
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="Enter rejection reason..."
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || (!rejectionReason || (rejectionReason === 'Other' && !customReason))}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
