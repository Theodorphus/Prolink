import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// /profile/[id] är avsiktligt publik: leverantörsprofilen är plattformens
// viktigaste förtroendesida och måste gå att läsa innan man skapar konto.
// Sidan hämtar bara publika kolumner för andra användare, och privata
// uppgifter (telefon) ligger i user_private_profiles bakom egen RLS.
// Redigeringsformuläret renderas bara för den inloggade ägaren.
const protectedRoutes = ['/jobs/create', '/services/create', '/messages', '/offers']
const authRoutes = ['/login', '/register']

// Sidor som förrenderas och cachas. De läser aldrig sessionen på servern
// (navigeringen hämtar inloggningsläget i webbläsaren, och webbläsarklienten
// förnyar själv sina tokens), så ett anrop till Supabase Auth här skulle bara
// fördröja varje cachad sida med en nätverksrunda.
const staticPublicRoutes = new Set(['/', '/faq', '/terms', '/privacy'])
function isStaticPublic(pathname: string) {
  return staticPublicRoutes.has(pathname) || pathname.startsWith('/hitta/')
}

export async function proxy(request: NextRequest) {
  if (isStaticPublic(request.nextUrl.pathname)) return NextResponse.next()

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
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

  const pathname = request.nextUrl.pathname

  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))
  const isAuthRoute = authRoutes.some(r => pathname.startsWith(r))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('redirect', pathname + request.nextUrl.search)
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie =>
      redirectResponse.cookies.set(cookie)
    )
    return redirectResponse
  }

  if (isAuthRoute && user) {
    const redirectResponse = NextResponse.redirect(new URL('/', request.url))
    supabaseResponse.cookies.getAll().forEach(cookie =>
      redirectResponse.cookies.set(cookie)
    )
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemaps/|api/cron/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
