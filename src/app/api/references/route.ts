import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createReferenceToken } from '@/lib/references'
import { referenceEmailProblem } from '@/lib/trust.mjs'

const DAILY_LIMIT = 10
const TOTAL_LIMIT = 30

// Frilansaren ber en tidigare kund om en referens. Tabellen är stängd för
// användare, så raden och mejlet skapas här med service-rollen efter att
// avsändaren kontrollerats.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('name, role').eq('id', user.id).single()
  if (profile?.role !== 'provider') return NextResponse.json({ error: 'Bara frilansare kan be om referenser.' }, { status: 403 })

  let email: string
  try {
    email = String((await request.json()).email ?? '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan.' }, { status: 400 })
  }
  const problem = referenceEmailProblem(email, user.email)
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })

  const admin = createAdminClient()
  const { data: existing, error: readError } = await admin.from('external_references').select('client_email, created_at').eq('provider_id', user.id)
  if (readError) return NextResponse.json({ error: 'Förfrågan kunde inte skickas.' }, { status: 500 })
  const duplicate = 'Du har redan bett den här kunden om en referens.'
  if (existing.some(row => row.client_email === email)) return NextResponse.json({ error: duplicate }, { status: 409 })
  const today = existing.filter(row => Date.now() - Date.parse(row.created_at) < 86_400_000).length
  if (today >= DAILY_LIMIT || existing.length >= TOTAL_LIMIT) {
    return NextResponse.json({ error: 'Du har skickat så många förfrågningar som går just nu. Försök igen i morgon.' }, { status: 429 })
  }

  const { token, hash } = createReferenceToken()
  const { data: row, error } = await admin.from('external_references')
    .insert({ provider_id: user.id, client_email: email, token_hash: hash })
    .select('id').single()
  if (error?.code === '23505') return NextResponse.json({ error: duplicate }, { status: 409 })
  if (error) return NextResponse.json({ error: 'Förfrågan kunde inte skickas.' }, { status: 500 })

  const name = profile.name || 'En frilansare'
  const { error: queueError } = await admin.from('notification_outbox').insert({
    recipient_email: email,
    kind: 'reference',
    subject: `${name} ber om ditt omdöme`,
    body: `${name} har angett dig som tidigare kund och ber om ett kort omdöme till sin profil på Prolink. Det tar en minut och du behöver inget konto.`,
    path: `/referens/${token}`,
    dedupe_key: `reference:${row.id}`,
  })
  if (queueError) {
    await admin.from('external_references').delete().eq('id', row.id)
    return NextResponse.json({ error: 'Förfrågan kunde inte skickas.' }, { status: 500 })
  }
  return NextResponse.json({ id: row.id }, { status: 201 })
}
