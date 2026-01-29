import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user details
  const { data: userData } = await supabase
    .from('users')
    .select('role, brand_id, brands(name)')
    .eq('id', user.id)
    .single() as { data: { role: string; brand_id: string | null; brands: { name: string } | null } | null }

  if (!userData) {
    redirect('/auth/login')
  }

  // Redirect admins to admin dashboard
  if (userData.role === 'admin') {
    redirect('/admin')
  }

  const brandName = userData.brands?.name ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole="brand" brandName={brandName} />
      <div className="lg:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}
