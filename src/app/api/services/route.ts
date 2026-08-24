import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  categoryValue,
  InputValidationError,
  positivePrice,
  requiredText,
} from '@/lib/validation'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select('*, provider:users(id, name, avatar_url, hourly_rate)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'provider') return NextResponse.json({ error: 'Endast leverantörer kan skapa tjänster' }, { status: 403 })

  let input: {
    title: string
    description: string
    price: number
    deliveryTime: string
    category: string
  }
  try {
    const body = await request.json()
    input = {
      title: requiredText(body.title, 'Titel', 3, 120),
      description: requiredText(body.description, 'Beskrivning', 10, 5000),
      price: positivePrice(body.price),
      deliveryTime: requiredText(body.delivery_time, 'Leveranstid', 2, 120),
      category: categoryValue(body.category),
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('services')
    .insert({
      provider_id: user.id,
      title: input.title,
      description: input.description,
      price: input.price,
      delivery_time: input.deliveryTime,
      category: input.category,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Tjänsten kunde inte sparas' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
