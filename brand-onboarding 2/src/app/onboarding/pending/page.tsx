import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Clock, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function PendingApprovalPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user's brand
  const { data: userData } = await supabase
    .from('users')
    .select('brand_id, role')
    .eq('id', user.id)
    .single()

  if (userData?.role === 'admin') {
    redirect('/admin')
  }

  if (!userData?.brand_id) {
    redirect('/onboarding')
  }

  // Check brand status
  const { data: brand } = await supabase
    .from('brands')
    .select('name, status, submitted_at, rejection_reason')
    .eq('id', userData.brand_id)
    .single()

  if (brand?.status === 'approved') {
    redirect('/dashboard')
  }

  if (brand?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Not Approved</h1>
            <p className="text-gray-600 mb-4">
              Unfortunately, your application for <strong>{brand?.name}</strong> was not approved.
            </p>
            {brand?.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-medium text-red-800 mb-1">Reason:</p>
                <p className="text-sm text-red-700">{brand.rejection_reason}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-6">
              If you believe this is an error or would like to discuss further, please contact us.
            </p>
            <a
              href="mailto:brands@shelfdrop.co"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-dark transition-colors"
            >
              <Mail className="h-5 w-5" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    )
  }

  const submittedDate = brand?.submitted_at
    ? new Date(brand.submitted_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Recently'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h1>
          <p className="text-gray-600 mb-6">
            Thank you for submitting your application for <strong>{brand?.name}</strong>.
            Our team is reviewing your details.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div>
                <p className="text-gray-500">Submitted</p>
                <p className="font-medium text-gray-900">{submittedDate}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium text-yellow-600">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-left mb-6">
            <h3 className="font-medium text-gray-900">What happens next?</h3>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-600">Our team will review your company details and compliance information</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-600">We'll verify your Master Product Sheet and pricing</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-600">You'll receive an email once your account is approved</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            This usually takes 1-2 business days. We'll email you at <strong>{user.email}</strong> when your account is ready.
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="mailto:brands@shelfdrop.co"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <Mail className="h-5 w-5" />
              Questions? Contact us
            </a>
            <Link
              href="/onboarding"
              className="text-sm text-brand-accent hover:underline"
            >
              Edit my application
            </Link>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-400">
          Shelfdrop • UK Drinks Distribution
        </p>
      </div>
    </div>
  )
}
