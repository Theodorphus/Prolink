import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendOfferAcceptedEmail } from '@/lib/email'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { status } = await request.json()
  if (!['accepted', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Ogiltigt status' }, { status: 400 })
  }

  // Hämta offert för att validera att det är kunden som uppdaterar
  const { data: offer } = await supabase
    .from('offers')
    .select('*, job:jobs(title, customer_id), provider:users(name)')
    .eq('id', params.id)
    .single()

  if (!offer) return NextResponse.json({ error: 'Offert hittades inte' }, { status: 404 })
  if (offer.job.customer_id !== user.id) return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })

  const { data, error } = await supabase
    .from('offers')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Stäng uppdraget vid accept, notifiera leverantör
  if (status === 'accepted') {
    await supabase.from('jobs').update({ status: 'closed' }).eq('id', offer.job_id)

    const { data: providerAuth } = await supabase.auth.admin.getUserById(offer.provider_id)
    if (providerAuth?.user?.email) {
      await sendOfferAcceptedEmail({
        to: providerAuth.user.email,
        jobTitle: offer.job.title,
        offerId: offer.id,
      }).catch(console.error)
    }
  }

  return NextResponse.json(data)
}
