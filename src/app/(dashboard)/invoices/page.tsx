export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, Clock, CheckCircle, XCircle } from 'lucide-react'

export default async function BrandInvoicesPage() {
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

  // Get invoices for this brand
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, purchase_orders(po_number)')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })

  const statusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-5 h-5 text-gray-400" />
      case 'submitted':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'submitted': return 'Pending Review'
      case 'approved': return 'Approved'
      case 'paid': return 'Paid'
      case 'rejected': return 'Rejected'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage your invoices</p>
        </div>
      </div>

      {!invoices || invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Invoices Yet</h2>
          <p className="text-gray-500 mb-4">Create invoices from accepted purchase orders</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F15A2B] text-white rounded-lg hover:bg-[#D14A1F]"
          >
            View Purchase Orders
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {invoices.map((invoice: any) => (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {statusIcon(invoice.status)}
                    <div>
                      <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-500">
                        {invoice.purchase_orders?.po_number && `PO: ${invoice.purchase_orders.po_number} • `}
                        {new Date(invoice.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">£{invoice.total_amount?.toFixed(2)}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                      invoice.status === 'approved' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      invoice.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {statusLabel(invoice.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
