'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X } from 'lucide-react'

interface PricingActionsProps {
  brandId: string
  offerIds: string[]
}

export default function PricingActions({ brandId, offerIds }: PricingActionsProps) {
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'accept' | 'reject' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAccept = async () => {
    setLoading(true)
    setAction('accept')

    try {
      // Update all offers to accepted
      await supabase
        .from('sku_offers')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .in('id', offerIds)

      // Update brand status
      await supabase
        .from('brands')
        .update({ onboarding_status: 'pricing_accepted' })
        .eq('id', brandId)

      router.push('/onboarding/contracts')
    } catch (error) {
      console.error('Error accepting pricing:', error)
      setLoading(false)
      setAction(null)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    setAction('reject')

    try {
      // Update all offers to rejected
      await supabase
        .from('sku_offers')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .in('id', offerIds)

      // Update brand status back to pricing_review for re-negotiation
      await supabase
        .from('brands')
        .update({ onboarding_status: 'pricing_review' })
        .eq('id', brandId)

      router.refresh()
    } catch (error) {
      console.error('Error rejecting pricing:', error)
      setLoading(false)
      setAction(null)
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleReject}
        disabled={loading}
        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading && action === 'reject' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <X className="w-4 h-4" />
        )}
        Request Changes
      </button>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="px-6 py-3 bg-[#F15A2B] text-white rounded-xl hover:bg-[#D14A1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading && action === 'accept' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        Accept Pricing
      </button>
    </div>
  )
}
