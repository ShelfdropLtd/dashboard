export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Truck,
  Receipt,
  Download,
  Building2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export default async function AdminReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get all brands
  const { data: brands } = await supabase
    .from('brands')
    .select('id, company_name, name')
    .eq('status', 'approved')

  // Get all transactions
  const { data: transactions } = await supabase
    .from('brand_transactions')
    .select('*')
    .order('transaction_date', { ascending: false })

  // Get shipments
  const { data: outboundShipments } = await supabase
    .from('outbound_shipments')
    .select('*, brands(company_name)')
    .order('created_at', { ascending: false })

  // Get duties
  const { data: dutyEntries } = await supabase
    .from('duty_entries')
    .select('*, brands(company_name)')
    .order('created_at', { ascending: false })

  // Calculate totals
  const totalRevenue = transactions?.filter(t => t.transaction_type === 'sale').reduce((s, t) => s + t.amount, 0) || 0
  const totalCommission = Math.abs(transactions?.filter(t => t.transaction_type === 'commission').reduce((s, t) => s + t.amount, 0) || 0)
  const totalFulfilment = outboundShipments?.reduce((s, ship) => s + (ship.total_cost || 0), 0) || 0
  const totalDuties = dutyEntries?.reduce((s, d) => s + (d.total_duty_amount || 0), 0) || 0

  // Group by brand
  const brandStats = brands?.map(brand => {
    const brandTx = transactions?.filter(t => t.brand_id === brand.id) || []
    const brandShipments = outboundShipments?.filter(s => s.brand_id === brand.id) || []
    const brandDuties = dutyEntries?.filter(d => d.brand_id === brand.id) || []

    return {
      ...brand,
      revenue: brandTx.filter(t => t.transaction_type === 'sale').reduce((s, t) => s + t.amount, 0),
      commission: Math.abs(brandTx.filter(t => t.transaction_type === 'commission').reduce((s, t) => s + t.amount, 0)),
      fulfilment: brandShipments.reduce((s, ship) => s + (ship.total_cost || 0), 0),
      duties: brandDuties.reduce((s, d) => s + (d.total_duty_amount || 0), 0),
      shipmentCount: brandShipments.length,
    }
  }) || []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-shelfdrop-blue">All Reports</h1>
          <p className="text-gray-600">Financial overview across all brands</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors">
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">£{totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Commission Earned</p>
              <p className="text-2xl font-bold text-purple-600">£{totalCommission.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Fulfilment Charged</p>
              <p className="text-2xl font-bold text-gray-900">£{totalFulfilment.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Duties Processed</p>
              <p className="text-2xl font-bold text-gray-900">£{totalDuties.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Brand Performance</h2>
        </div>

        {brandStats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No brand data yet</p>
            <p className="text-sm mt-1">Add transactions via Data Management</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Brand</th>
                  <th className="px-6 py-4 font-medium text-right">Revenue</th>
                  <th className="px-6 py-4 font-medium text-right">Commission</th>
                  <th className="px-6 py-4 font-medium text-right">Fulfilment</th>
                  <th className="px-6 py-4 font-medium text-right">Duties</th>
                  <th className="px-6 py-4 font-medium text-right">Shipments</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brandStats.map((brand) => (
                  <tr key={brand.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{brand.company_name || brand.name}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      £{brand.revenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-purple-600 font-medium">
                      £{brand.commission.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      £{brand.fulfilment.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      £{brand.duties.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      {brand.shipmentCount}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/brands/${brand.id}`}
                        className="text-shelfdrop-blue hover:underline text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/data/import"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-shelfdrop-green hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Add Sales Data</h3>
          <p className="text-sm text-gray-600">Import or manually enter revenue and transactions</p>
        </Link>

        <Link
          href="/admin/shipments"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-shelfdrop-green hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Shipment Costs</h3>
          <p className="text-sm text-gray-600">View and manage fulfilment charges</p>
        </Link>

        <Link
          href="/admin/duties"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-shelfdrop-green hover:shadow-md transition-all"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Duty Entries</h3>
          <p className="text-sm text-gray-600">Track bond releases and duty payments</p>
        </Link>
      </div>
    </div>
  )
}
