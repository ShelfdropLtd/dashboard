'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge, { getOrderStatusVariant } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'

interface EditOrderPageProps {
  params: { id: string }
}

interface LineItem {
  id?: string
  sku: string
  product_name: string
  quantity_cases: number
  case_price: number
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const warehouseOptions = [
  { value: 'LCB', label: 'LCB' },
  { value: 'brandfs', label: 'brandfs' },
  { value: 'Other', label: 'Other' },
]

export default function EditOrderPage({ params }: EditOrderPageProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [status, setStatus] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [newLineItem, setNewLineItem] = useState<LineItem>({ sku: '', product_name: '', quantity_cases: 1, case_price: 0 })
  const [showAddLine, setShowAddLine] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, brands(name), order_lines(*)')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        router.push('/admin/orders')
        return
      }

      setOrder(data)
      setStatus(data.status)
      setWarehouse(data.warehouse)
      setCarrier(data.carrier || '')
      setTrackingNumber(data.tracking_number || '')
      setNotes(data.notes || '')
      setLineItems(data.order_lines || [])
      setLoading(false)
    }

    fetchOrder()
  }, [params.id, supabase, router])

  const handleSave = async () => {
    setError(null)
    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status,
          warehouse,
          carrier: carrier || null,
          tracking_number: trackingNumber || null,
          notes: notes || null,
        })
        .eq('id', params.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      router.push('/admin/orders')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const addLineItem = async () => {
    if (!newLineItem.sku || !newLineItem.product_name) return

    const { data, error } = await supabase
      .from('order_lines')
      .insert({
        order_id: params.id,
        ...newLineItem,
      })
      .select()
      .single()

    if (!error && data) {
      setLineItems([...lineItems, data])
      setNewLineItem({ sku: '', product_name: '', quantity_cases: 1, case_price: 0 })
      setShowAddLine(false)
    }
  }

  const deleteLineItem = async (lineId: string) => {
    const { error } = await supabase
      .from('order_lines')
      .delete()
      .eq('id', lineId)

    if (!error) {
      setLineItems(lineItems.filter(l => l.id !== lineId))
    }
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity_cases * item.case_price), 0)
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
          href="/admin/orders"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Order {order?.po_number}</h1>
          <p className="text-gray-600">{order?.brands?.name}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2">
              <span className="text-gray-500">PO Number</span>
              <span className="font-medium">{order?.po_number}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Order Date</span>
              <span className="font-medium">
                {new Date(order?.order_date).toLocaleDateString('en-GB')}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Brand</span>
              <span className="font-medium">{order?.brands?.name}</span>
            </div>

            <Select
              id="status"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
            />

            <Select
              id="warehouse"
              label="Warehouse"
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              options={warehouseOptions}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="carrier"
              label="Carrier"
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="e.g. DPD, Royal Mail"
            />

            <Input
              id="trackingNumber"
              label="Tracking Number"
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm text-sm focus:outline-none focus:ring-1 focus:border-brand-accent focus:ring-brand-accent"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddLine(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Cases</TableHead>
                <TableHead className="text-right">Case Price</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-sm">{line.sku}</TableCell>
                  <TableCell>{line.product_name}</TableCell>
                  <TableCell className="text-right">{line.quantity_cases}</TableCell>
                  <TableCell className="text-right">£{line.case_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">
                    £{(line.quantity_cases * line.case_price).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => line.id && deleteLineItem(line.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {showAddLine && (
                <TableRow>
                  <TableCell>
                    <Input
                      type="text"
                      value={newLineItem.sku}
                      onChange={(e) => setNewLineItem({ ...newLineItem, sku: e.target.value })}
                      placeholder="SKU"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={newLineItem.product_name}
                      onChange={(e) => setNewLineItem({ ...newLineItem, product_name: e.target.value })}
                      placeholder="Product name"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={newLineItem.quantity_cases}
                      onChange={(e) => setNewLineItem({ ...newLineItem, quantity_cases: parseInt(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newLineItem.case_price}
                      onChange={(e) => setNewLineItem({ ...newLineItem, case_price: parseFloat(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addLineItem}>Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddLine(false)}>Cancel</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500">Order Total</p>
              <p className="text-2xl font-bold">
                £{calculateTotal().toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
        <Link href="/admin/orders">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
    </div>
  )
}
