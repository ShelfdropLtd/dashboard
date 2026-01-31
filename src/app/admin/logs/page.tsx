export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Clock,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  Send,
  CreditCard
} from 'lucide-react'

interface LogEntry {
  timestamp: string
  type: 'brand' | 'po' | 'invoice'
  action: string
  description: string
  icon: any
  color: string
}

export default async function AuditLogsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get all brands with timestamps
  const { data: brands } = await supabase
    .from('brands')
    .select('id, company_name, name, onboarding_status, created_at, submitted_at, approved_at, rejected_at')
    .order('created_at', { ascending: false })

  // Get all POs with timestamps
  const { data: pos } = await supabase
    .from('purchase_orders')
    .select('id, po_number, status, created_at, accepted_at, rejected_at, brands(company_name, name)')
    .order('created_at', { ascending: false })

  // Get all invoices with timestamps
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, created_at, submitted_at, brands(company_name, name)')
    .order('created_at', { ascending: false })

  // Build unified log entries
  const logs: LogEntry[] = []

  // Brand events
  brands?.forEach(brand => {
    const brandName = brand.company_name || brand.name || 'Unknown Brand'

    if (brand.created_at) {
      logs.push({
        timestamp: brand.created_at,
        type: 'brand',
        action: 'Account Created',
        description: `${brandName} created an account`,
        icon: Building2,
        color: 'text-blue-500'
      })
    }

    if (brand.submitted_at) {
      logs.push({
        timestamp: brand.submitted_at,
        type: 'brand',
        action: 'Application Submitted',
        description: `${brandName} submitted their application`,
        icon: Send,
        color: 'text-yellow-500'
      })
    }

    if (brand.approved_at) {
      logs.push({
        timestamp: brand.approved_at,
        type: 'brand',
        action: 'Application Approved',
        description: `${brandName} was approved`,
        icon: CheckCircle,
        color: 'text-green-500'
      })
    }

    if (brand.rejected_at) {
      logs.push({
        timestamp: brand.rejected_at,
        type: 'brand',
        action: 'Application Rejected',
        description: `${brandName} was rejected`,
        icon: XCircle,
        color: 'text-red-500'
      })
    }
  })

  // PO events
  pos?.forEach((po: any) => {
    const brandName = po.brands?.company_name || po.brands?.name || 'Unknown Brand'

    logs.push({
      timestamp: po.created_at,
      type: 'po',
      action: 'PO Created',
      description: `${po.po_number} created for ${brandName}`,
      icon: FileText,
      color: 'text-blue-500'
    })

    if (po.accepted_at) {
      logs.push({
        timestamp: po.accepted_at,
        type: 'po',
        action: 'PO Accepted',
        description: `${po.po_number} accepted by ${brandName}`,
        icon: CheckCircle,
        color: 'text-green-500'
      })
    }

    if (po.rejected_at) {
      logs.push({
        timestamp: po.rejected_at,
        type: 'po',
        action: 'PO Rejected',
        description: `${po.po_number} rejected by ${brandName}`,
        icon: XCircle,
        color: 'text-red-500'
      })
    }
  })

  // Invoice events
  invoices?.forEach((invoice: any) => {
    const brandName = invoice.brands?.company_name || invoice.brands?.name || 'Unknown Brand'

    logs.push({
      timestamp: invoice.created_at,
      type: 'invoice',
      action: 'Invoice Created',
      description: `${invoice.invoice_number} created by ${brandName}`,
      icon: FileText,
      color: 'text-blue-500'
    })

    if (invoice.submitted_at && invoice.status !== 'draft') {
      logs.push({
        timestamp: invoice.submitted_at,
        type: 'invoice',
        action: 'Invoice Submitted',
        description: `${invoice.invoice_number} submitted by ${brandName}`,
        icon: Send,
        color: 'text-yellow-500'
      })
    }
  })

  // Sort by timestamp (newest first)
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'brand':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Brand</span>
      case 'po':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">PO</span>
      case 'invoice':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Invoice</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-1">Track all activity across the platform</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h2>
          <p className="text-gray-500">Activity will appear here as brands submit applications, accept POs, and create invoices.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {logs.map((log, index) => {
              const Icon = log.icon
              return (
                <div key={index} className="p-4 flex items-start gap-4">
                  <div className={`p-2 rounded-lg bg-gray-50 ${log.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{log.action}</span>
                      {getTypeBadge(log.type)}
                    </div>
                    <p className="text-sm text-gray-600">{log.description}</p>
                  </div>
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
