import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOfferAcceptedEmail } from '@/lib/email'
import { canTransitionOffer, OFFER_STATUSES } from '@/lib/marketplace-rules.mjs'
import { InputValidationError, oneOf, uuidValue } from '@/lib/validation'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

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
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: 'Kunde inte uppdatera offerten' }, { status: 500 })
  }

  if (status === 'accepted' && offer.status !== 'accepted') {
    try {
      const admin = createAdminClient()
      const { data: providerAuth, error: authError } = await admin.auth.admin.getUserById(offer.provider_id)
      if (authError) throw authError
      if (providerAuth.user?.email) {
        await sendOfferAcceptedEmail({
          to: providerAuth.user.email,
          jobTitle: job.title,
          offerId: offer.id,
        })
      }
    } catch (notificationError) {
      console.error('offer accepted notification failed:', notificationError)
    }
  }

  const { data } = await supabase.from('offers').select('*').eq('id', offerId).single()

  return NextResponse.json(data)
}
