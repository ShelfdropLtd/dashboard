export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CreateInboundForm from './CreateInboundForm'

export default async function CreateInboundShipmentPage() {
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
        <h1 className="text-2xl font-bold text-shelfdrop-blue">Log Inbound Shipment</h1>
        <p className="text-gray-600">Record a new shipment arriving at the warehouse</p>
      </div>

      <CreateInboundForm brands={brands || []} />
    </div>
  )
}
