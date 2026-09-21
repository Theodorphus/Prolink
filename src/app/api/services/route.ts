import { PAGE_SIZE, pageNumber } from '@/lib/pagination'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  categoryValue,
  InputValidationError,
  positivePrice,
  requiredText,
  uuidValue,
  oneOf,
} from '@/lib/validation'

export async function GET(request: NextRequest) {
  const page = pageNumber(request.nextUrl.searchParams.get('page'))
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select('*, provider:users(id, name, avatar_url, hourly_rate)')
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
  let input: {
    title: string
    description: string
    price: number
    deliveryTime: string
    vatIncluded: boolean | null
    category: string
  }
  try {
    const body = await request.json()
    requestId = body.id ? uuidValue(body.id, 'Förfrågan') : crypto.randomUUID()
    input = {
      title: requiredText(body.title, 'Titel', 3, 120),
      description: requiredText(body.description, 'Beskrivning', 10, 5000),
      price: positivePrice(body.price),
      deliveryTime: requiredText(body.delivery_time, 'Leveranstid', 2, 120),
      category: categoryValue(body.category),
      vatIncluded: body.vat_included == null ? null : oneOf(String(body.vat_included), ['true', 'false'] as const, 'Moms') === 'true',
    }
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
      title: input.title,
      description: input.description,
      price: input.price,
      delivery_time: input.deliveryTime,
      category: input.category,
      vat_included: input.vatIncluded,
    })
    .select()
    .single()

  if (error?.code === '23505') {
    const { data: saved } = await supabase.from('services').select('id').eq('id', requestId).eq('provider_id', user.id).maybeSingle()
    if (saved) return NextResponse.json(saved)
  }
  if (error?.code === '54000') return NextResponse.json({ error: 'För många försök. Vänta en stund och försök igen.' }, { status: 429, headers: { 'Retry-After': '3600' } })

  if (error) return NextResponse.json({ error: 'Tjänsten kunde inte sparas' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
