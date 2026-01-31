export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, Clock, Info } from 'lucide-react'
import PricingActions from './PricingActions'

export default async function PricingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  if (brand.onboarding_status !== 'approved' && brand.onboarding_status !== 'pricing_review') {
    redirect('/onboarding/pending')
  }

  // Check if pricing already accepted
  if (brand.onboarding_status === 'pricing_accepted') {
    redirect('/onboarding/contracts')
  }

  // Get SKU offers for this brand
  const { data: offers } = await supabase
    .from('sku_offers')
    .select('*')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })

  const pendingOffers = offers?.filter(o => o.status === 'pending') || []
  const hasOffers = pendingOffers.length > 0

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pricing Review
          </h1>
          <p className="text-gray-600">
            Review the pricing we&apos;ve prepared for your products
          </p>
        </div>

        {!hasOffers ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-[#F15A2B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-[#F15A2B]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Awaiting Pricing
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Our team is preparing pricing offers for your products.
              You&apos;ll receive an email when they&apos;re ready for review.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pricing Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How Shelfdrop Pricing Works</p>
                <p>
                  We operate on a consignment model. You retain ownership of your stock and receive payment
                  when products sell. Our commission is £2 per bottle. The prices below show what you&apos;ll
                  receive per unit sold (after our commission).
                </p>
              </div>
            </div>

            {/* Pricing Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your SKU Pricing
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {pendingOffers.length} product{pendingOffers.length !== 1 ? 's' : ''} awaiting your approval
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU Code
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        RRP
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selling Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        You Receive
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Your Margin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingOffers.map((offer) => {
                      const commission = 2.00
                      const youReceive = (offer.offer_price || 0) - commission
                      const rrp = offer.rrp || offer.offer_price || 0
                      const marginPercent = rrp > 0 ? ((youReceive / rrp) * 100).toFixed(1) : '0'

                      return (
                        <tr key={offer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{offer.sku_name}</p>
                                {offer.size && (
                                  <p className="text-sm text-gray-500">{offer.size}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {offer.sku_code}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-right">
                            £{rrp.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                            £{(offer.offer_price || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-right">
                            £{commission.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-semibold text-green-600">
                              £{youReceive.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {marginPercent}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    <p>By accepting, you agree to these pricing terms for your products.</p>
                    <p className="mt-1">Prices can be reviewed and adjusted quarterly.</p>
                  </div>
                  <PricingActions brandId={brand.id} offerIds={pendingOffers.map(o => o.id)} />
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Pricing Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total SKUs</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingOffers.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Commission Rate</p>
                  <p className="text-2xl font-bold text-gray-900">£2.00</p>
                  <p className="text-xs text-gray-500">per bottle</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg. You Receive</p>
                  <p className="text-2xl font-bold text-green-600">
                    £{pendingOffers.length > 0
                      ? (pendingOffers.reduce((sum, o) => sum + ((o.offer_price || 0) - 2), 0) / pendingOffers.length).toFixed(2)
                      : '0.00'
                    }
                  </p>
                  <p className="text-xs text-gray-500">per bottle</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Terms</p>
                  <p className="text-2xl font-bold text-gray-900">Net 30</p>
                  <p className="text-xs text-gray-500">after sale</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
