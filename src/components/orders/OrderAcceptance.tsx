'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { CheckCircle, XCircle, MessageCircle, Loader2 } from 'lucide-react'

interface OrderAcceptanceProps {
  orderId: string
  currentStatus: string
  rejectionReason?: string | null
  brandComment?: string | null
  adminReply?: string | null
}

const REJECTION_REASONS = [
  { value: 'pricing_incorrect', label: 'Pricing incorrect' },
  { value: 'product_unavailable', label: 'Product unavailable' },
  { value: 'quantity_too_high', label: 'Quantity too high' },
  { value: 'quantity_too_low', label: 'Quantity too low' },
  { value: 'lead_time_too_short', label: 'Lead time too short' },
  { value: 'duplicate_order', label: 'Duplicate order' },
  { value: 'other', label: 'Other' },
]

export default function OrderAcceptance({ orderId, currentStatus, rejectionReason, brandComment, adminReply }: OrderAcceptanceProps) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showQueryForm, setShowQueryForm] = useState(false)
  const [showAcceptForm, setShowAcceptForm] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAccept = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.from('orders').update({ acceptance_status: 'accepted', brand_comment: comment || null }).eq('id', orderId)
    if (updateError) { setError(updateError.message); setLoading(false); return }
    router.refresh()
    setShowAcceptForm(false)
    setLoading(false)
  }

  const handleReject = async () => {
    if (!selectedReason) { setError('Please select a reason'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.from('orders').update({ acceptance_status: 'rejected', rejection_reason: selectedReason, brand_comment: comment || null }).eq('id', orderId)
    if (updateError) { setError(updateError.message); setLoading(false); return }
    router.refresh()
    setShowRejectForm(false)
    setLoading(false)
  }

  const handleQuery = async () => {
    if (!comment.trim()) { setError('Please enter your question or comment'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.from('orders').update({ acceptance_status: 'query', brand_comment: comment }).eq('id', orderId)
    if (updateError) { setError(updateError.message); setLoading(false); return }
    router.refresh()
    setShowQueryForm(false)
    setLoading(false)
  }

  if (currentStatus !== 'pending_review') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Your response:</span>
          {currentStatus === 'accepted' && <span className="inline-flex items-center gap-1 text-green-700 font-medium"><CheckCircle className="h-4 w-4" /> Accepted</span>}
          {currentStatus === 'rejected' && <span className="inline-flex items-center gap-1 text-red-700 font-medium"><XCircle className="h-4 w-4" /> Rejected</span>}
          {currentStatus === 'query' && <span className="inline-flex items-center gap-1 text-yellow-700 font-medium"><MessageCircle className="h-4 w-4" /> Query raised</span>}
        </div>
        {rejectionReason && <div><span className="text-sm text-gray-500">Reason: </span><span className="text-sm font-medium">{REJECTION_REASONS.find(r => r.value === rejectionReason)?.label || rejectionReason}</span></div>}
        {brandComment && <div className="bg-gray-50 p-3 rounded-lg"><span className="text-xs text-gray-500 block mb-1">Your comment:</span><p className="text-sm text-gray-700">{brandComment}</p></div>}
        {adminReply && <div className="bg-indigo-50 p-3 rounded-lg"><span className="text-xs text-indigo-600 block mb-1">Shelfdrop reply:</span><p className="text-sm text-gray-700">{adminReply}</p></div>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Please review this order and respond:</p>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>}
      
      {!showRejectForm && !showQueryForm && !showAcceptForm && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowAcceptForm(true)} className="bg-green-600 hover:bg-green-700"><CheckCircle className="h-4 w-4 mr-2" />Accept Order</Button>
          <Button onClick={() => setShowRejectForm(true)} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50"><XCircle className="h-4 w-4 mr-2" />Reject Order</Button>
          <Button onClick={() => setShowQueryForm(true)} variant="outline"><MessageCircle className="h-4 w-4 mr-2" />Raise Query</Button>
        </div>
      )}

      {showAcceptForm && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-green-800">Accept Order</h4>
          <div><label className="block text-sm text-gray-700 mb-1">Comment (optional)</label><textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows={3} placeholder="Add any notes for Shelfdrop..." /></div>
          <div className="flex gap-2"><Button onClick={handleAccept} disabled={loading} className="bg-green-600 hover:bg-green-700">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Accept'}</Button><Button variant="outline" onClick={() => { setShowAcceptForm(false); setComment(''); }}>Cancel</Button></div>
        </div>
      )}

      {showRejectForm && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-red-800">Reject Order</h4>
          <div><label className="block text-sm text-gray-700 mb-1">Reason for rejection *</label><select value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"><option value="">Select a reason...</option>{REJECTION_REASONS.map((reason) => (<option key={reason.value} value={reason.value}>{reason.label}</option>))}</select></div>
          <div><label className="block text-sm text-gray-700 mb-1">Additional comments (optional)</label><textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows={3} placeholder="Provide more details..." /></div>
          <div className="flex gap-2"><Button onClick={handleReject} disabled={loading} className="bg-red-600 hover:bg-red-700">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Reject'}</Button><Button variant="outline" onClick={() => { setShowRejectForm(false); setSelectedReason(''); setComment(''); }}>Cancel</Button></div>
        </div>
      )}

      {showQueryForm && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-yellow-800">Raise a Query</h4>
          <div><label className="block text-sm text-gray-700 mb-1">Your question or comment *</label><textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows={3} placeholder="What would you like to know or clarify?" /></div>
          <div className="flex gap-2"><Button onClick={handleQuery} disabled={loading} className="bg-yellow-600 hover:bg-yellow-700">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Query'}</Button><Button variant="outline" onClick={() => { setShowQueryForm(false); setComment(''); }}>Cancel</Button></div>
        </div>
      )}
    </div>
  )
}
