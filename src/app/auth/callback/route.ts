import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeRelativePath } from '@/lib/validation'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRelativePath(searchParams.get('next'))
  const role = searchParams.get('role')

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      return NextResponse.redirect(`${origin}/login?error=auth`)
    }

    if (user) {
      const updates: Record<string, string> = {}

      // Apply role if registering via Google (defaults to 'customer' from trigger otherwise)
      if (role && ['customer', 'provider'].includes(role)) {
        updates.role = role
      }

      // Sync Google avatar if the user doesn't have one yet
      const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
      if (googleAvatar) {
        const { data: profile } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
        if (!profile?.avatar_url) {
          updates.avatar_url = googleAvatar
        }
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('users').update(updates).eq('id', user.id)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
