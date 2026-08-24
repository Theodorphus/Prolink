import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewOfferEmail } from '@/lib/email'
import { canSubmitOffer } from '@/lib/marketplace-rules.mjs'
import {
  InputValidationError,
  oneOf,
  positivePrice,
  requiredText,
  uuidValue,
} from '@/lib/validation'

const PRICE_TYPES = ['fixed', 'hourly'] as const

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  let input: {
    jobId: string
    price: number
    priceType: 'fixed' | 'hourly'
    timeline: string
    description: string
  }

  try {
    const body = await request.json()
    input = {
      jobId: uuidValue(body.job_id, 'Uppdrag'),
      price: positivePrice(body.price),
      priceType: oneOf(body.price_type, PRICE_TYPES, 'Pristyp'),
      timeline: requiredText(body.timeline, 'Tidsestimat', 2, 120),
      description: requiredText(body.description, 'Offertbeskrivning', 10, 5000),
    }
  } catch (error) {
    const message = error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const [{ data: profile }, { data: job }] = await Promise.all([
    supabase.from('users').select('role, name').eq('id', user.id).single(),
    supabase.from('jobs').select('id, title, customer_id, status').eq('id', input.jobId).single(),
  ])

  if (!job) return NextResponse.json({ error: 'Uppdraget hittades inte' }, { status: 404 })
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
      price_type: input.priceType,
      timeline: input.timeline,
      description: input.description,
      status: 'pending',
    })
    .select('*, job:jobs(title, customer_id), provider:users(name)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Du har redan skickat en offert på uppdraget' }, { status: 409 })
    }
    if (error.code === '42501') {
      return NextResponse.json({ error: 'Offerten kunde inte skickas eftersom uppdraget inte är tillgängligt' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Offerten kunde inte sparas' }, { status: 500 })
  }

  // Email is best-effort and uses a dedicated server-only admin client.
  try {
    const admin = createAdminClient()
    const { data: customerAuth, error: authError } = await admin.auth.admin.getUserById(job.customer_id)
    if (authError) throw authError
    if (customerAuth.user?.email) {
      await sendNewOfferEmail({
        to: customerAuth.user.email,
        jobTitle: job.title,
        providerName: profile?.name ?? 'En leverantör',
        offerId: offer.id,
      })
    }
  } catch (notificationError) {
    console.error('new offer notification failed:', notificationError)
  }

  return NextResponse.json(offer, { status: 201 })
}
