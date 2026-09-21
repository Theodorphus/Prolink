import { PAGE_SIZE, pageNumber } from '@/lib/pagination'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'
import {
  categoryValue,
  InputValidationError,
  oneOf,
  optionalText,
  positivePrice,
  requiredText,
  uuidValue,
} from '@/lib/validation'

const JOB_STATUSES = ['open', 'closed'] as const
const WORK_TYPES = ['remote', 'onsite', 'hybrid'] as const

export async function GET(request: NextRequest) {
  const page = pageNumber(request.nextUrl.searchParams.get('page'))
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  let status: 'open' | 'closed'
  try {
    status = oneOf(searchParams.get('status') ?? 'open', JOB_STATUSES, 'Status')
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('jobs')
    .select(`${PUBLIC_JOB_FIELDS}, customer:users!jobs_customer_id_fkey(id, name, avatar_url)`)
    .eq('status', status)
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (error) return NextResponse.json({ error: 'Uppdragen kunde inte hämtas' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  let requestId: string
  let serviceId: string | null
  let providerId: string | null
  let input: {
    title: string
    description: string
    category: string
    budget: number | null
    location: string | null
    workType: string | null
  }

  try {
    const body = await request.json()
    requestId = body.id ? uuidValue(body.id, 'Förfrågan') : crypto.randomUUID()
    serviceId = body.service_id ? uuidValue(body.service_id, 'Tjänst') : null
    providerId = body.requested_provider_id ? uuidValue(body.requested_provider_id, 'Leverantör') : null
    const rawWorkType = optionalText(body.work_type, 'Arbetsform', 30)
    input = {
      title: requiredText(body.title, 'Titel', 3, 120),
      description: requiredText(body.description, 'Beskrivning', 10, 5000),
      category: categoryValue(body.category),
      budget: body.budget === undefined || body.budget === null || body.budget === '' ? null : positivePrice(body.budget, 'Budget'),
      location: optionalText(body.location, 'Plats', 120),
      workType: rawWorkType ? oneOf(rawWorkType, WORK_TYPES, 'Arbetsform') : null,
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' },
      { status: 400 }
    )
  }

  if (serviceId) {
    const { data: service } = await supabase.from('services').select('provider_id').eq('id', serviceId).maybeSingle()
    if (!service) return NextResponse.json({ error: 'Tjänsten hittades inte.' }, { status: 404 })
    providerId = service.provider_id
  }
  if (providerId) {
    const { data: provider } = await supabase.from('users').select('id').eq('id', providerId).eq('role', 'provider').maybeSingle()
    if (!provider || providerId === user.id) return NextResponse.json({ error: 'Ogiltig mottagare.' }, { status: 400 })
  }
  const { data: existing } = await supabase.from('jobs').select('id').eq('id', requestId).eq('customer_id', user.id).maybeSingle()
  if (existing) return NextResponse.json(existing)

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      id: requestId,
      service_id: serviceId,
      requested_provider_id: providerId,
      customer_id: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      budget: input.budget,
      location: input.location,
      work_type: input.workType,
    })
    .select()
    .single()

  if (error?.code === '23505') {
    const { data: saved } = await supabase.from('jobs').select('id').eq('id', requestId).eq('customer_id', user.id).maybeSingle()
    if (saved) return NextResponse.json(saved)
  }
  if (error?.code === '54000') return NextResponse.json({ error: 'För många försök. Vänta en stund och försök igen.' }, { status: 429, headers: { 'Retry-After': '3600' } })

  if (error) return NextResponse.json({ error: 'Jobbet kunde inte sparas' }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
