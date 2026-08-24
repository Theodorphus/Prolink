import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  categoryValue,
  emailValue,
  InputValidationError,
  oneOf,
  optionalText,
  requiredText,
} from '@/lib/validation'

const JOB_STATUSES = ['open', 'closed'] as const
const WORK_TYPES = ['heltid', 'deltid', 'kväll', 'extrajobb', 'sommarjobb'] as const

export async function GET(request: NextRequest) {
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

  let input: {
    title: string
    description: string
    category: string
    salary: string | null
    location: string | null
    workType: string | null
    employerName: string | null
    employerEmail: string | null
    contactInfo: string | null
  }

  try {
    const body = await request.json()
    const rawEmployerEmail = optionalText(body.employer_email, 'E-post', 254)
    const rawWorkType = optionalText(body.work_type, 'Arbetstid', 30)
    input = {
      title: requiredText(body.title, 'Titel', 3, 120),
      description: requiredText(body.description, 'Beskrivning', 10, 5000),
      category: categoryValue(body.category),
      salary: optionalText(body.salary, 'Lön', 100),
      location: optionalText(body.location, 'Plats', 120),
      workType: rawWorkType ? oneOf(rawWorkType, WORK_TYPES, 'Arbetstid') : null,
      employerName: optionalText(body.employer_name, 'Företagsnamn', 120),
      employerEmail: rawEmployerEmail ? emailValue(rawEmployerEmail) : null,
      contactInfo: optionalText(body.contact_info, 'Kontaktinformation', 500),
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof InputValidationError ? error.message : 'Ogiltig förfrågan.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      customer_id: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      salary: input.salary,
      location: input.location,
      work_type: input.workType,
      employer_name: input.employerName,
      employer_email: input.employerEmail,
      contact_info: input.contactInfo,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Jobbet kunde inte sparas' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
