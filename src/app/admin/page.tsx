import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import Badge, { getOrderStatusVariant } from '@/components/ui/Badge'
import { Building2, Package, FileText, Users, ArrowRight } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Get counts
  const { count: brandsCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })

  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  const { count: pendingOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Get recent orders across all brands
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, po_number, order_date, status, brands(name), order_lines(quantity_cases, line_total)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of all brands and orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Building2 className="h-6 w-6 text-brand-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Brands</p>
                <p className="text-2xl font-bold text-gray-900">{brandsCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{ordersCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{pendingOrdersCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{usersCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders (All Brands)</CardTitle>
          <Link
            href="/admin/orders"
            className="text-sm text-brand-accent hover:text-indigo-600 flex items-center"
          >
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders && recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Cases</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order: any) => {
                  const totalCases = order.order_lines?.reduce((sum: number, line: any) => sum + line.quantity_cases, 0) ?? 0
                  const totalValue = order.order_lines?.reduce((sum: number, line: any) => sum + (line.line_total ?? 0), 0) ?? 0
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-brand-accent hover:text-indigo-600 font-medium"
                        >
                          {order.po_number}
                        </Link>
                      </TableCell>
                      <TableCell>{order.brands?.name || '-'}</TableCell>
                      <TableCell>
                        {new Date(order.order_date).toLocaleDateString('en-GB')}
                      </TableCell>
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
            <div className="text-center py-8 text-gray-500">
              No orders yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
