'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface EditInvoicePageProps {
  params: { id: string }
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
]

export default function EditInvoicePage({ params }: EditInvoicePageProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<any>(null)
  const [status, setStatus] = useState('')
  const [paidDate, setPaidDate] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchInvoice() {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, brands(name), orders(po_number)')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        router.push('/admin/invoices')
        return
      }

      setInvoice(data)
      setStatus(data.status)
      setPaidDate(data.paid_date || '')
      setLoading(false)
    }

    fetchInvoice()
  }, [params.id, supabase, router])

  const handleSave = async () => {
    setError(null)
    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status,
          paid_date: status === 'paid' ? (paidDate || new Date().toISOString().split('T')[0]) : null,
        })
        .eq('id', params.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      router.push('/admin/invoices')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/invoices"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Invoice {invoice?.invoice_number}</h1>
          <p className="text-gray-600">{invoice?.brands?.name}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <Card className="max-w-xl">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Invoice Number</span>
              <span className="font-medium">{invoice?.invoice_number}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Brand</span>
              <span className="font-medium">{invoice?.brands?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Related Order</span>
              <span className="font-medium">{invoice?.orders?.po_number || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Amount</span>
              <span className="font-medium">
                £{invoice?.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Due Date</span>
              <span className="font-medium">
                {new Date(invoice?.due_date).toLocaleDateString('en-GB')}
              </span>
            </div>
          </div>

          <Select
            id="status"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={statusOptions}
          />

          {status === 'paid' && (
            <Input
              id="paidDate"
              label="Paid Date"
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
            />
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
            <Link href="/admin/invoices">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
