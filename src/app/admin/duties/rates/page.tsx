export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, TrendingUp, Beer, Wine, GlassWater } from 'lucide-react'
import DutyRatesManager from './DutyRatesManager'

export default async function DutyRatesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get all duty rates
  const { data: dutyRates } = await supabase
    .from('duty_rates')
    .select('*')
    .order('category')
    .order('min_abv', { ascending: true, nullsFirst: true })

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <Link
          href="/admin/duties"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Duties
        </Link>
        <h1 className="text-2xl font-bold text-shelfdrop-blue">Manage Duty Rates</h1>
        <p className="text-gray-600">Configure UK alcohol duty rates for automatic calculation</p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Beer className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">Beer & Cider</h3>
          </div>
          <p className="text-sm text-amber-700">
            Rate varies by ABV. Small producer relief may apply for volumes under 4,500 hectolitres.
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Wine className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Wine</h3>
          </div>
          <p className="text-sm text-purple-700">
            Duty calculated per hectolitre of product. Still and sparkling wines have different rates.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <GlassWater className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Spirits</h3>
          </div>
          <p className="text-sm text-blue-700">
            Duty calculated per litre of pure alcohol (LPA). Current rate applies to all ABV levels.
          </p>
        </div>
      </div>

      <DutyRatesManager initialRates={dutyRates || []} />
    </div>
  )
}
