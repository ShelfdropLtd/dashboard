'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { ArrowLeft } from 'lucide-react'

interface Brand {
  id: string
  name: string
}

interface Order {
  id: string
  po_number: string
  brand_id: string
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
]

export default function NewInvoicePage() {
  const searchParams = useSearchParams()
  const preselectedOrderId = searchParams.get('order')

  const [brands, setBrands] = useState<Brand[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [brandId, setBrandId] = useState('')
  const [orderId, setOrderId] = useState(preselectedOrderId || '')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('pending')
  const [dueDate, setDueDate] = useState('')
  const [paidDate, setPaidDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: brandsData } = await supabase
        .from('brands')
        .select('id, name')
        .order('name')

      if (brandsData) {
        setBrands(brandsData)
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, po_number, brand_id')
        .order('order_date', { ascending: false })

      if (ordersData) {
        setOrders(ordersData)

        // If there's a preselected order, set the brand too
        if (preselectedOrderId) {
          const order = ordersData.find(o => o.id === preselectedOrderId)
          if (order) {
            setBrandId(order.brand_id)
          }
        }
      }
    }
    fetchData()
  }, [supabase, preselectedOrderId])

  // Filter orders by selected brand
  const filteredOrders = brandId
    ? orders.filter(o => o.brand_id === brandId)
    : orders

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!brandId) {
      setError('Please select a brand')
      setLoading(false)
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('invoices')
        .insert({
          brand_id: brandId,
          order_id: orderId || null,
          invoice_number: invoiceNumber,
          amount: parseFloat(amount),
          status,
          due_date: dueDate,
          paid_date: paidDate || null,
        })

      if (insertError) {
        setError(insertError.message)
        return
      }

      router.push('/admin/invoices')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          <p className="text-gray-600">Create a new invoice for a brand</p>
        </div>
      </div>

      <Card className="max-w-xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Select
              id="brand"
              label="Brand"
              required
              value={brandId}
              onChange={(e) => {
                setBrandId(e.target.value)
                setOrderId('') // Reset order when brand changes
              }}
              options={brands.map(b => ({ value: b.id, label: b.name }))}
              placeholder="Select a brand"
            />

            <Select
              id="order"
              label="Related Order (Optional)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              options={filteredOrders.map(o => ({ value: o.id, label: o.po_number }))}
              placeholder="Select an order"
            />

            <Input
              id="invoiceNumber"
              label="Invoice Number"
              type="text"
              required
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-001"
            />

            <Input
              id="amount"
              label="Amount (£)"
              type="number"
              min="0"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />

            <Select
              id="status"
              label="Status"
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
            />

            <Input
              id="dueDate"
              label="Due Date"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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

            <div className="flex gap-3">
              <Button type="submit" loading={loading}>
                Create Invoice
              </Button>
              <Link href="/admin/invoices">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
