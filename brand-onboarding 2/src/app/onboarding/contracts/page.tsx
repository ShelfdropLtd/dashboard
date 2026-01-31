import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingProgress from '@/components/onboarding/OnboardingProgress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import ContractActions from './ContractActions'
import { FileText, Clock, CheckCircle, ExternalLink, PenTool } from 'lucide-react'

export default async function ContractsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user's brand
  const { data: userData } = await supabase
    .from('users')
    .select('brand_id')
    .eq('id', user.id)
    .single()

  if (!userData?.brand_id) redirect('/onboarding')

  // Get brand details
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('id', userData.brand_id)
    .single()

  if (!brand) redirect('/onboarding')

  // Route based on stage
  if (brand.onboarding_stage === 'pending_review') {
    redirect('/onboarding/pending')
  }
  if (brand.onboarding_stage === 'pricing_review') {
    redirect('/onboarding/pricing')
  }
  if (brand.onboarding_stage === 'shipping_setup') {
    redirect('/onboarding/shipping')
  }
  if (brand.onboarding_stage === 'onboarding_complete' || brand.status === 'approved') {
    redirect('/dashboard')
  }

  // Get contracts
  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('brand_id', userData.brand_id)
    .order('created_at')

  const pendingContracts = contracts?.filter(c => c.status !== 'signed') || []
  const signedContracts = contracts?.filter(c => c.status === 'signed') || []
  const allSigned = contracts && contracts.length > 0 && pendingContracts.length === 0

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'distribution_agreement': return 'Distribution Agreement'
      case 'consignment_terms': return 'Consignment Terms'
      case 'data_processing': return 'Data Processing Agreement'
      default: return type
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-dark rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sign Contracts</h1>
              <p className="text-sm text-gray-500">{brand.legal_company_name || brand.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <OnboardingProgress currentStage={brand.onboarding_stage || 'contract_signing'} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Banner */}
        {!contracts || contracts.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-center">
            <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-yellow-800">Contracts Being Prepared</h2>
            <p className="text-yellow-700 mt-1">
              Our team is preparing your contracts. You'll receive an email when they're ready to sign.
            </p>
          </div>
        ) : allSigned ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <h2 className="text-lg font-semibold text-green-800">All Contracts Signed</h2>
                  <p className="text-green-700">
                    Great! You've signed all {signedContracts.length} contract{signedContracts.length !== 1 ? 's' : ''}.
                    Ready to set up your first shipment.
                  </p>
                </div>
              </div>
              <ContractActions brandId={brand.id} canProceed={true} />
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <PenTool className="h-8 w-8 text-blue-500" />
              <div>
                <h2 className="text-lg font-semibold text-blue-800">Review & Sign Your Contracts</h2>
                <p className="text-blue-700">
                  Please review and sign {pendingContracts.length} contract{pendingContracts.length !== 1 ? 's' : ''} to continue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {contracts && contracts.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingContracts.length}</p>
                <p className="text-sm text-gray-500">Awaiting Signature</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-green-600">{signedContracts.length}</p>
                <p className="text-sm text-gray-500">Signed</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contracts List */}
        {contracts && contracts.length > 0 && (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <Card key={contract.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${contract.status === 'signed' ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <FileText className={`h-6 w-6 ${contract.status === 'signed' ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{contract.title}</h3>
                        <p className="text-sm text-gray-500">{getContractTypeLabel(contract.contract_type)}</p>
                        {contract.description && (
                          <p className="text-sm text-gray-600 mt-1">{contract.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          {contract.signed_at && (
                            <span>Signed: {formatDate(contract.signed_at)}</span>
                          )}
                          {contract.signed_by && (
                            <span>By: {contract.signed_by}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={contract.status === 'signed' ? 'success' : 'warning'}
                      >
                        {contract.status === 'signed' ? 'Signed' : 'Pending'}
                      </Badge>
                      {contract.document_url && (
                        <a
                          href={contract.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-accent hover:underline text-sm flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {contract.status !== 'signed' && (
                        <ContractActions
                          brandId={brand.id}
                          contractId={contract.id}
                          contractTitle={contract.title}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Questions about your contracts? Email us at <a href="mailto:legal@shelfdrop.co" className="text-brand-accent">legal@shelfdrop.co</a></p>
        </div>
      </div>
    </div>
  )
}
