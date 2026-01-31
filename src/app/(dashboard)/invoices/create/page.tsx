export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CreateInvoiceForm from './CreateInvoiceForm'

export default async function CreateInvoicePage({
  searchParams
}: {
  searchParams: { po?: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get brand for this user
  const { data: brand } = await supabase
    .from('brands')
    .select('id, company_name')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  // Get PO if specified
  let po = null
  let poItems = null

  if (searchParams.po) {
    const { data } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', searchParams.po)
      .eq('brand_id', brand.id)
      .eq('status', 'accepted')
      .single()

    if (data) {
      po = data

      const { data: items } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('purchase_order_id', searchParams.po)

      poItems = items
    }
  }

  if (searchParams.po && !po) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/invoices"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          {po && (
            <p className="text-gray-600">For {po.po_number}</p>
          )}
        </div>
      </div>

      <CreateInvoiceForm
        brandId={brand.id}
        brandName={brand.company_name || 'Your Company'}
        po={po}
        poItems={poItems || []}
      />
    </div>
  )
}
