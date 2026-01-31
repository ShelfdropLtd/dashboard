export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, Truck, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle, AlertTriangle, MapPin } from 'lucide-react'

export default async function BrandShipmentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's brand
  const { data: brand } = await supabase
    .from('brands')
    .select('id, company_name, name')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  // Get inbound shipments
  const { data: inboundShipments } = await supabase
    .from('inbound_shipments')
    .select('*')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })

  // Get outbound shipments
  const { data: outboundShipments } = await supabase
    .from('outbound_shipments')
    .select('*, purchase_orders(reference_number)')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })

  // Calculate totals
  const totalShippingCosts = outboundShipments?.reduce((sum, s) => sum + (s.total_cost || 0), 0) || 0
  const inTransitCount = (inboundShipments?.filter(s => s.status === 'in_transit').length || 0) +
    (outboundShipments?.filter(s => s.status === 'dispatched').length || 0)
  const thisMonthShipments = outboundShipments?.filter(s => {
    const date = new Date(s.created_at)
    const now = new Date()
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length || 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'picked':
      case 'packed':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'in_transit':
      case 'dispatched':
        return <Truck className="w-4 h-4 text-blue-600" />
      case 'delivered':
      case 'received':
      case 'checked_in':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'issue':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Package className="w-4 h-4 text-gray-400" />
    }
  }

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-shelfdrop-blue">Shipments</h1>
        <p className="text-gray-600">Track your inbound and outbound shipments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Transit</p>
              <p className="text-2xl font-bold text-gray-900">{inTransitCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ArrowDownToLine className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Inbound</p>
              <p className="text-2xl font-bold text-gray-900">{inboundShipments?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ArrowUpFromLine className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{thisMonthShipments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Fulfilment Costs</p>
              <p className="text-2xl font-bold text-gray-900">£{totalShippingCosts.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inbound Shipments */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-amber-600" />
              Stock Sent to Shelfdrop
            </h2>
            <p className="text-sm text-gray-500 mt-1">Shipments you've sent to our warehouse</p>
          </div>

          {!inboundShipments || inboundShipments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No inbound shipments</p>
              <p className="text-sm mt-1">Contact us to arrange stock delivery</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {inboundShipments.map((shipment) => (
                <div key={shipment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(shipment.status)}
                      <span className="font-medium text-gray-900">{shipment.reference_number}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(shipment.status)}`}>
                      {shipment.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {shipment.carrier || 'No carrier specified'}
                    </span>
                    {shipment.is_bonded && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                        Bonded
                      </span>
                    )}
                  </div>

                  {shipment.expected_date && (
                    <p className="text-xs text-gray-400 mt-2">
                      Expected: {new Date(shipment.expected_date).toLocaleDateString('en-GB')}
                    </p>
                  )}

                  {shipment.tracking_number && (
                    <p className="text-xs text-shelfdrop-blue mt-1">
                      Tracking: {shipment.tracking_number}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outbound Shipments */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ArrowUpFromLine className="w-5 h-5 text-blue-600" />
              Orders Shipped by Shelfdrop
            </h2>
            <p className="text-sm text-gray-500 mt-1">Fulfilment on your behalf</p>
          </div>

          {!outboundShipments || outboundShipments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No outbound shipments yet</p>
              <p className="text-sm mt-1">Shipments appear here when orders are dispatched</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {outboundShipments.map((shipment) => (
                <div key={shipment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(shipment.status)}
                      <span className="font-medium text-gray-900">{shipment.reference_number}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(shipment.status)}`}>
                      {shipment.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {shipment.destination_name || shipment.destination_type}
                    </span>
                    <span className="font-medium text-gray-700">
                      £{(shipment.total_cost || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{shipment.carrier} • {shipment.service_type || 'Standard'}</span>
                    {shipment.purchase_orders?.reference_number && (
                      <span>PO: {shipment.purchase_orders.reference_number}</span>
                    )}
                  </div>

                  {shipment.tracking_number && (
                    <p className="text-xs text-shelfdrop-blue mt-2">
                      Tracking: {shipment.tracking_number}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cost Breakdown */}
      {outboundShipments && outboundShipments.length > 0 && (
        <div className="mt-8 bg-shelfdrop-yellow/20 rounded-xl border border-shelfdrop-yellow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Fulfilment Cost Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Shipping Costs</p>
              <p className="text-xl font-bold text-gray-900">
                £{outboundShipments.reduce((sum, s) => sum + (s.shipping_cost || 0), 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Handling Fees</p>
              <p className="text-xl font-bold text-gray-900">
                £{outboundShipments.reduce((sum, s) => sum + (s.handling_fee || 0), 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Packaging Costs</p>
              <p className="text-xl font-bold text-gray-900">
                £{outboundShipments.reduce((sum, s) => sum + (s.packaging_cost || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
