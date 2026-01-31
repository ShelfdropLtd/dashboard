import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Redirect based on role
  if (user.email === 'george@shelfdrop.com') {
    redirect('/admin')
  }

  // Check if brand user has completed onboarding
  const { data: brand } = await supabase
    .from('brands')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  redirect('/dashboard')
}
