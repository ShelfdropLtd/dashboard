import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import Badge, { getOrderStatusVariant } from '@/components/ui/Badge'

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user's brand_id
  const { data: userData } = await supabase
    .from('users')
    .select('brand_id')
    .eq('id', user.id)
    .single() as { data: { brand_id: string | null } | null }

  if (!userData?.brand_id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No brand assigned yet.</p>
      </div>
    )
  }

  // Fetch all orders for this brand
  const { data: orders } = await supabase
    .from('orders')
    .select('id, po_number, order_date, status, warehouse, order_lines(quantity_cases, line_total)')
    .eq('brand_id', userData.brand_id)
    .order('order_date', { ascending: false }) as { data: Array<{ id: string; po_number: string; order_date: string; status: string; warehouse: string; order_lines: Array<{ quantity_cases: number; line_total: number }> }> | null }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">View all your orders from Amazon</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Cases</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const totalCases = order.order_lines?.reduce((sum, line) => sum + line.quantity_cases, 0) ?? 0
                  const totalValue = order.order_lines?.reduce((sum, line) => sum + (line.line_total ?? 0), 0) ?? 0
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-brand-accent hover:text-indigo-600 font-medium"
                        >
                          {order.po_number}
                        </Link>
                      </TableCell>
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
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No orders yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
