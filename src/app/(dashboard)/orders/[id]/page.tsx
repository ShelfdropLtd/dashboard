import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import Badge, { getOrderStatusVariant } from '@/components/ui/Badge'
import OrderAcceptance from '@/components/orders/OrderAcceptance'
import { ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react'

interface OrderDetailPageProps {
  params: { id: string }
}

const statusSteps = [
  { status: 'pending', label: 'Pending', icon: Clock },
  { status: 'approved', label: 'Approved', icon: CheckCircle },
  { status: 'dispatched', label: 'Dispatched', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Package },
]

function getStatusIndex(status: string): number {
  if (status === 'cancelled') return -1
  return statusSteps.findIndex(step => step.status === status)
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: userData } = await supabase
    .from('users')
    .select('brand_id')
    .eq('id', user.id)
    .single() as { data: { brand_id: string | null } | null }

  if (!userData?.brand_id) redirect('/dashboard')

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_lines(*)')
    .eq('id', params.id)
    .eq('brand_id', userData.brand_id)
    .single() as { data: {
      id: string; po_number: string; order_date: string; status: string; warehouse: string;
      carrier: string | null; tracking_number: string | null; notes: string | null;
      acceptance_status: string; rejection_reason: string | null; brand_comment: string | null; admin_reply: string | null;
      order_lines: Array<{ id: string; sku: string; product_name: string; quantity_cases: number; case_price: number; line_total: number }>
    } | null }

  if (!order) notFound()

  const orderTotal = order.order_lines?.reduce((sum, line) => sum + (line.line_total ?? 0), 0) ?? 0
  const totalCases = order.order_lines?.reduce((sum, line) => sum + line.quantity_cases, 0) ?? 0
  const currentStatusIndex = getStatusIndex(order.status)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order {order.po_number}</h1>
          <p className="text-gray-600">{new Date(order.order_date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Order Response</CardTitle></CardHeader>
        <CardContent>
          <OrderAcceptance orderId={order.id} currentStatus={order.acceptance_status || 'pending_review'} rejectionReason={order.rejection_reason} brandComment={order.brand_comment} adminReply={order.admin_reply} />
        </CardContent>
      </Card>

      {order.status !== 'cancelled' ? (
        <Card>
          <CardContent className="py-6">
            <div className="flex justify-between">
              {statusSteps.map((step, index) => {
                const Icon = step.icon
                const isCompleted = index <= currentStatusIndex
                const isCurrent = index === currentStatusIndex
                return (
                  <div key={step.status} className="flex flex-col items-center flex-1">
                    <div className="flex items-center w-full">
                      {index > 0 && <div className={`flex-1 h-1 ${index <= currentStatusIndex ? 'bg-brand-accent' : 'bg-gray-200'}`} />}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-brand-accent text-white' : 'bg-gray-200 text-gray-500'} ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {index < statusSteps.length - 1 && <div className={`flex-1 h-1 ${index < currentStatusIndex ? 'bg-brand-accent' : 'bg-gray-200'}`} />}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>{step.label}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-6"><div className="flex items-center justify-center gap-2 text-red-600"><XCircle className="h-6 w-6" /><span className="font-medium">This order has been cancelled</span></div></CardContent></Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between"><span className="text-gray-500">PO Number</span><span className="font-medium">{order.po_number}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Order Date</span><span className="font-medium">{new Date(order.order_date).toLocaleDateString('en-GB')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span><Badge variant={getOrderStatusVariant(order.status)}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Badge></div>
            <div className="flex justify-between"><span className="text-gray-500">Warehouse</span><span className="font-medium">{order.warehouse}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Shipping Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between"><span className="text-gray-500">Carrier</span><span className="font-medium">{order.carrier || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tracking Number</span><span className="font-medium">{order.tracking_number || '-'}</span></div>
            {order.notes && <div><span className="text-gray-500 block mb-1">Notes</span><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{order.notes}</p></div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Product Name</TableHead><TableHead className="text-right">Cases</TableHead><TableHead className="text-right">Case Price</TableHead><TableHead className="text-right">Line Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {order.order_lines?.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-sm">{line.sku}</TableCell>
                  <TableCell>{line.product_name}</TableCell>
                  <TableCell className="text-right">{line.quantity_cases}</TableCell>
                  <TableCell className="text-right">£{line.case_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">£{(line.line_total ?? 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-end gap-8">
              <div className="text-right"><p className="text-sm text-gray-500">Total Cases</p><p className="text-lg font-semibold">{totalCases}</p></div>
              <div className="text-right"><p className="text-sm text-gray-500">Order Total</p><p className="text-2xl font-bold text-gray-900">£{orderTotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
