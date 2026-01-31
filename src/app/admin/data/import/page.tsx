export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, FileSpreadsheet, Plus, Database, RefreshCw } from 'lucide-react'
import DataImportForm from './DataImportForm'

export default async function DataImportPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get brands for dropdown
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, company_name')
    .eq('status', 'approved')
    .order('company_name')

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/data"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Data Management
        </Link>
        <h1 className="text-2xl font-bold text-shelfdrop-blue">Import & Enter Data</h1>
        <p className="text-gray-600">Add sales data, transactions, and financial records</p>
      </div>

      {/* Import Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">CSV Import</h3>
          <p className="text-sm text-gray-600 mb-4">
            Bulk import sales data, transactions, or inventory from spreadsheets
          </p>
          <Link
            href="/admin/data/import/csv"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Manual Entry</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add individual transactions, sales, or financial records
          </p>
          <Link
            href="#manual-entry"
            className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Amazon Sync</h3>
          <p className="text-sm text-gray-600 mb-4">
            Import sales and fees data from Amazon Seller/Vendor Central
          </p>
          <button
            disabled
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed"
          >
            <Database className="w-4 h-4" />
            Coming Soon
          </button>
        </div>
      </div>

      {/* Manual Entry Form */}
      <div id="manual-entry" className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Add Transaction</h2>
          <p className="text-sm text-gray-500">Enter sales, costs, or adjustments manually</p>
        </div>
        <div className="p-6">
          <DataImportForm brands={brands || []} />
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-shelfdrop-yellow/20 rounded-xl border border-shelfdrop-yellow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Data Entry Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Transaction Types</h4>
            <ul className="space-y-1 text-gray-600">
              <li><strong>Sale:</strong> Revenue from product sales (positive)</li>
              <li><strong>Commission:</strong> Shelfdrop commission deducted</li>
              <li><strong>Fulfilment:</strong> Shipping, handling, packaging</li>
              <li><strong>Duty:</strong> Excise duty charges</li>
              <li><strong>Storage:</strong> Warehouse storage fees</li>
              <li><strong>Refund:</strong> Customer refunds</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Best Practices</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Enter sales data monthly for accurate P&L</li>
              <li>• Include all Amazon fees as 'commission'</li>
              <li>• Link transactions to orders when possible</li>
              <li>• Use 'adjustment' for corrections</li>
              <li>• Keep references for audit trail</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
