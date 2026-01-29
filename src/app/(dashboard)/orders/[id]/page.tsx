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

  if (!userData?.brand_id) {
    redirect('/dashboard')
  }

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
