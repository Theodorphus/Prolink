import { PAGE_SIZE, pageNumber } from '@/lib/pagination'
import { after, NextRequest, NextResponse } from 'next/server'
import { warmTranslation } from '@/lib/content-translation'
import { createClient } from '@/lib/supabase/server'
import { InputValidationError, uuidValue } from '@/lib/validation'
import { parseServiceContent, type ServiceContent } from '@/lib/service-input'
import { msg } from '@/i18n/msg.mjs'

export async function GET(request: NextRequest) {
  const page = pageNumber(request.nextUrl.searchParams.get('page'))
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select('*, provider:users!inner(id, name, avatar_url, hourly_rate)')
    .eq('provider.role', 'provider')
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) return NextResponse.json({ error: 'Tjänsterna kunde inte hämtas' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'provider') return NextResponse.json({ error: 'Endast leverantörer kan skapa tjänster' }, { status: 403 })

  let requestId: string
  let input: ServiceContent
  try {
    const body = await request.json()
    requestId = body.id ? uuidValue(body.id, msg('Förfrågan')) : crypto.randomUUID()
    input = parseServiceContent(body)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' },
      { status: 400 }
    )
  }

  const { data: existing } = await supabase.from('services').select('id').eq('id', requestId).eq('provider_id', user.id).maybeSingle()
  if (existing) return NextResponse.json(existing)

  const { data, error } = await supabase
    .from('services')
    .insert({
      id: requestId,
      provider_id: user.id,
      ...input,
    })
    .select()
    .single()

  if (error?.code === '23505') {
    const { data: saved } = await supabase.from('services').select('id').eq('id', requestId).eq('provider_id', user.id).maybeSingle()
    if (saved) return NextResponse.json(saved)
  }
  // Samma felkod som skrivkvoten, så meddelandet avgör vilket tak som nåddes.
  if (error?.code === '54000' && error.message.includes('Service limit')) {
    return NextResponse.json({ error: 'Du kan ha högst 10 tjänster. Redigera eller ta bort en befintlig för att lägga till en ny.' }, { status: 409 })
  }
  if (error?.code === '54000') return NextResponse.json({ error: 'För många försök. Vänta en stund och försök igen.' }, { status: 429, headers: { 'Retry-After': '3600' } })

  if (error) return NextResponse.json({ error: 'Tjänsten kunde inte sparas' }, { status: 500 })
  after(() => warmTranslation('service', data))
  return NextResponse.json(data, { status: 201 })
}
