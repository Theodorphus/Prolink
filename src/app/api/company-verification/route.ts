import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminEmails } from '@/lib/admin'
import { InputValidationError, requiredText } from '@/lib/validation'
import { normalizeOrgNumber } from '@/lib/trust.mjs'

// Frilansaren anger sitt företag. Uppgifterna granskas av en admin innan
// märket visas; databasfunktionen sätter alltid status till pending.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  let input: { orgNumber: string; companyName: string; fSkatt: boolean }
  try {
    const body = await request.json()
    const orgNumber = normalizeOrgNumber(body.org_number)
    if (!orgNumber) throw new InputValidationError('Organisationsnumret är ogiltigt. Kontrollera siffrorna.')
    input = { orgNumber, companyName: requiredText(body.company_name, 'Företagsnamn', 2, 120), fSkatt: body.f_skatt === true }
  } catch (error) {
    return NextResponse.json({ error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' }, { status: 400 })
  }

  const { error } = await supabase.rpc('submit_company_verification', {
    p_org_number: input.orgNumber, p_company_name: input.companyName, p_f_skatt: input.fSkatt,
  })
  if (error?.code === '42501') return NextResponse.json({ error: 'Bara frilansare kan verifiera ett företag.' }, { status: 403 })
  if (error) return NextResponse.json({ error: 'Uppgifterna kunde inte sparas.' }, { status: 500 })

  // Admin får ett mejl per ansökan. Organisationsnumret lämnas ur mejlet:
  // för enskild firma är det ett personnummer. Misslyckas köandet är ansökan
  // ändå sparad och syns i adminpanelen, så felet loggas bara.
  const recipients = adminEmails()
  if (recipients.length === 0) {
    console.error('[e-post] ADMIN_EMAILS saknas — ingen får veta att en verifieringsansökan kommit in.')
  } else {
    const bucket = Math.floor(Date.now() / 300_000)
    const { error: queueError } = await createAdminClient().from('notification_outbox').upsert(recipients.map(email => ({
      recipient_email: email,
      kind: 'admin_verification',
      subject: 'Ny ansökan om företagsverifiering',
      body: `${input.companyName} har ansökt om att bli verifierat. Granska organisationsnummer och F-skatt i adminpanelen.`,
      path: '/admin',
      // Samma frilansare som skickar två gånger inom fem minuter ger ett mejl.
      dedupe_key: `admin_verification:${user.id}:${email}:${bucket}`,
    })), { onConflict: 'dedupe_key', ignoreDuplicates: true })
    if (queueError) console.error('[e-post] Admin-notis om verifiering kunde inte köas:', queueError.message)
  }
  return NextResponse.json({ status: 'pending' })
}
