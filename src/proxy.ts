import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_LOCALE, LOCALE_COOKIE, localePath, splitLocale, type Locale } from '@/i18n/config'

// /profile/[id] är avsiktligt publik: leverantörsprofilen är plattformens
// viktigaste förtroendesida och måste gå att läsa innan man skapar konto.
// Sidan hämtar bara publika kolumner för andra användare, och privata
// uppgifter (telefon) ligger i user_private_profiles bakom egen RLS.
// Redigeringsformuläret renderas bara för den inloggade ägaren.
// /jobs/create är också öppen: köparen skriver uppdraget först och skapar
// konto när det ska publiceras, så att kontot inte stoppar dem innan de börjat.
const protectedRoutes = ['/services/create', '/messages', '/offers']
const authRoutes = ['/login', '/register']

// Sidor som förrenderas och cachas. De läser aldrig sessionen på servern
// (navigeringen hämtar inloggningsläget i webbläsaren, och webbläsarklienten
// förnyar själv sina tokens), så ett anrop till Supabase Auth här skulle bara
// fördröja varje cachad sida med en nätverksrunda.
const staticPublicRoutes = new Set(['/', '/faq', '/terms', '/privacy'])
function isStaticPublic(pathname: string) {
  return staticPublicRoutes.has(pathname) || pathname.startsWith('/hitta/')
}

// Route handlers ligger utanför app/[lang] och har inget språkprefix.
function isHandlerPath(pathname: string) {
  return pathname.startsWith('/api/') || pathname.startsWith('/auth/')
}

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function withLocaleCookie(response: NextResponse, request: NextRequest, locale: Locale) {
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: 'lax' })
  }
  return response
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Språk. Svenska ligger på adresserna utan prefix och skrivs internt om till
  // /sv/..., engelska ligger under /en. /sv/... visas aldrig utåt: den
  // adressen skickas vidare till motsvarande adress utan prefix, så att varje
  // sida bara har en svensk adress.
  let locale: Locale = DEFAULT_LOCALE
  let internalUrl: URL | null = null
  let appPath = pathname
  if (!isHandlerPath(pathname)) {
    const split = splitLocale(pathname)
    locale = split.locale
    appPath = split.path
    if (split.prefixed && split.locale === DEFAULT_LOCALE) {
      const url = request.nextUrl.clone()
      url.pathname = split.path
      return withLocaleCookie(NextResponse.redirect(url, 308), request, DEFAULT_LOCALE)
    }
    if (!split.prefixed) {
      // Den som valt engelska får engelska även via länkar utan prefix.
      if (request.cookies.get(LOCALE_COOKIE)?.value === 'en' && (request.method === 'GET' || request.method === 'HEAD')) {
        const url = request.nextUrl.clone()
        url.pathname = localePath('en', pathname)
        return NextResponse.redirect(url)
      }
      internalUrl = request.nextUrl.clone()
      internalUrl.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
    }
  }

  const proceed = () => {
    const response = internalUrl ? NextResponse.rewrite(internalUrl, { request }) : NextResponse.next({ request })
    return locale === 'en' && !isHandlerPath(pathname) ? withLocaleCookie(response, request, 'en') : response
  }

  if (isStaticPublic(appPath)) return proceed()

  let supabaseResponse = proceed()

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
          supabaseResponse = proceed()
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = protectedRoutes.some(r => appPath.startsWith(r))
  const isAuthRoute = authRoutes.some(r => appPath.startsWith(r))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = localePath(locale, '/login')
    url.search = ''
    url.searchParams.set('redirect', pathname + request.nextUrl.search)
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie =>
      redirectResponse.cookies.set(cookie)
    )
    return redirectResponse
  }

  if (isAuthRoute && user) {
    const redirectResponse = NextResponse.redirect(new URL(localePath(locale, '/'), request.url))
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
