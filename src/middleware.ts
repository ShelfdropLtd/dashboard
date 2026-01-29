import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const protectedPaths = ['/dashboard', '/orders', '/invoices', '/admin']
  const isProtectedPath = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const authPaths = ['/auth/login', '/auth/signup', '/auth/forgot-password']
  const isAuthPath = authPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (isAuthPath && user) {
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!userData) {
      await supabase.from('users').insert({ id: user.id, email: user.email!, role: 'brand', brand_id: null })
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL(userData.role === 'admin' ? '/admin' : '/dashboard', request.url))
  }

  if (request.nextUrl.pathname.startsWith('/admin') && user) {
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!userData || userData.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
