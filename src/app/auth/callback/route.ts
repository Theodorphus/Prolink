import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { safeRelativePath } from '@/lib/validation'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRelativePath(searchParams.get('next'))
  const role = searchParams.get('role')

  // Mejllänkar (återställning, bekräftelse, magisk länk) går via Supabases
  // /auth/v1/verify och kommer tillbaka med token_hash + type, inte med den
  // code som OAuth använder. Callbacken kände bara igen code, så varje sådan
  // länk avvisades med "Inloggningslänken kunde inte användas".
  const tokenHash = searchParams.get('token_hash')
  const otpType = searchParams.get('type')

  if (!code && !tokenHash) return NextResponse.redirect(`${origin}/login?error=auth`)

  // Svaret skapas före kodutbytet och sessionscookies skrivs direkt på det.
  //
  // Tidigare användes den delade createClient(), som skriver till Next
  // cookies()-store, och därefter returnerades ett nytt NextResponse.redirect().
  // Den omdirigeringen är ett helt eget svarsobjekt och bär inte med sig de
  // cookies som sattes under anropet, så sessionen försvann: inloggningen
  // lyckades hos Supabase men användaren landade utloggad på startsidan.
  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error: sessionError } = tokenHash
    ? await supabase.auth.verifyOtp({
        type: (otpType ?? 'email') as EmailOtpType,
        token_hash: tokenHash,
      })
    : await supabase.auth.exchangeCodeForSession(code!)

  const user = data?.user

  if (sessionError || !user) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const updates: Record<string, string> = {}

  const { data: profile } = await supabase
    .from('users')
    .select('avatar_url, role')
    .eq('id', user.id)
    .single()

  // Rollen kommer från en URL-parameter och kan därför sättas av vem som
  // helst. Den får bara tillämpas när kontot faktiskt skapas: annars skulle
  // ett besök på /auth/callback?role=customer tyst skriva om rollen för en
  // befintlig leverantör. Inloggningsknappen skickar ingen roll, bara
  // registreringen gör det.
  //
  // created_at och last_sign_in_at sätts ett par sekunder isär även för ett
  // helt nytt konto, så en strikt jämförelse skulle aldrig slå till. Ett kort
  // fönster räcker för att skilja registrering från inloggning.
  const signedInAt = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0
  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0
  const isNewUser = signedInAt - createdAt < 10_000
  if (isNewUser && role && ['customer', 'provider'].includes(role) && profile?.role !== role) {
    updates.role = role
  }

  // Sync Google avatar if the user doesn't have one yet
  const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
  if (googleAvatar && !profile?.avatar_url) {
    updates.avatar_url = googleAvatar
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from('users').update(updates).eq('id', user.id)
  }

  return response
}
