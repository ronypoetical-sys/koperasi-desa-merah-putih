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

  // PENTING: Selalu panggil getUser() untuk refresh session cookie
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Route publik
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/update-password']
  const isPublicRoute = publicRoutes.some(r => pathname.startsWith(r))

  // Belum login → redirect ke login (kecuali sudah di public route)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Sudah login → jangan biarkan akses halaman auth
  if (user && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Sudah login, cek setup koperasi — HANYA untuk route dashboard (bukan /setup)
  if (user && !isPublicRoute && pathname !== '/setup') {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('koperasi_id')
        .eq('id', user.id)
        .single()

      if (userData && !userData.koperasi_id) {
        const url = request.nextUrl.clone()
        url.pathname = '/setup'
        return NextResponse.redirect(url)
      }
    } catch {
      // Jika DB error, biarkan lewat — halaman sendiri yang akan handle
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
