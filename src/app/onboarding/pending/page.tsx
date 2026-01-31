export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Clock, CheckCircle } from 'lucide-react'

export default async function PendingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: brand } = await supabase
    .from('brands')
    .select('id, onboarding_status, company_name')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  // If approved, go to pricing
  if (brand.onboarding_status === 'approved') {
    redirect('/onboarding/pricing')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-orange-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Under Review
          </h1>

          <p className="text-gray-600 mb-6">
            Thank you for submitting your application! Our team is currently reviewing your details.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Application submitted successfully</span>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            We typically review applications within 2-3 business days.
            You&apos;ll receive an email once a decision has been made.
          </p>
        </div>
      </div>
    </div>
  )
}
