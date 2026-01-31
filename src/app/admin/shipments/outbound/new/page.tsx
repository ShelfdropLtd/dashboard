export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CreateOutboundForm from './CreateOutboundForm'

export default async function CreateOutboundShipmentPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get all approved brands
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, company_name')
    .eq('status', 'approved')
    .order('company_name')

  // Get pending/accepted purchase orders for linking
  const { data: orders } = await supabase
    .from('purchase_orders')
    .select('id, reference_number, brand_id, brands(company_name)')
    .in('status', ['accepted', 'pending'])
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/shipments"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shipments
        </Link>
        <h1 className="text-2xl font-bold text-shelfdrop-blue">Create Outbound Shipment</h1>
        <p className="text-gray-600">Ship products to customers on behalf of a brand</p>
      </div>

      <CreateOutboundForm brands={brands || []} orders={orders || []} />
    </div>
  )
}
