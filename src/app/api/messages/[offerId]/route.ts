import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewMessageEmail } from '@/lib/email'
import { isOfferParticipant } from '@/lib/marketplace-rules.mjs'
import {
  attachmentPath,
  InputValidationError,
  optionalText,
  uuidValue,
} from '@/lib/validation'

async function getOfferContext(supabase: Awaited<ReturnType<typeof createClient>>, offerId: string) {
  const { data } = await supabase
    .from('offers')
    .select('provider_id, job:jobs(customer_id, title)')
    .eq('id', offerId)
    .single()

  if (!data) return null
  const job = Array.isArray(data.job) ? data.job[0] : data.job
  if (!job) return null
  return { offer: data, job }
}

export async function GET(_: NextRequest, props: { params: Promise<{ offerId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  let offerId: string
  try {
    offerId = uuidValue(params.offerId, 'Offert')
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' },
      { status: 400 }
    )
  }

  const context = await getOfferContext(supabase, offerId)
  if (!context || !isOfferParticipant(user.id, context.job.customer_id, context.offer.provider_id)) {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users(id, name, avatar_url)')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, props: { params: Promise<{ offerId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  let offerId: string
  let content: string
  let storedAttachmentPath: string | null
  try {
    offerId = uuidValue(params.offerId, 'Offert')
    const body = await request.json()
    content = optionalText(body.content, 'Meddelande', 5000) ?? ''
    storedAttachmentPath = attachmentPath(body.attachment_path, offerId)
    if (!content && !storedAttachmentPath) {
      throw new InputValidationError('Meddelande eller bilaga krävs.')
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' },
      { status: 400 }
    )
  }

  const context = await getOfferContext(supabase, offerId)
  if (!context || !isOfferParticipant(user.id, context.job.customer_id, context.offer.provider_id)) {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      offer_id: offerId,
      sender_id: user.id,
      content,
      attachment_path: storedAttachmentPath,
      attachment_url: null,
    })
    .select('*, sender:users(id, name, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Email is best-effort and runs only after participant authorization.
  try {
    const recipientId = user.id === context.offer.provider_id
      ? context.job.customer_id
      : context.offer.provider_id
    const admin = createAdminClient()
    const { data: recipientAuth, error: authError } = await admin.auth.admin.getUserById(recipientId)
    if (authError) throw authError
    const sender = Array.isArray(message.sender) ? message.sender[0] : message.sender

    if (recipientAuth.user?.email) {
      await sendNewMessageEmail({
        to: recipientAuth.user.email,
        senderName: sender?.name ?? '',
        jobTitle: context.job.title,
        offerId,
      })
    }
  } catch (notificationError) {
    console.error('new message notification failed:', notificationError)
  }

  return NextResponse.json(message, { status: 201 })
}
