'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface EditUserPageProps {
  params: { id: string }
}

interface Brand {
  id: string
  name: string
}

const roleOptions = [
  { value: 'brand', label: 'Brand User' },
  { value: 'admin', label: 'Admin' },
]

export default function EditUserPage({ params }: EditUserPageProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [role, setRole] = useState('')
  const [brandId, setBrandId] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      // Fetch user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, brands(name)')
        .eq('id', params.id)
        .single()

      if (userError || !userData) {
        router.push('/admin/users')
        return
      }

      // Fetch brands
      const { data: brandsData } = await supabase
        .from('brands')
        .select('id, name')
        .order('name')

      setUser(userData)
      setRole(userData.role)
      setBrandId(userData.brand_id || '')
      setBrands(brandsData || [])
      setLoading(false)
    }

    fetchData()
  }, [params.id, supabase, router])

  const handleSave = async () => {
    setError(null)
    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role,
          brand_id: role === 'admin' ? null : (brandId || null),
        })
        .eq('id', params.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      router.push('/admin/users')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          <p className="text-gray-600">{user?.email}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <Card className="max-w-xl">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Created</span>
              <span className="font-medium">
                {new Date(user?.created_at).toLocaleDateString('en-GB')}
              </span>
            </div>
          </div>

          <Select
            id="role"
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={roleOptions}
          />

          {role === 'brand' && (
            <Select
              id="brand"
              label="Assigned Brand"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              options={brands.map(b => ({ value: b.id, label: b.name }))}
              placeholder="Select a brand"
            />
          )}

          {role === 'brand' && !brandId && (
            <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              This user won't be able to access any data until assigned to a brand.
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
            <Link href="/admin/users">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
