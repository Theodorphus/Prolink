import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const body = await request.json()
  const { title, description, price, delivery_time } = body

  if (!title || !description || !price || !delivery_time) {
    return NextResponse.json({ error: 'Alla fält krävs' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('services')
    .insert({ provider_id: user.id, title, description, price: Number(price), delivery_time })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
