import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'
import { isUuid } from '@/lib/validation'

export async function GET(_: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Ogiltigt uppdrag' }, { status: 400 })
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select(`${PUBLIC_JOB_FIELDS}, customer:users!jobs_customer_id_fkey(id, name, bio, avatar_url), offers(*, provider:users(id, name, avatar_url))`)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: 'Uppdraget hittades inte' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Ogiltigt uppdrag' }, { status: 400 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { error } = await supabase.rpc('archive_job', { p_job_id: params.id })
  if (error) return NextResponse.json({ error: 'Uppdraget kunde inte arkiveras.' }, { status: error.code === '42501' ? 403 : 500 })

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Ogiltigt uppdrag' }, { status: 400 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Ogiltig förfrågan' }, { status: 400 })

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

  if (error) return NextResponse.json({ error: 'Uppdraget kunde inte uppdateras' }, { status: error.code === '23514' ? 409 : 500 })
  if (!data) return NextResponse.json({ error: 'Uppdraget hittades inte' }, { status: 404 })

  return NextResponse.json(data)
}
