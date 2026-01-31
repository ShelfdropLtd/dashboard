'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, ArrowRight } from 'lucide-react'

interface PricingActionsProps {
  brandId: string
  offerId?: string
  offerPrice?: number | null
  productName?: string
  canProceed?: boolean
  acceptedCount?: number
}

export default function PricingActions({
  brandId,
  offerId,
  offerPrice,
  productName,
  canProceed,
  acceptedCount
}: PricingActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAccept = async () => {
    if (!offerId) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('sku_offers')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', offerId)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Error accepting offer:', err)
      alert('Failed to accept offer')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!offerId) return

    const reason = prompt(`Why are you rejecting the offer for ${productName}? (optional)`)
    setLoading(true)

    try {
      const { error } = await supabase
        .from('sku_offers')
        .update({
          status: 'rejected',
          brand_notes: reason || null,
          responded_at: new Date().toISOString(),
        })
        .eq('id', offerId)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Error rejecting offer:', err)
      alert('Failed to reject offer')
    } finally {
      setLoading(false)
    }
  }

  const handleProceed = async () => {
    if (!confirm(`Proceed to contracts with ${acceptedCount} accepted SKU(s)?`)) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('brands')
        .update({
          onboarding_stage: 'contract_signing',
          pricing_accepted_at: new Date().toISOString(),
        })
        .eq('id', brandId)

      if (error) throw error
      router.push('/onboarding/contracts')
    } catch (err) {
      console.error('Error proceeding:', err)
      alert('Failed to proceed')
    } finally {
      setLoading(false)
    }
  }

  // Proceed button
  if (canProceed) {
    return (
      <button
        onClick={handleProceed}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Proceed to Contracts
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    )
  }

  // Accept/Reject buttons for individual offers
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleAccept}
        disabled={loading}
        className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50 transition-colors"
        title="Accept"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </button>
      <button
        onClick={handleReject}
        disabled={loading}
        className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
        title="Reject"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
