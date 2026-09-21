import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeRelativePath } from '@/lib/validation'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRelativePath(searchParams.get('next'))
  const role = searchParams.get('role')

  if (!code) return NextResponse.redirect(`${origin}/login?error=auth`)

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      return NextResponse.redirect(`${origin}/login?error=auth`)
    }

    if (user) {
      const updates: Record<string, string> = {}

      const { data: profile } = await supabase
        .from('users')
        .select('avatar_url, role')
        .eq('id', user.id)
        .single()

      // Rollen kommer från en URL-parameter och kan därför sättas av vem som
      // helst. Den får bara tillämpas när kontot faktiskt skapas: annars
      // skulle ett besök på /auth/callback?role=customer tyst skriva om
      // rollen för en befintlig leverantör. Inloggningsknappen skickar ingen
      // roll, bara registreringen gör det.
      // created_at och last_sign_in_at sätts ett par sekunder isär även för
      // ett helt nytt konto, så en strikt jämförelse skulle aldrig slå till.
      // Ett kort fönster räcker för att skilja registrering från inloggning.
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
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
