'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PenTool, Loader2, ArrowRight } from 'lucide-react'

interface ContractActionsProps {
  brandId: string
  contractId?: string
  contractTitle?: string
  canProceed?: boolean
}

export default function ContractActions({
  brandId,
  contractId,
  contractTitle,
  canProceed
}: ContractActionsProps) {
  const [loading, setLoading] = useState(false)
  const [showSignModal, setShowSignModal] = useState(false)
  const [signatureName, setSignatureName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSign = async () => {
    if (!contractId || !signatureName || !agreed) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          signed_by: signatureName,
        })
        .eq('id', contractId)

      if (error) throw error

      setShowSignModal(false)
      router.refresh()
    } catch (err) {
      console.error('Error signing contract:', err)
      alert('Failed to sign contract')
    } finally {
      setLoading(false)
    }
  }

  const handleProceed = async () => {
    if (!confirm('Proceed to set up your first shipment?')) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('brands')
        .update({
          onboarding_stage: 'shipping_setup',
          contract_signed_at: new Date().toISOString(),
        })
        .eq('id', brandId)

      if (error) throw error
      router.push('/onboarding/shipping')
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
            Set Up Shipping
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    )
  }

  // Sign button
  return (
    <>
      <button
        onClick={() => setShowSignModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-dark transition-colors"
      >
        <PenTool className="h-4 w-4" />
        Sign
      </button>

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSignModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Contract</h3>
            <p className="text-sm text-gray-600 mb-4">
              You are signing: <strong>{contractTitle}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="Enter your full legal name"
                />
              </div>

              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                />
                <span className="text-sm text-gray-700">
                  I confirm that I have read and agree to the terms of this contract.
                  I have the authority to sign on behalf of my company.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSignModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={loading || !signatureName || !agreed}
                className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <PenTool className="h-4 w-4" />
                    Sign Contract
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
