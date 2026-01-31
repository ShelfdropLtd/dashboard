import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Clock, LogOut } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check brand status
  const { data: brand } = await supabase
    .from('brands')
    .select('id, status, company_name')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  if (brand.status === 'approved') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Under Review
          </h1>

          <p className="text-gray-500 mb-6">
            Thanks for registering <strong>{brand.company_name}</strong>!
            We're reviewing your application and will be in touch soon.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              This usually takes 1-2 business days. We'll email you once your account is approved.
            </p>
          </div>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
