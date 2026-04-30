import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'open'

  const { data, error } = await supabase
    .from('jobs')
    .select('*, customer:users(id, name, avatar_url)')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'customer') return NextResponse.json({ error: 'Endast kunder kan skapa uppdrag' }, { status: 403 })

  const body = await request.json()
  const { title, description, budget, category } = body

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'Titel och beskrivning krävs' }, { status: 400 })
  }

  if (!category) {
    return NextResponse.json({ error: 'Kategori krävs' }, { status: 400 })
  }

  const parsedBudget = budget ? Number(budget) : null
  if (parsedBudget !== null && (isNaN(parsedBudget) || parsedBudget <= 0)) {
    return NextResponse.json({ error: 'Budget måste vara ett positivt belopp' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert({ customer_id: user.id, title: title.trim(), description: description.trim(), budget: parsedBudget, category })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
