import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  InputValidationError,
  optionalText,
  uuidValue,
} from '@/lib/validation'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  let input: { offerId: string; revieweeId: string; rating: number; comment: string | null }
  try {
    const body = await request.json()
    const rating = Number(body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new InputValidationError('Betyg måste vara ett heltal mellan 1 och 5.')
    }
    input = {
      offerId: uuidValue(body.offer_id, 'Offert'),
      revieweeId: uuidValue(body.reviewee_id, 'Mottagare'),
      rating,
      comment: optionalText(body.comment, 'Omdöme', 2000),
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' },
      { status: 400 }
    )
  }

  // Verify offer is completed and user is a participant
  const { data: offer } = await supabase
    .from('offers')
    .select('id, status, provider_id, job:jobs(customer_id)')
    .eq('id', input.offerId)
    .single()

  if (!offer) return NextResponse.json({ error: 'Offerten hittades inte' }, { status: 404 })
  if (offer.status !== 'completed') return NextResponse.json({ error: 'Uppdraget är inte slutfört' }, { status: 409 })

  const job = Array.isArray(offer.job) ? offer.job[0] : offer.job as any
  const isCustomer = user.id === job?.customer_id
  const isProvider = user.id === offer.provider_id

  if (!isCustomer && !isProvider) {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }

  // Verify reviewee is the other party
  const expectedReviewee = isCustomer ? offer.provider_id : job?.customer_id
  if (input.revieweeId !== expectedReviewee) {
    return NextResponse.json({ error: 'Ogiltig mottagare' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      offer_id: input.offerId,
      reviewer_id: user.id,
      reviewee_id: input.revieweeId,
      rating: input.rating,
      comment: input.comment,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Du har redan lämnat ett omdöme' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Omdömet kunde inte sparas' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
