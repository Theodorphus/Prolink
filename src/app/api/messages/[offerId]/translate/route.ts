import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isOfferParticipant } from '@/lib/marketplace-rules.mjs'
import { translateMessages } from '@/lib/message-translation'
import { isLocale } from '@/i18n/config'
import { InputValidationError, uuidValue } from '@/lib/validation'
import { msg } from '@/i18n/msg.mjs'

const MAX_IDS = 50

// Översätter andra deltagarens meddelanden till anroparens språk. Meddelandena
// läses med anroparens egen session, så radnivåsäkerheten avgör vad som får ses.
export async function POST(request: NextRequest, props: { params: Promise<{ offerId: string }> }) {
  const params = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  let offerId: string
  let ids: string[]
  let lang: 'sv' | 'en'
  try {
    offerId = uuidValue(params.offerId, msg('Offert'))
    const body = await request.json()
    if (!isLocale(body.lang)) throw new InputValidationError('Ogiltigt språk.')
    lang = body.lang
    if (!Array.isArray(body.ids) || body.ids.length === 0 || body.ids.length > MAX_IDS) throw new InputValidationError('Ogiltig förfrågan.')
    ids = body.ids.map((id: unknown) => uuidValue(id, msg('Meddelande')))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' },
      { status: 400 },
    )
  }

  const { data: offer } = await supabase
    .from('offers')
    .select('provider_id, job:jobs(customer_id)')
    .eq('id', offerId)
    .single()
  const job = offer && (Array.isArray(offer.job) ? offer.job[0] : offer.job)
  if (!offer || !job || !isOfferParticipant(user.id, job.customer_id, offer.provider_id)) {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }

  const { data: rows, error } = await supabase
    .from('messages')
    .select('id, content')
    .eq('offer_id', offerId)
    .neq('sender_id', user.id)
    .in('id', ids)
  if (error) return NextResponse.json({ error: 'Meddelandena kunde inte hämtas' }, { status: 500 })

  const translations = await translateMessages(rows ?? [], lang)
  if (!translations) return NextResponse.json({ error: 'Översättning är inte tillgänglig just nu.' }, { status: 503 })
  return NextResponse.json({ translations: Object.fromEntries(translations) })
}
