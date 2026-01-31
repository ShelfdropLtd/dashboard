import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email === 'george@shelfdrop.com') {
        return NextResponse.redirect(`${origin}/admin`)
      }

      // Check if brand user has completed onboarding
      const { data: brand } = await supabase
        .from('brands')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (brand) {
        return NextResponse.redirect(`${origin}/dashboard`)
      }

      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_error`)
}
