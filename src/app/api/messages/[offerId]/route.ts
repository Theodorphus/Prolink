import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNewMessageEmail } from '@/lib/email'

export async function GET(_: NextRequest, { params }: { params: { offerId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users(id, name, avatar_url)')
    .eq('offer_id', params.offerId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, { params }: { params: { offerId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const body = await request.json()
  const { content, attachment_url } = body

  if (!content?.trim()) return NextResponse.json({ error: 'Meddelande får inte vara tomt' }, { status: 400 })

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ offer_id: params.offerId, sender_id: user.id, content: content.trim(), attachment_url: attachment_url ?? null })
    .select('*, sender:users(id, name, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notifiera mottagaren
  const { data: offer } = await supabase
    .from('offers')
    .select('provider_id, job:jobs(customer_id, title)')
    .eq('id', params.offerId)
    .single()

  if (offer) {
    const job = Array.isArray(offer.job) ? offer.job[0] : offer.job as any
    const recipientId = user.id === offer.provider_id ? job?.customer_id : offer.provider_id
    const { data: recipientAuth } = await supabase.auth.admin.getUserById(recipientId)
    const senderProfile = (message as any).sender

    if (recipientAuth?.user?.email) {
      await sendNewMessageEmail({
        to: recipientAuth.user.email,
        senderName: senderProfile?.name ?? '',
        jobTitle: job?.title ?? '',
        offerId: params.offerId,
      }).catch(console.error)
    }
  }

  return NextResponse.json(message, { status: 201 })
}
