import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendOfferAcceptedEmail } from '@/lib/email'

const CUSTOMER_STATUSES = ['accepted', 'rejected', 'completed']
const PROVIDER_STATUSES = ['delivered']

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { status } = await request.json()
  const allValid = [...CUSTOMER_STATUSES, ...PROVIDER_STATUSES]
  if (!allValid.includes(status)) {
    return NextResponse.json({ error: 'Ogiltigt status' }, { status: 400 })
  }

  const { data: offer } = await supabase
    .from('offers')
    .select('*, job:jobs(id, title, status, customer_id), provider:users(name)')
    .eq('id', params.id)
    .single()

  if (!offer) return NextResponse.json({ error: 'Offert hittades inte' }, { status: 404 })

  // Prevent accepting an offer on a closed job
  if (status === 'accepted' && offer.job.status !== 'open') {
    return NextResponse.json({ error: 'Uppdraget är inte längre öppet' }, { status: 409 })
  }

  // Prevent acting on an already-finalized offer
  if (['completed', 'rejected'].includes(offer.status)) {
    return NextResponse.json({ error: 'Offerten är redan avslutad' }, { status: 409 })
  }

  const isCustomer = offer.job.customer_id === user.id
  const isProvider = offer.provider_id === user.id

  if (CUSTOMER_STATUSES.includes(status) && !isCustomer) {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }
  if (PROVIDER_STATUSES.includes(status) && !isProvider) {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('offers')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'accepted') {
    // Auto-reject other pending offers for the same job
    await supabase
      .from('offers')
      .update({ status: 'rejected' })
      .eq('job_id', offer.job.id)
      .eq('status', 'pending')
      .neq('id', params.id)

    // Notify provider
    const { data: providerAuth } = await supabase.auth.admin.getUserById(offer.provider_id)
    if (providerAuth?.user?.email) {
      await sendOfferAcceptedEmail({
        to: providerAuth.user.email,
        jobTitle: offer.job.title,
        offerId: offer.id,
      }).catch(console.error)
    }
  }

  if (status === 'completed') {
    await supabase.from('jobs').update({ status: 'closed' }).eq('id', offer.job.id)
  }

  return NextResponse.json(data)
}
