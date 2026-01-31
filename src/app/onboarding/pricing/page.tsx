import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingProgress from '@/components/onboarding/OnboardingProgress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import PricingActions from './PricingActions'
import { Package, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default async function PricingReviewPage() {
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

  // Check stage
  if (brand.onboarding_stage === 'pending_review') {
    redirect('/onboarding/pending')
  }
  if (brand.onboarding_stage === 'contract_signing') {
    redirect('/onboarding/contracts')
  }
  if (brand.onboarding_stage === 'shipping_setup') {
    redirect('/onboarding/shipping')
  }
  if (brand.onboarding_stage === 'onboarding_complete' || brand.status === 'approved') {
    redirect('/dashboard')
  }

  // Get SKU offers
  const { data: offers } = await supabase
    .from('sku_offers')
    .select('*')
    .eq('brand_id', userData.brand_id)
    .order('product_name')

  const pendingOffers = offers?.filter(o => o.status === 'offered') || []
  const acceptedOffers = offers?.filter(o => o.status === 'accepted') || []
  const rejectedOffers = offers?.filter(o => o.status === 'rejected') || []
  const allOffered = offers?.every(o => o.status === 'offered' || o.status === 'accepted') || false
  const allResponded = offers?.every(o => o.status === 'accepted' || o.status === 'rejected') || false

  const formatCurrency = (value: number | null) => {
    if (!value) return '-'
    return `£${value.toFixed(2)}`
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
              <h1 className="text-xl font-bold text-gray-900">Pricing Review</h1>
              <p className="text-sm text-gray-500">{brand.legal_company_name || brand.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <OnboardingProgress currentStage={brand.onboarding_stage || 'pricing_review'} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Banner */}
        {!offers || offers.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-center">
            <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-yellow-800">Pricing In Progress</h2>
            <p className="text-yellow-700 mt-1">
              Our team is reviewing your product sheet and preparing pricing offers for each SKU.
              You'll receive an email when your offers are ready.
            </p>
          </div>
        ) : allResponded && acceptedOffers.length > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <h2 className="text-lg font-semibold text-green-800">Pricing Accepted</h2>
                  <p className="text-green-700">
                    You've accepted {acceptedOffers.length} SKU{acceptedOffers.length !== 1 ? 's' : ''}.
                    Ready to proceed to contracts.
                  </p>
                </div>
              </div>
              <PricingActions
                brandId={brand.id}
                canProceed={true}
                acceptedCount={acceptedOffers.length}
              />
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <h2 className="text-lg font-semibold text-blue-800">Review Your Pricing Offers</h2>
                <p className="text-blue-700">
                  We've prepared pricing for {offers.length} SKU{offers.length !== 1 ? 's' : ''}.
                  Please review and accept or reject each offer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {offers && offers.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingOffers.length}</p>
                <p className="text-sm text-gray-500">Pending Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-green-600">{acceptedOffers.length}</p>
                <p className="text-sm text-gray-500">Accepted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold text-red-600">{rejectedOffers.length}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Offers Table */}
        {offers && offers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>SKU Pricing Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">SKU</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Your Price</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Our Offer</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">RRP</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer) => (
                      <tr key={offer.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{offer.product_name}</p>
                          {offer.volume_ml && (
                            <p className="text-sm text-gray-500">{offer.volume_ml}ml • {offer.abv_percent}% ABV</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{offer.sku_code || '-'}</td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">
                          {formatCurrency(offer.brand_wholesale_price)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-brand-accent">
                            {formatCurrency(offer.shelfdrop_offer_price)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">
                          {formatCurrency(offer.rrp)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              offer.status === 'accepted' ? 'success' :
                              offer.status === 'rejected' ? 'danger' :
                              offer.status === 'offered' ? 'warning' : 'default'
                            }
                          >
                            {offer.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {offer.status === 'offered' && (
                            <PricingActions
                              brandId={brand.id}
                              offerId={offer.id}
                              offerPrice={offer.shelfdrop_offer_price}
                              productName={offer.product_name}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Questions about your pricing? Email us at <a href="mailto:brands@shelfdrop.co" className="text-brand-accent">brands@shelfdrop.co</a></p>
        </div>
      </div>
    </div>
  )
}
