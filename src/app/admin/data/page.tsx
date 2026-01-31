export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import DeleteActions from './DeleteActions'

export default async function DataManagementPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Simple admin check by email
  if (user.email !== 'george@shelfdrop.co') {
    redirect('/dashboard')
  }

  // Get counts - handle tables that might not exist
  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: brandsCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })

  // These might not exist yet
  let invoicesCount = 0
  let shipmentsCount = 0

  const invoicesResult = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
  if (!invoicesResult.error) {
    invoicesCount = invoicesResult.count || 0
  }

  const shipmentsResult = await supabase
    .from('shipping_plans')
    .select('*', { count: 'exact', head: true })
  if (!shipmentsResult.error) {
    shipmentsCount = shipmentsResult.count || 0
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
        <p className="text-gray-600 mt-1">Delete test data and clean up the database</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-yellow-800">Warning</h3>
          <p className="text-sm text-yellow-700">
            Deletions are permanent and cannot be undone. This will delete ALL records in each table.
          </p>
        </div>
      </div>

      <DeleteActions
        usersCount={usersCount || 0}
        brandsCount={brandsCount || 0}
        invoicesCount={invoicesCount}
        shipmentsCount={shipmentsCount}
      />
    </div>
  )
}
