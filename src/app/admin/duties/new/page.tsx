export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CreateDutyEntryForm from './CreateDutyEntryForm'

export default async function CreateDutyEntryPage() {
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

  // Get duty rates for calculation
  const { data: dutyRates } = await supabase
    .from('duty_rates')
    .select('*')
    .order('category')

  // Get recent inbound shipments for linking
  const { data: inboundShipments } = await supabase
    .from('inbound_shipments')
    .select('id, reference_number, brand_id, brands(company_name)')
    .eq('status', 'received')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/duties"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Duties
        </Link>
        <h1 className="text-2xl font-bold text-shelfdrop-blue">Record Duty Entry</h1>
        <p className="text-gray-600">Log duty paid to HMRC for stock release from bond</p>
      </div>

      <CreateDutyEntryForm
        brands={brands || []}
        dutyRates={dutyRates || []}
        inboundShipments={inboundShipments || []}
      />
    </div>
  )
}
