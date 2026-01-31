export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreatePromotionForm from './CreatePromotionForm'

export default async function CreatePromotionPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get all approved brands
  const { data: brands } = await supabase
    .from('brands')
    .select('id, company_name, name')
    .eq('status', 'approved')
    .order('company_name')

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Promotion</h1>
        <p className="text-gray-600 mt-1">Set up a new promotional campaign for a brand</p>
      </div>

      <CreatePromotionForm brands={brands || []} />
    </div>
  )
}
