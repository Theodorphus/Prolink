import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNewOfferEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const body = await request.json()
  const { job_id, price, price_type, timeline, description } = body

  if (!job_id || !price || !price_type || !timeline || !description) {
    return NextResponse.json({ error: 'Alla fält krävs' }, { status: 400 })
  }

  const { data: offer, error } = await supabase
    .from('offers')
    .insert({ job_id, provider_id: user.id, price: Number(price), price_type, timeline, description })
    .select('*, job:jobs(title, customer_id), provider:users(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Hämta kunds e-post för notis
  const { data: customerAuth } = await supabase.auth.admin.getUserById(offer.job.customer_id)
  if (customerAuth?.user?.email) {
    await sendNewOfferEmail({
      to: customerAuth.user.email,
      jobTitle: offer.job.title,
      providerName: offer.provider.name,
      offerId: offer.id,
    }).catch(console.error)
  }

  return NextResponse.json(offer, { status: 201 })
}
