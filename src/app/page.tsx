import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user role to redirect appropriately
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // If no user record, create one and go to dashboard
  if (!userData) {
    await supabase.from('users').insert({
      id: user.id,
      email: user.email!,
      role: 'brand',
      brand_id: null,
    })
    redirect('/dashboard')
  }

  if (userData.role === 'admin') {
    redirect('/admin')
  }

  redirect('/dashboard')
}
