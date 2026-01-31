export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Plus, Building2 } from 'lucide-react'
import Link from 'next/link'

export default async function AdminInvoicesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get all invoices with brand info
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, brands(id, company_name, name)')
    .order('created_at', { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'submitted':
        return 'bg-blue-100 text-blue-700'
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      case 'overdue':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage all brand invoices</p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="px-4 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {!invoices || invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Invoices Yet</h2>
          <p className="text-gray-500 mb-4">Create your first invoice to get started.</p>
          <Link
            href="/admin/invoices/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Brand
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {invoice.invoice_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {invoice.brands?.company_name || invoice.brands?.name || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    £{invoice.total_amount?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(invoice.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
