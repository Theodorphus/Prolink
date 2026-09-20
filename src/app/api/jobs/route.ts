import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCategoryLabel } from '@/lib/categories'
import { sendNewJobEmail } from '@/lib/email'
import { PUBLIC_JOB_FIELDS } from '@/lib/jobs'
import { rateLimitMessage, withinRateLimit } from '@/lib/rate-limit'
import {
  categoryValue,
  InputValidationError,
  oneOf,
  optionalText,
  positivePrice,
  requiredText,
} from '@/lib/validation'

const JOB_STATUSES = ['open', 'closed'] as const
const WORK_TYPES = ['remote', 'onsite', 'hybrid'] as const

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
    .select(`${PUBLIC_JOB_FIELDS}, customer:users(id, name, avatar_url)`)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Uppdragen kunde inte hämtas' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  if (!(await withinRateLimit(supabase, 'jobs:create'))) {
    return NextResponse.json({ error: rateLimitMessage('jobs:create') }, { status: 429 })
  }

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

  const { data, error } = await supabase
    .from('jobs')
    .insert({
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

  if (error) return NextResponse.json({ error: 'Jobbet kunde inte sparas' }, { status: 500 })

  // Notisen är best effort: ett mejlavbrott får aldrig hindra att uppdraget
  // publiceras, så felet loggas i stället för att returneras.
  notifyProviders({
    jobId: data.id,
    title: input.title,
    category: input.category,
    budget: input.budget,
    customerId: user.id,
  }).catch(notificationError => {
    console.error('new job notification failed:', notificationError)
  })

  return NextResponse.json(data, { status: 201 })
}

// Leverantörer som matchar uppdragets kategori underrättas. Matchningen är
// medvetet enkel: kategorin jämförs mot leverantörens kompetenser, och alla
// leverantörer får notisen när ingen matchar, eftersom en tom marknadsplats
// vinner mer på räckvidd än på precision.
async function notifyProviders({
  jobId,
  title,
  category,
  budget,
  customerId,
}: {
  jobId: string
  title: string
  category: string
  budget: number | null
  customerId: string
}) {
  const admin = createAdminClient()

  const { data: providers } = await admin
    .from('users')
    .select('id, skills')
    .eq('role', 'provider')
    .neq('id', customerId)

  if (!providers?.length) return

  const categoryLabel = getCategoryLabel(category)
  const normalisedCategory = category.toLowerCase()
  const normalisedLabel = categoryLabel.toLowerCase()

  const matches = providers.filter(provider =>
    (provider.skills ?? []).some((skill: string) => {
      const normalisedSkill = String(skill).toLowerCase()
      return normalisedSkill.includes(normalisedCategory)
        || normalisedCategory.includes(normalisedSkill)
        || normalisedLabel.includes(normalisedSkill)
    })
  )

  const recipients = matches.length ? matches : providers

  const results = await Promise.allSettled(
    recipients.map(async provider => {
      const { data: auth, error: authError } = await admin.auth.admin.getUserById(provider.id)
      if (authError) throw authError
      const email = auth.user?.email
      if (!email) return
      await sendNewJobEmail({ to: email, jobTitle: title, categoryLabel, budget, jobId })
    })
  )

  const failed = results.filter(result => result.status === 'rejected')
  if (failed.length) {
    console.error(`new job notification: ${failed.length}/${recipients.length} utskick misslyckades`, (failed[0] as PromiseRejectedResult).reason)
  }
}
