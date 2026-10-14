import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canSubmitOffer } from '@/lib/marketplace-rules.mjs'
import { InputValidationError, uuidValue } from '@/lib/validation'
import { parseOfferContent, type OfferContent } from '@/lib/offer-input'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  let input: OfferContent & { jobId: string }

  try {
    const body = await request.json()
    input = { jobId: uuidValue(body.job_id, 'Uppdrag'), ...parseOfferContent(body) }
  } catch (error) {
    const message = error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const [{ data: profile }, { data: job }] = await Promise.all([
    supabase.from('users').select('role, name').eq('id', user.id).single(),
    supabase.from('jobs').select('id, title, customer_id, status').eq('id', input.jobId).single(),
  ])

  if (!job) return NextResponse.json({ error: 'Uppdraget hittades inte' }, { status: 404 })
  // Recover an already committed offer after a lost HTTP response, even if the
  // customer has since accepted it and closed the job.
  const { data: existing, error: existingError } = await supabase.from('offers').select('id').eq('job_id', input.jobId).eq('provider_id', user.id).maybeSingle()
  if (existingError) return NextResponse.json({ error: 'Offerten kunde inte kontrolleras' }, { status: 500 })
  if (existing) return NextResponse.json(existing)
  if (!canSubmitOffer({
    actorId: user.id,
    actorRole: profile?.role,
    requestOwnerId: job.customer_id,
    requestStatus: job.status,
  })) {
    return NextResponse.json(
      { error: job.status !== 'open' ? 'Uppdraget är inte längre öppet' : 'Ej behörig att lämna offert' },
      { status: job.status !== 'open' ? 409 : 403 }
    )
  }

  const { data: offer, error } = await supabase
    .from('offers')
    .insert({
      job_id: input.jobId,
      provider_id: user.id,
      price: input.price,
      price_type: input.price_type,
      timeline: input.timeline,
      description: input.description,
      status: 'pending',
    })
    .select('*, job:jobs(title, customer_id), provider:users(name)')
    .single()

  if (error?.code === '54000') return NextResponse.json({ error: 'För många försök. Vänta en stund och försök igen.' }, { status: 429, headers: { 'Retry-After': '3600' } })

  if (error) {
    if (error.code === '23505') {
      const { data: saved } = await supabase.from('offers').select('id').eq('job_id', input.jobId).eq('provider_id', user.id).maybeSingle()
      if (saved) return NextResponse.json(saved)
      return NextResponse.json({ error: 'Du har redan skickat en offert på uppdraget' }, { status: 409 })
    }
    if (error.code === '42501') {
      return NextResponse.json({ error: 'Offerten kunde inte skickas eftersom uppdraget inte är tillgängligt' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Offerten kunde inte sparas' }, { status: 500 })
  }

  return NextResponse.json(offer, { status: 201 })
}
