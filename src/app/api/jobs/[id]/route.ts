import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'

export async function GET(_: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select(`${PUBLIC_JOB_FIELDS}, customer:users(id, name, bio, avatar_url), offers(*, provider:users(id, name, avatar_url))`)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: 'Uppdraget hittades inte' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { data, error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', params.id)
    .eq('customer_id', user.id)
    .select('id')

  if (error) return NextResponse.json({ error: 'Uppdraget kunde inte tas bort' }, { status: 500 })

  // Filtret på customer_id gör att ett försök att radera någon annans uppdrag
  // returnerar noll rader utan fel. Utan den här kontrollen svarar API:t 200
  // trots att ingenting togs bort.
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Uppdraget hittades inte' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const body = await request.json()

  // Whitelist: only allow status changes, nothing else
  const allowed: Record<string, unknown> = {}
  if (body.status === 'open' || body.status === 'closed') {
    allowed.status = body.status
  }
  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Inga giltiga fält att uppdatera' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(allowed)
    .eq('id', params.id)
    .eq('customer_id', user.id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Uppdraget kunde inte uppdateras' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Uppdraget hittades inte' }, { status: 404 })

  return NextResponse.json(data)
}
