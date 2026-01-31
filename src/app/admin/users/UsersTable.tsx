'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Mail, Building2, Shield, User, Loader2 } from 'lucide-react'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  brand_id: string | null
  brands: { id: string; company_name: string; name: string } | null
}

interface Props {
  users: Profile[]
}

export default function UsersTable({ users }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [localUsers, setLocalUsers] = useState<Profile[]>(users)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (userId: string, userEmail: string) => {
    // Prevent deleting admin
    if (userEmail === 'george@shelfdrop.com') {
      alert('Cannot delete admin user')
      return
    }

    if (!confirm(`Are you sure you want to delete ${userEmail}? This action cannot be undone.`)) {
      return
    }

    setDeleting(userId)

    try {
      // Delete from profiles table (auth.users will cascade)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      // Remove from local state immediately
      setLocalUsers(prev => prev.filter(u => u.id !== userId))

      // Also refresh the page data
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(`Failed to delete user: ${error.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return 'bg-purple-100 text-purple-800'
    }
    return 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">All Users ({localUsers.length})</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {localUsers.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {profile.role === 'admin' ? (
                        <Shield className="w-5 h-5 text-purple-600" />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900">
                      {profile.full_name || 'No name'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getRoleBadge(profile.role)}`}>
                    {profile.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {profile.brands ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4" />
                      {profile.brands.company_name || profile.brands.name}
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(profile.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  {profile.email === 'george@shelfdrop.com' ? (
                    <span className="text-xs text-gray-400">Admin</span>
                  ) : (
                    <button
                      onClick={() => handleDelete(profile.id, profile.email)}
                      disabled={deleting === profile.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete user"
                    >
                      {deleting === profile.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
