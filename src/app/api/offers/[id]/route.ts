import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canTransitionOffer, OFFER_STATUSES } from '@/lib/marketplace-rules.mjs'
import { InputValidationError, oneOf, uuidValue } from '@/lib/validation'
import { parseOfferContent } from '@/lib/offer-input'

// transition_offer i databasen kastar engelska felmeddelanden. De affärsregler
// en användare faktiskt kan träffa översätts här så att gränssnittet är på
// svenska och inte exponerar databasens formuleringar.
function transitionErrorMessage(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('already has a winning offer')) {
    return 'Uppdraget har redan en accepterad offert.'
  }
  if (normalized.includes('no longer open')) {
    return 'Uppdraget är inte längre öppet.'
  }
  if (normalized.includes('invalid offer transition')) {
    return 'Offerten kan inte ändras till den statusen.'
  }

  return 'Offerten kunde inte uppdateras.'
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  // Leverantören redigerar innehållet i en offert som väntar på svar. Databas-
  // funktionen kontrollerar att anroparen är leverantören och att offerten
  // fortfarande väntar, och meddelar kunden.
  const raw = await request.clone().json().catch(() => null)
  if (raw && typeof raw === 'object' && !('status' in raw) && 'description' in raw) {
    let content
    try {
      uuidValue(params.id, 'Offert')
      content = parseOfferContent(raw)
    } catch (error) {
      return NextResponse.json({ error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' }, { status: 400 })
    }
    const { error } = await supabase.rpc('edit_offer', {
      p_offer_id: params.id, p_price: content.price, p_price_type: content.price_type,
      p_timeline: content.timeline, p_description: content.description,
    })
    if (error?.code === '42501') return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
    if (error?.code === '23514') return NextResponse.json({ error: 'Offerten kan inte längre redigeras. Den är inte längre obesvarad.' }, { status: 409 })
    if (error) return NextResponse.json({ error: 'Offerten kunde inte uppdateras.' }, { status: 500 })
    return NextResponse.json({ id: params.id })
  }

  let offerId: string
  let status: 'pending' | 'accepted' | 'rejected' | 'delivered' | 'completed'
  try {
    offerId = uuidValue(params.id, 'Offert')
    const body = await request.json()
    status = oneOf(body.status, OFFER_STATUSES, 'Status')
  } catch (error) {
    const message = error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { data: offer } = await supabase
    .from('offers')
    .select('*, job:jobs(id, title, status, customer_id), provider:users(name)')
    .eq('id', offerId)
    .single()

  if (!offer) return NextResponse.json({ error: 'Offert hittades inte' }, { status: 404 })

  const job = Array.isArray(offer.job) ? offer.job[0] : offer.job
  if (!job) return NextResponse.json({ error: 'Uppdraget hittades inte' }, { status: 404 })

  if (status === 'accepted' && job.status !== 'open' && offer.status !== 'accepted') {
    return NextResponse.json({ error: 'Uppdraget är inte längre öppet' }, { status: 409 })
  }

  // Kunden godkänner det hen har läst. Har leverantören ändrat offerten sedan
  // sidan laddades får kunden först se den nya versionen.
  if (status === 'accepted' && (raw?.seen_version ?? null) !== (offer.edited_at ?? null)) {
    return NextResponse.json({ error: 'Offerten har ändrats sedan du öppnade den. Ladda om sidan och läs igenom den igen.' }, { status: 409 })
  }

  if (!canTransitionOffer({
    actorId: user.id,
    customerId: job.customer_id,
    providerId: offer.provider_id,
    currentStatus: offer.status,
    nextStatus: status,
  })) {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }

  const { error } = await supabase.rpc('transition_offer', {
    p_offer_id: offerId,
    p_new_status: status,
  })

  if (error) {
    if (error.code === '42501') return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
    if (error.code === '23505' || error.code === '23514') {
      return NextResponse.json({ error: transitionErrorMessage(error.message) }, { status: 409 })
    }
    return NextResponse.json({ error: 'Kunde inte uppdatera offerten' }, { status: 500 })
  }

  const { data } = await supabase.from('offers').select('*').eq('id', offerId).single()

  return NextResponse.json(data)
}
