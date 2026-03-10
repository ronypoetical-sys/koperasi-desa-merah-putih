import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Route publik yang tidak butuh auth
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/reset-password']
  const isPublicRoute = publicRoutes.some(r => pathname.startsWith(r))

  // Kalau belum login dan akses halaman protected -> redirect ke login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Kalau sudah login tapi akses halaman auth -> redirect ke dashboard
  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Kalau sudah login, cek apakah koperasi sudah di-setup
  if (user && !isPublicRoute && pathname !== '/setup') {
    const { data: userData } = await supabase
      .from('users')
      .select('koperasi_id')
      .eq('id', user.id)
      .single()

    if (userData && !userData.koperasi_id) {
      return NextResponse.redirect(new URL('/setup', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
