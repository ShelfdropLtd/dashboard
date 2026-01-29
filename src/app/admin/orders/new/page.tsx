'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface LineItem {
  sku: string
  product_name: string
  quantity_cases: number
  case_price: number
}

interface Brand {
  id: string
  name: string
}

const warehouseOptions = [
  { value: 'LCB', label: 'LCB' },
  { value: 'brandfs', label: 'brandfs' },
  { value: 'Other', label: 'Other' },
]

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function NewOrderPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [brandId, setBrandId] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('pending')
  const [warehouse, setWarehouse] = useState('')
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { sku: '', product_name: '', quantity_cases: 1, case_price: 0 }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchBrands() {
      const { data } = await supabase
        .from('brands')
        .select('id, name')
        .order('name')

      if (data) {
        setBrands(data)
      }
    }
    fetchBrands()
  }, [supabase])

  const addLineItem = () => {
    setLineItems([...lineItems, { sku: '', product_name: '', quantity_cases: 1, case_price: 0 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity_cases * item.case_price), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!brandId) {
      setError('Please select a brand')
      setLoading(false)
      return
    }

    if (!warehouse) {
      setError('Please select a warehouse')
      setLoading(false)
      return
    }

    try {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          brand_id: brandId,
          po_number: poNumber,
          order_date: orderDate,
          status,
          warehouse,
          carrier: carrier || null,
          tracking_number: trackingNumber || null,
          notes: notes || null,
        })
        .select()
        .single()

      if (orderError) {
        setError(orderError.message)
        return
      }

      // Create the line items
      const lineItemsData = lineItems
        .filter(item => item.sku && item.product_name)
        .map(item => ({
          order_id: order.id,
          sku: item.sku,
          product_name: item.product_name,
          quantity_cases: item.quantity_cases,
          case_price: item.case_price,
        }))

      if (lineItemsData.length > 0) {
        const { error: linesError } = await supabase
          .from('order_lines')
          .insert(lineItemsData)

        if (linesError) {
          setError(linesError.message)
          return
        }
      }

      router.push('/admin/orders')
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
          href="/admin/orders"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Order</h1>
          <p className="text-gray-600">Create a new order for a brand</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                id="brand"
                label="Brand"
                required
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                options={brands.map(b => ({ value: b.id, label: b.name }))}
                placeholder="Select a brand"
              />

              <Input
                id="poNumber"
                label="PO Number"
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-123456"
              />

              <Input
                id="orderDate"
                label="Order Date"
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />

              <Select
                id="status"
                label="Status"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={statusOptions}
              />

              <Select
                id="warehouse"
                label="Warehouse"
                required
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                options={warehouseOptions}
                placeholder="Select warehouse"
              />

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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm text-sm focus:outline-none focus:ring-1 focus:border-brand-accent focus:ring-brand-accent"
                placeholder="Any additional notes..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      label="SKU"
                      type="text"
                      value={item.sku}
                      onChange={(e) => updateLineItem(index, 'sku', e.target.value)}
                      placeholder="SKU"
                    />
                    <Input
                      label="Product Name"
                      type="text"
                      value={item.product_name}
                      onChange={(e) => updateLineItem(index, 'product_name', e.target.value)}
                      placeholder="Product name"
                    />
                    <Input
                      label="Cases"
                      type="number"
                      min="1"
                      value={item.quantity_cases}
                      onChange={(e) => updateLineItem(index, 'quantity_cases', parseInt(e.target.value) || 0)}
                    />
                    <Input
                      label="Case Price (£)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.case_price}
                      onChange={(e) => updateLineItem(index, 'case_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
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
          <Button type="submit" loading={loading}>
            Create Order
          </Button>
          <Link href="/admin/orders">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
