import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { job_id, applicant_name, applicant_email, applicant_phone, message, use_profile } = body

    if (!job_id) {
      return NextResponse.json({ error: 'job_id krävs.' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', job_id)
      .single()

    if (!job || job.status !== 'open') {
      return NextResponse.json({ error: 'Jobbet är inte längre aktivt.' }, { status: 400 })
    }

    let resolvedName = applicant_name
    let resolvedEmail = applicant_email
    let resolvedPhone = applicant_phone
    let profileUserId: string | null = null
    let cvUrl: string | null = null

    if (use_profile) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Du måste vara inloggad.' }, { status: 401 })

      const { data: profile } = await supabase
        .from('users')
        .select('name, phone, cv_url')
        .eq('id', user.id)
        .single()

      resolvedName = profile?.name ?? user.email ?? 'Okänd'
      resolvedEmail = user.email ?? ''
      resolvedPhone = applicant_phone || profile?.phone || null
      profileUserId = user.id
      cvUrl = profile?.cv_url ?? null
    }

    if (!resolvedName?.trim() || !resolvedEmail?.trim()) {
      return NextResponse.json({ error: 'Namn och e-post krävs.' }, { status: 400 })
    }

    const { error } = await supabase.from('applications').insert({
      job_id,
      applicant_name: resolvedName,
      applicant_email: resolvedEmail,
      applicant_phone: resolvedPhone || null,
      message: message || null,
      user_id: profileUserId,
      cv_url: cvUrl,
    })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Du har redan ansökt till det här jobbet.' }, { status: 409 })
      }
      return NextResponse.json({ error: `DB-fel: ${error.message} (kod: ${error.code})` }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('applications POST error:', err)
    return NextResponse.json({ error: 'Internt serverfel.' }, { status: 500 })
  }
}
