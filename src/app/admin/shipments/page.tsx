export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, Truck, ArrowDownToLine, ArrowUpFromLine, Plus, Filter } from 'lucide-react'

export default async function AdminShipmentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get inbound shipments
  const { data: inboundShipments } = await supabase
    .from('inbound_shipments')
    .select('*, brands(id, company_name, name)')
    .order('created_at', { ascending: false })
    .limit(10)

  // Get outbound shipments
  const { data: outboundShipments } = await supabase
    .from('outbound_shipments')
    .select('*, brands(id, company_name, name), purchase_orders(reference_number)')
    .order('created_at', { ascending: false })
    .limit(10)

  // Stats
  const pendingInbound = inboundShipments?.filter(s => s.status === 'pending' || s.status === 'in_transit').length || 0
  const pendingOutbound = outboundShipments?.filter(s => s.status === 'pending' || s.status === 'picked' || s.status === 'packed').length || 0
  const dispatchedToday = outboundShipments?.filter(s => {
    if (!s.dispatched_date) return false
    const today = new Date().toISOString().split('T')[0]
    return s.dispatched_date.startsWith(today)
  }).length || 0

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      received: 'bg-green-100 text-green-800',
      checked_in: 'bg-emerald-100 text-emerald-800',
      picked: 'bg-indigo-100 text-indigo-800',
      packed: 'bg-purple-100 text-purple-800',
      dispatched: 'bg-sky-100 text-sky-800',
      delivered: 'bg-green-100 text-green-800',
      issue: 'bg-red-100 text-red-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-shelfdrop-blue">Shipments</h1>
          <p className="text-gray-600">Manage inbound and outbound shipments</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/shipments/inbound/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Send to Shelfdrop
          </Link>
          <Link
            href="/admin/shipments/outbound/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-blue text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Create Outbound
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ArrowDownToLine className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Awaiting Inbound</p>
              <p className="text-2xl font-bold text-gray-900">{pendingInbound}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">To Dispatch</p>
              <p className="text-2xl font-bold text-gray-900">{pendingOutbound}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dispatched Today</p>
              <p className="text-2xl font-bold text-gray-900">{dispatchedToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ArrowUpFromLine className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{outboundShipments?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inbound Shipments */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-amber-600" />
              Inbound Shipments
            </h2>
            <Link href="/admin/shipments/inbound" className="text-sm text-shelfdrop-blue hover:underline">
              View all →
            </Link>
          </div>

          {!inboundShipments || inboundShipments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No inbound shipments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {inboundShipments.map((shipment) => (
                <Link
                  key={shipment.id}
                  href={`/admin/shipments/inbound/${shipment.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{shipment.reference_number}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(shipment.status)}`}>
                      {shipment.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {shipment.brands?.company_name || shipment.brands?.name}
                  </p>
                  {shipment.expected_date && (
                    <p className="text-xs text-gray-400 mt-1">
                      Expected: {new Date(shipment.expected_date).toLocaleDateString('en-GB')}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Outbound Shipments */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ArrowUpFromLine className="w-5 h-5 text-blue-600" />
              Outbound Shipments
            </h2>
            <Link href="/admin/shipments/outbound" className="text-sm text-shelfdrop-blue hover:underline">
              View all →
            </Link>
          </div>

          {!outboundShipments || outboundShipments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No outbound shipments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {outboundShipments.map((shipment) => (
                <Link
                  key={shipment.id}
                  href={`/admin/shipments/outbound/${shipment.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{shipment.reference_number}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(shipment.status)}`}>
                      {shipment.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {shipment.brands?.company_name || shipment.brands?.name}
                    </p>
                    {shipment.total_cost > 0 && (
                      <span className="text-sm font-medium text-gray-700">
                        £{shipment.total_cost.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {shipment.carrier} • {shipment.destination_type}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
