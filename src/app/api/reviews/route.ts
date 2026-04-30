import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const body = await request.json()
  const { offer_id, reviewee_id, rating, comment } = body

  if (!offer_id || !reviewee_id || !rating) {
    return NextResponse.json({ error: 'Alla fält krävs' }, { status: 400 })
  }

  const parsedRating = Number(rating)
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return NextResponse.json({ error: 'Betyg måste vara mellan 1 och 5' }, { status: 400 })
  }

  // Verify offer is completed and user is a participant
  const { data: offer } = await supabase
    .from('offers')
    .select('id, status, provider_id, job:jobs(customer_id)')
    .eq('id', offer_id)
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
  if (reviewee_id !== expectedReviewee) {
    return NextResponse.json({ error: 'Ogiltig mottagare' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      offer_id,
      reviewer_id: user.id,
      reviewee_id,
      rating: parsedRating,
      comment: comment?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Du har redan lämnat ett omdöme' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
