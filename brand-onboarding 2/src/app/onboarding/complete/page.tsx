import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Check, ArrowRight, Package, BarChart3, MessageCircle, HelpCircle } from 'lucide-react'

export default async function OnboardingCompletePage() {
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
    .select('legal_company_name, name')
    .eq('id', userData.brand_id)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Success Animation */}
        <div className="relative mb-8">
          <div className="h-24 w-24 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
            <Check className="h-5 w-5 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to Shelfdrop! 🎉
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          {brand?.legal_company_name || brand?.name || 'Your brand'} is now live on our platform.
        </p>
        <p className="text-gray-500 mb-8">
          Your first shipment is on the way. Once we receive and process your stock,
          you'll start seeing orders come in.
        </p>

        {/* What's Next */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 text-left">
          <h2 className="font-semibold text-gray-900 mb-4">What you can do now:</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Track Orders</p>
                <p className="text-sm text-gray-500">View and manage incoming orders</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">View Sales Data</p>
                <p className="text-sm text-gray-500">Access real-time selling performance</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Submit Promotions</p>
                <p className="text-sm text-gray-500">Suggest promotional pricing for your products</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <HelpCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Get Support</p>
                <p className="text-sm text-gray-500">Raise tickets and get help from our team</p>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3 bg-brand-accent text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors"
        >
          Go to Dashboard
          <ArrowRight className="h-5 w-5" />
        </Link>

        <p className="mt-6 text-sm text-gray-400">
          Need help? Contact us at <a href="mailto:brands@shelfdrop.co" className="text-brand-accent">brands@shelfdrop.co</a>
        </p>
      </div>
    </div>
  )
}
