'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2 } from 'lucide-react'

interface POActionsProps {
  poId: string
}

export default function POActions({ poId }: POActionsProps) {
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'accept' | 'reject' | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleAccept = async () => {
    setLoading(true)
    setAction('accept')

    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', poId)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      alert(`Failed to accept: ${error.message}`)
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setLoading(true)
    setAction('reject')

    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectReason
        })
        .eq('id', poId)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      alert(`Failed to reject: ${error.message}`)
    } finally {
      setLoading(false)
      setAction(null)
      setShowReject(false)
    }
  }

  if (showReject) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4">Reject Purchase Order</h3>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Please explain why you're rejecting this PO..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={() => setShowReject(false)}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={loading || !rejectReason.trim()}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && action === 'reject' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
            Confirm Rejection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-2">Respond to Purchase Order</h3>
      <p className="text-gray-600 mb-4">Accept this PO to proceed with fulfillment and create an invoice.</p>
      <div className="flex gap-3">
        <button
          onClick={() => setShowReject(true)}
          disabled={loading}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Reject
        </button>
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && action === 'accept' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Accept PO
        </button>
      </div>
    </div>
  )
}
