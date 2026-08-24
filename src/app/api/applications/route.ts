import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  emailValue,
  InputValidationError,
  optionalText,
  requiredText,
  uuidValue,
} from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const jobId = uuidValue(body.job_id, 'Jobb')
    const useProfile = body.use_profile === true
    const message = optionalText(body.message, 'Meddelande', 2000)

    const supabase = await createClient()

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', jobId)
      .single()

    if (!job || job.status !== 'open') {
      return NextResponse.json({ error: 'Jobbet är inte längre aktivt.' }, { status: 400 })
    }

    let resolvedName: string | null = null
    let resolvedEmail: string | null = null
    let resolvedPhone = optionalText(body.applicant_phone, 'Telefon', 50)
    let profileUserId: string | null = null

    if (useProfile) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Du måste vara inloggad.' }, { status: 401 })

      const [{ data: profile }, { data: privateProfile }] = await Promise.all([
        supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .maybeSingle(),
        supabase
          .from('user_private_profiles')
          .select('phone')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      resolvedName = profile?.name ?? user.email ?? 'Okänd'
      resolvedEmail = user.email ?? ''
      resolvedPhone = resolvedPhone || privateProfile?.phone || null
      profileUserId = user.id
    } else {
      resolvedName = requiredText(body.applicant_name, 'Namn', 2, 100)
      resolvedEmail = emailValue(body.applicant_email)
    }

    const { error } = await supabase.from('applications').insert({
      job_id: jobId,
      applicant_name: resolvedName,
      applicant_email: resolvedEmail,
      applicant_phone: resolvedPhone || null,
      message: message || null,
      user_id: profileUserId,
      // CV storage is private and is no longer shared through a permanent URL.
      cv_url: null,
    })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Du har redan ansökt till det här jobbet.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Internt serverfel.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof InputValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('applications POST error:', error)
    return NextResponse.json({ error: 'Internt serverfel.' }, { status: 500 })
  }
}
