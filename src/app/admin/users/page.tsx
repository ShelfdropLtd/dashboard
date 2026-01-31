export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users as UsersIcon } from 'lucide-react'
import UsersTable from './UsersTable'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get all profiles with their brand associations
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, brands(id, company_name, name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-shelfdrop-blue">Users</h1>
          <p className="text-gray-600">Manage all registered users</p>
        </div>
      </div>

      {!profiles || profiles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No users found</p>
        </div>
      ) : (
        <UsersTable users={profiles} />
      )}
    </div>
  )
}
