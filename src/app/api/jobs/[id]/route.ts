import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select('*, customer:users(id, name, bio, avatar_url), offers(*, provider:users(id, name, avatar_url))')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', params.id)
    .eq('customer_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
