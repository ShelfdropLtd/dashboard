export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Package } from 'lucide-react'
import POActions from './POActions'

export default async function PODetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get brand for this user
  const { data: brand } = await supabase
    .from('brands')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  // Get PO details
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', params.id)
    .eq('brand_id', brand.id)
    .single()

  if (!po) {
    notFound()
  }

  // Get PO items
  const { data: items } = await supabase
    .from('purchase_order_items')
    .select('*')
    .eq('purchase_order_id', params.id)

  // Check if invoice exists for this PO
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('purchase_order_id', params.id)
    .single()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{po.po_number}</h1>
            <p className="text-gray-600">
              Received {new Date(po.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          po.status === 'accepted' ? 'bg-green-100 text-green-800' :
          po.status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {po.status === 'pending' ? 'Awaiting Response' : po.status}
        </span>
      </div>

      {/* PO Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items?.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="font-medium text-gray-900">{item.product_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.sku_code}</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">£{item.unit_cost?.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">£{item.total_cost?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td colSpan={4} className="px-6 py-4 text-right font-semibold text-gray-900">Total</td>
              <td className="px-6 py-4 text-right font-bold text-gray-900">£{po.total_amount?.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {po.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
          <p className="text-gray-600">{po.notes}</p>
        </div>
      )}

      {/* Actions */}
      {po.status === 'pending' && (
        <POActions poId={po.id} />
      )}

      {po.status === 'accepted' && !invoice && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-medium text-green-900 mb-2">PO Accepted</h3>
          <p className="text-green-700 mb-4">You can now create an invoice for this purchase order.</p>
          <Link
            href={`/invoices/create?po=${po.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FileText className="w-4 h-4" />
            Create Invoice
          </Link>
        </div>
      )}

      {invoice && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-medium text-blue-900 mb-2">Invoice Created</h3>
          <p className="text-blue-700 mb-4">An invoice has been created for this PO.</p>
          <Link
            href={`/invoices/${invoice.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FileText className="w-4 h-4" />
            View Invoice
          </Link>
        </div>
      )}
    </div>
  )
}
