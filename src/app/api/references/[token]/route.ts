import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { InputValidationError, optionalText, requiredText } from '@/lib/validation'
import { referenceTokenHash } from '@/lib/references'

// Den tidigare kunden lämnar sitt omdöme. Länken är engångs: raden uppdateras
// bara om den inte redan besvarats och inte har gått ut.
export async function POST(request: NextRequest, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  const tokenHash = referenceTokenHash(token)
  if (!tokenHash) return NextResponse.json({ error: 'Länken är ogiltig.' }, { status: 404 })

  let input: { client_name: string; client_company: string | null; rating: number; comment: string | null }
  try {
    const body = await request.json()
    const rating = Number(body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new InputValidationError('Välj ett betyg mellan 1 och 5.')
    if (body.confirm !== true) throw new InputValidationError('Bekräfta att du har anlitat frilansaren.')
    input = {
      client_name: requiredText(body.client_name, 'Namn', 1, 100),
      client_company: optionalText(body.client_company, 'Företag', 120),
      rating,
      comment: optionalText(body.comment, 'Omdöme', 2000),
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  const { data, error } = await admin.from('external_references')
    .update({ ...input, submitted_at: now })
    .eq('token_hash', tokenHash)
    .is('submitted_at', null)
    .gt('expires_at', now)
    .select('provider_id')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Omdömet kunde inte sparas.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Länken har redan använts eller har gått ut.' }, { status: 410 })
  return NextResponse.json({ providerId: data.provider_id })
}
