export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Receipt, AlertTriangle, CheckCircle, Clock, Plus, TrendingUp, Warehouse } from 'lucide-react'

export default async function AdminDutiesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get duty entries
  const { data: dutyEntries } = await supabase
    .from('duty_entries')
    .select('*, brands(id, company_name, name)')
    .order('created_at', { ascending: false })
    .limit(20)

  // Get duty rates
  const { data: dutyRates } = await supabase
    .from('duty_rates')
    .select('*')
    .order('category')

  // Stats
  const pendingDuties = dutyEntries?.filter(d => d.status === 'pending') || []
  const totalPending = pendingDuties.reduce((sum, d) => sum + (d.total_duty_amount || 0), 0)

  const paidDuties = dutyEntries?.filter(d => d.status === 'paid') || []
  const totalPaid = paidDuties.reduce((sum, d) => sum + (d.total_duty_amount || 0), 0)

  const chargedDuties = dutyEntries?.filter(d => d.status === 'charged') || []
  const totalCharged = chargedDuties.reduce((sum, d) => sum + (d.total_duty_amount || 0), 0)

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
      paid: { bg: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-3 h-3" /> },
      charged: { bg: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
    }
    return styles[status] || { bg: 'bg-gray-100 text-gray-800', icon: null }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-shelfdrop-blue">Duties & Bond Management</h1>
          <p className="text-gray-600">Manage duty calculations and bond stock releases</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/duties/rates"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Manage Rates
          </Link>
          <Link
            href="/admin/duties/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Record Duty Entry
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Duty</p>
              <p className="text-2xl font-bold text-gray-900">£{totalPending.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid to HMRC</p>
              <p className="text-2xl font-bold text-gray-900">£{totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Charged to Brands</p>
              <p className="text-2xl font-bold text-gray-900">£{totalCharged.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{dutyEntries?.length || 0} entries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Alert */}
      {pendingDuties.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-900">
              {pendingDuties.length} duty {pendingDuties.length === 1 ? 'entry' : 'entries'} pending
            </p>
            <p className="text-sm text-amber-700">
              Total: £{totalPending.toFixed(2)} awaiting HMRC payment
            </p>
          </div>
          <Link
            href="/admin/duties?status=pending"
            className="ml-auto px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            Review
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Duty Entries Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recent Duty Entries</h2>
          </div>

          {!dutyEntries || dutyEntries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No duty entries yet</p>
              <p className="text-sm mt-1">Duty is calculated when stock is released from bond</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {dutyEntries.map((entry) => {
                const statusStyle = getStatusBadge(entry.status)
                return (
                  <Link
                    key={entry.id}
                    href={`/admin/duties/${entry.id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{entry.reference_number}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 ${statusStyle.bg}`}>
                        {statusStyle.icon}
                        {entry.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {entry.brands?.company_name || entry.brands?.name}
                      </p>
                      <span className="text-lg font-semibold text-gray-900">
                        £{entry.total_duty_amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(entry.entry_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Duty Rates Card */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Current Duty Rates</h2>
            <Link href="/admin/duties/rates" className="text-sm text-shelfdrop-blue hover:underline">
              Edit
            </Link>
          </div>

          {!dutyRates || dutyRates.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No rates configured</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {dutyRates.slice(0, 6).map((rate) => (
                <div key={rate.id} className="px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {rate.category}
                        {rate.subcategory && (
                          <span className="text-gray-500 font-normal"> • {rate.subcategory.replace('_', ' ')}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {rate.min_abv && rate.max_abv
                          ? `${rate.min_abv}% - ${rate.max_abv}% ABV`
                          : rate.min_abv
                          ? `>${rate.min_abv}% ABV`
                          : 'All ABV'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        £{rate.rate_amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {rate.rate_type === 'per_litre_alcohol' && '/L pure alcohol'}
                        {rate.rate_type === 'per_hectolitre' && '/hectolitre'}
                        {rate.rate_type === 'fixed_per_unit' && '/unit'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
