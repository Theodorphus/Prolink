import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isOfferParticipant } from '@/lib/marketplace-rules.mjs'
import { messageCursor } from '@/lib/message-cursor.mjs'
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

export async function GET(request: NextRequest, props: { params: Promise<{ offerId: string }> }) {
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

  let cursor
  try { cursor = messageCursor(request.nextUrl.searchParams) }
  catch { return NextResponse.json({ error: 'Ogiltig sidmarkör' }, { status: 400 }) }
  let query = supabase
    .from('messages')
    .select('*, sender:users(id, name, avatar_url)')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: !!cursor?.forward }).order('id', { ascending: !!cursor?.forward }).limit(50)
  if (cursor) query = query.or(cursor.filter)
  const { data, error } = await query

  if (error) return NextResponse.json({ error: 'Meddelandena kunde inte hämtas' }, { status: 500 })
  return NextResponse.json(cursor?.forward ? data : data.reverse())
}

export async function POST(request: NextRequest, props: { params: Promise<{ offerId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  let offerId: string
  let id: string
  let content: string
  let storedAttachmentPath: string | null
  try {
    offerId = uuidValue(params.offerId, 'Offert')
    const body = await request.json()
    id = body.id ? uuidValue(body.id, 'Meddelande') : crypto.randomUUID()
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

  const { data: existing } = await supabase.from('messages').select('*, sender:users(id, name, avatar_url)').eq('id', id).eq('sender_id', user.id).eq('offer_id', offerId).maybeSingle()
  if (existing) return NextResponse.json(existing)

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      id,
      offer_id: offerId,
      sender_id: user.id,
      content,
      attachment_path: storedAttachmentPath,
      attachment_url: null,
    })
    .select('*, sender:users(id, name, avatar_url)')
    .single()

  if (error?.code === '23505') {
    const { data: saved } = await supabase.from('messages').select('*, sender:users(id, name, avatar_url)').eq('id', id).eq('sender_id', user.id).eq('offer_id', offerId).maybeSingle()
    if (saved) return NextResponse.json(saved)
  }
  if (error?.code === '54000') return NextResponse.json({ error: 'För många försök. Vänta en stund och försök igen.' }, { status: 429, headers: { 'Retry-After': '300' } })

  if (error) return NextResponse.json({ error: 'Meddelandet kunde inte skickas' }, { status: 500 })

  return NextResponse.json(message, { status: 201 })
}
