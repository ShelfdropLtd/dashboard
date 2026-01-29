'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface EditBrandPageProps {
  params: { id: string }
}

export default function EditBrandPage({ params }: EditBrandPageProps) {
  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchBrand() {
      // Create Supabase client only when needed (client-side)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', params.id)
        .single() as { data: { name: string; contact_email: string } | null; error: any }

      if (error || !data) {
        router.push('/admin/brands')
        return
      }

      setName(data.name)
      setContactEmail(data.contact_email)
      setLoading(false)
    }

    fetchBrand()
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    // Create Supabase client only when needed (client-side)
    const supabase = createClient()

    try {
      const { error: updateError } = await supabase
        .from('brands')
        .update({
          name,
          contact_email: contactEmail,
        })
        .eq('id', params.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      router.push('/admin/brands')
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
          href="/admin/brands"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Brand</h1>
          <p className="text-gray-600">Update brand details</p>
        </div>
      </div>

      <Card className="max-w-xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Input
              id="name"
              label="Brand Name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              id="contactEmail"
              label="Contact Email"
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />

            <div className="flex gap-3">
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
              <Link href="/admin/brands">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
