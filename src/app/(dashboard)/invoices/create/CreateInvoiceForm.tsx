'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FileText, Upload, Loader2, Package } from 'lucide-react'

interface POItem {
  id: string
  sku_code: string
  product_name: string
  quantity: number
  unit_cost: number
  total_cost: number
  brand_product_id: string
}

interface CreateInvoiceFormProps {
  brandId: string
  brandName: string
  po: any
  poItems: POItem[]
}

export default function CreateInvoiceForm({ brandId, brandName, po, poItems }: CreateInvoiceFormProps) {
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'auto' | 'upload'>('auto')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!invoiceNumber.trim()) {
      alert('Please enter an invoice number')
      return
    }

    setLoading(true)

    try {
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          brand_id: brandId,
          purchase_order_id: po?.id || null,
          invoice_number: invoiceNumber,
          status: 'submitted',
          total_amount: po?.total_amount || 0,
          pdf_url: pdfUrl || null,
          notes: notes || null,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create invoice items from PO items (locked prices)
      if (po && poItems.length > 0) {
        const invoiceItems = poItems.map(item => ({
          invoice_id: invoice.id,
          brand_product_id: item.brand_product_id,
          sku_code: item.sku_code,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total_cost: item.total_cost,
        }))

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems)

        if (itemsError) throw itemsError
      }

      router.push('/invoices')
      router.refresh()
    } catch (error: any) {
      alert(`Failed to create invoice: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Invoice Method</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMode('auto')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              mode === 'auto'
                ? 'border-[#F15A2B] bg-[#F15A2B]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FileText className={`w-6 h-6 mx-auto mb-2 ${mode === 'auto' ? 'text-[#F15A2B]' : 'text-gray-400'}`} />
            <p className="font-medium text-gray-900">Auto-fill from PO</p>
            <p className="text-sm text-gray-500 mt-1">Items and prices locked</p>
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              mode === 'upload'
                ? 'border-[#F15A2B] bg-[#F15A2B]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Upload className={`w-6 h-6 mx-auto mb-2 ${mode === 'upload' ? 'text-[#F15A2B]' : 'text-gray-400'}`} />
            <p className="font-medium text-gray-900">Upload PDF</p>
            <p className="text-sm text-gray-500 mt-1">Attach your own invoice</p>
          </button>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Invoice Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-001"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PO Reference</label>
            <input
              type="text"
              value={po?.po_number || 'N/A'}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>

        {mode === 'upload' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF URL</label>
            <input
              type="url"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Enter a link to your invoice PDF</p>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any additional notes..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
          />
        </div>
      </div>

      {/* Items Preview (from PO - locked) */}
      {po && poItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Invoice Items</h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Locked from PO</span>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {poItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-500">{item.sku_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">£{item.unit_cost?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">£{item.total_cost?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-900">Total</td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">£{po.total_amount?.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-[#F15A2B] text-white rounded-lg hover:bg-[#D14A1F] disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          Submit Invoice
        </button>
      </div>
    </form>
  )
}
