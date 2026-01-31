import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingProgress from '@/components/onboarding/OnboardingProgress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import ShippingForm from './ShippingForm'
import { Truck, Package, CheckCircle, MapPin, Calendar } from 'lucide-react'

export default async function ShippingSetupPage() {
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
  if (brand.onboarding_stage === 'contract_signing') {
    redirect('/onboarding/contracts')
  }
  if (brand.onboarding_stage === 'onboarding_complete' || brand.status === 'approved') {
    redirect('/dashboard')
  }

  // Get accepted SKU offers
  const { data: acceptedOffers } = await supabase
    .from('sku_offers')
    .select('*')
    .eq('brand_id', userData.brand_id)
    .eq('status', 'accepted')
    .order('product_name')

  // Get existing shipping plans
  const { data: shippingPlans } = await supabase
    .from('shipping_plans')
    .select('*, shipping_plan_items(*)')
    .eq('brand_id', userData.brand_id)
    .order('created_at', { ascending: false })

  const submittedPlans = shippingPlans?.filter(p => p.status !== 'draft') || []
  const hasSubmittedPlan = submittedPlans.length > 0

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default'
      case 'submitted': return 'warning'
      case 'approved': return 'info'
      case 'in_transit': return 'info'
      case 'delivered': return 'success'
      case 'received': return 'success'
      default: return 'default'
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
              <h1 className="text-xl font-bold text-gray-900">Shipping Setup</h1>
              <p className="text-sm text-gray-500">{brand.legal_company_name || brand.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <OnboardingProgress currentStage={brand.onboarding_stage || 'shipping_setup'} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <Truck className="h-8 w-8 text-blue-500 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-blue-800">Create Your First Shipment</h2>
              <p className="text-blue-700 mt-1">
                Set up an Advanced Shipping Notification (ASN) to send your initial stock to our fulfilment centre.
                Once we receive and process your shipment, your onboarding will be complete!
              </p>
            </div>
          </div>
        </div>

        {/* Warehouse Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              Shelfdrop Fulfilment Centre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900">Shelfdrop Warehouse</p>
              <p className="text-sm text-gray-600">Unit 5, Industrial Estate</p>
              <p className="text-sm text-gray-600">London, E1 1AA</p>
              <p className="text-sm text-gray-600 mt-2">
                Contact: <a href="mailto:warehouse@shelfdrop.co" className="text-brand-accent">warehouse@shelfdrop.co</a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Existing Shipping Plans */}
        {shippingPlans && shippingPlans.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Shipping Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shippingPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{plan.reference_number || plan.plan_name}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {plan.total_cases} cases / {plan.total_units} units
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(plan.expected_ship_date)}
                        </span>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(plan.status) as any}>
                      {plan.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shipping Form */}
        <ShippingForm
          brandId={brand.id}
          acceptedOffers={acceptedOffers || []}
          hasSubmittedPlan={hasSubmittedPlan}
        />

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help with shipping? Email us at <a href="mailto:warehouse@shelfdrop.co" className="text-brand-accent">warehouse@shelfdrop.co</a></p>
        </div>
      </div>
    </div>
  )
}
