export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewInvoiceContent from './NewInvoiceContent'

export default async function NewInvoicePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get all brands for selection
  const { data: brands } = await supabase
    .from('brands')
    .select('id, company_name, name')
    .eq('status', 'approved')
    .order('company_name', { ascending: true })

  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <NewInvoiceContent brands={brands || []} />
    </Suspense>
  )
}
