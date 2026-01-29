import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import Badge, { getOrderStatusVariant } from '@/components/ui/Badge'
import { Package, PoundSterling, FileText, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user's brand_id
  const { data: userData } = await supabase
    .from('users')
    .select('brand_id, brands(name)')
    .eq('id', user.id)
    .single() as { data: { brand_id: string | null; brands: { name: string } | null } | null }

  if (!userData?.brand_id) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Shelfdrop</h1>
        <p className="text-gray-600">
          Your account has been created. A Shelfdrop admin will assign you to your brand shortly.
        </p>
      </div>
    )
  }

  const brandId = userData.brand_id

  // Get current month dates
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  // Fetch orders this month
  const { data: monthlyOrders } = await supabase
    .from('orders')
    .select('id, order_lines(line_total)')
    .eq('brand_id', brandId)
    .gte('order_date', startOfMonth.split('T')[0])
    .lte('order_date', endOfMonth.split('T')[0]) as { data: Array<{ id: string; order_lines: Array<{ line_total: number }> }> | null }

  // Calculate monthly stats
  const ordersThisMonth = monthlyOrders?.length ?? 0
  const revenueThisMonth = monthlyOrders?.reduce((total, order) => {
    return total + (order.order_lines?.reduce((sum, line) => sum + (line.line_total ?? 0), 0) ?? 0)
  }, 0) ?? 0

  // Get outstanding invoices
  const { data: outstandingInvoices } = await supabase
    .from('invoices')
    .select('amount')
    .eq('brand_id', brandId)
    .in('status', ['pending', 'overdue']) as { data: Array<{ amount: number }> | null }

  const outstandingAmount = outstandingInvoices?.reduce((sum, inv) => sum + inv.amount, 0) ?? 0

  // Get recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, po_number, order_date, status, order_lines(quantity_cases, line_total)')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(5) as { data: Array<{ id: string; po_number: string; order_date: string; status: string; order_lines: Array<{ quantity_cases: number; line_total: number }> }> | null }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {userData.brands?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="h-6 w-6 text-brand-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Orders this month</p>
                <p className="text-2xl font-bold text-gray-900">{ordersThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <PoundSterling className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Revenue this month</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{revenueThisMonth.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Outstanding invoices</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{outstandingAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link
            href="/orders"
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
                  <TableHead>Date</TableHead>
                  <TableHead>Cases</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => {
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
