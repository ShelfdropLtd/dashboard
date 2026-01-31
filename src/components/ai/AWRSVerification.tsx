'use client'

import { useState } from 'react'
import { Shield, Loader2, CheckCircle, XCircle, AlertTriangle, ExternalLink, Search } from 'lucide-react'

interface AWRSVerificationProps {
  awrsNumber: string
  companyName: string
  onVerificationComplete?: (result: VerificationResult) => void
}

interface VerificationResult {
  isValid: boolean
  formatValid: boolean
  status: 'verified' | 'invalid' | 'needs_manual_check' | 'not_found'
  details: string
  registrationDate?: string
  expiryDate?: string
  registeredName?: string
}

export default function AWRSVerification({ awrsNumber, companyName, onVerificationComplete }: AWRSVerificationProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const verifyAWRS = async () => {
    setLoading(true)

    try {
      // Simulate API call to HMRC
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Validate format (AWRS numbers follow pattern: XAAW00000123456)
      const formatRegex = /^X[A-Z]AW\d{11}$/
      const formatValid = formatRegex.test(awrsNumber.replace(/\s/g, '').toUpperCase())

      let verificationResult: VerificationResult

      if (!formatValid) {
        verificationResult = {
          isValid: false,
          formatValid: false,
          status: 'invalid',
          details: 'The AWRS number format appears incorrect. Valid AWRS numbers follow the pattern XAAW followed by 11 digits (e.g., XAAW00000123456).',
        }
      } else {
        // Mock successful verification
        const mockVerified = Math.random() > 0.3 // 70% success rate for demo

        if (mockVerified) {
          verificationResult = {
            isValid: true,
            formatValid: true,
            status: 'verified',
            details: 'AWRS registration verified successfully. The company is registered as an approved alcohol wholesaler.',
            registrationDate: '2023-06-15',
            expiryDate: '2026-06-14',
            registeredName: companyName,
          }
        } else {
          verificationResult = {
            isValid: false,
            formatValid: true,
            status: 'needs_manual_check',
            details: 'Unable to automatically verify. The format is valid but HMRC lookup returned inconclusive results. Manual verification recommended.',
          }
        }
      }

      setResult(verificationResult)
      onVerificationComplete?.(verificationResult)
    } catch (error) {
      setResult({
        isValid: false,
        formatValid: false,
        status: 'not_found',
        details: 'Verification service unavailable. Please try again later or verify manually.',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (!result) return null

    switch (result.status) {
      case 'verified':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'invalid':
        return <XCircle className="w-6 h-6 text-red-600" />
      case 'needs_manual_check':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-600" />
    }
  }

  const getStatusColor = () => {
    if (!result) return 'bg-gray-100 border-gray-200'

    switch (result.status) {
      case 'verified':
        return 'bg-green-50 border-green-200'
      case 'invalid':
        return 'bg-red-50 border-red-200'
      case 'needs_manual_check':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AWRS Verification</h3>
            <p className="text-sm text-gray-500">Alcohol Wholesaler Registration Scheme</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">AWRS Number</label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg font-mono text-lg">
              {awrsNumber || 'Not provided'}
            </div>
          </div>
          <button
            onClick={verifyAWRS}
            disabled={loading || !awrsNumber}
            className="px-6 py-3 bg-shelfdrop-blue text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Verify
              </>
            )}
          </button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon()}
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-1">
                  {result.status === 'verified' && 'Verification Successful'}
                  {result.status === 'invalid' && 'Verification Failed'}
                  {result.status === 'needs_manual_check' && 'Manual Verification Required'}
                  {result.status === 'not_found' && 'Verification Unavailable'}
                </p>
                <p className="text-sm text-gray-600 mb-3">{result.details}</p>

                {result.status === 'verified' && (
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-green-200">
                    <div>
                      <p className="text-xs text-gray-500">Registered Name</p>
                      <p className="text-sm font-medium">{result.registeredName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Registration Date</p>
                      <p className="text-sm font-medium">
                        {result.registrationDate && new Date(result.registrationDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Valid Until</p>
                      <p className="text-sm font-medium">
                        {result.expiryDate && new Date(result.expiryDate).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <a
            href="https://www.tax.service.gov.uk/check-the-awrs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-shelfdrop-blue hover:underline inline-flex items-center gap-1"
          >
            Verify manually on HMRC
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
