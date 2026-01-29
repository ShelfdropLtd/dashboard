import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import Badge, { getOrderStatusVariant } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Plus } from 'lucide-react'

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  // Fetch all orders with brand info
  const { data: orders } = await supabase
    .from('orders')
    .select('*, brands(name), order_lines(quantity_cases, line_total)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage all orders across brands</p>
        </div>
        <Link href="/admin/orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Order
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Cases</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => {
                  const totalCases = order.order_lines?.reduce((sum: number, line: any) => sum + line.quantity_cases, 0) ?? 0
                  const totalValue = order.order_lines?.reduce((sum: number, line: any) => sum + (line.line_total ?? 0), 0) ?? 0
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.po_number}</TableCell>
                      <TableCell>{order.brands?.name || '-'}</TableCell>
                      <TableCell>
                        {new Date(order.order_date).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>{order.warehouse}</TableCell>
                      <TableCell>{totalCases}</TableCell>
                      <TableCell>
                        £{totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getOrderStatusVariant(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-brand-accent hover:text-indigo-600 text-sm font-medium"
                        >
                          Edit
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No orders yet</p>
              <Link href="/admin/orders/new" className="text-brand-accent hover:text-indigo-600 mt-2 inline-block">
                Create your first order
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
