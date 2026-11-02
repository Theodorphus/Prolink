import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, paymentsConfigured } from '@/lib/stripe'
import { isUuid } from '@/lib/validation'
import { JOB_BOOST_DAYS, JOB_BOOST_PRICE_SEK } from '@/lib/job-boost.mjs'
import { SITE_URL } from '@/lib/site'
import { getRequestLocale } from '@/i18n/server'
import { localePath } from '@/i18n/config'
import { createT } from '@/i18n/translate'
import { messagesFor } from '@/i18n/messages'

// Startar betalningen för att lyfta ett uppdrag. Lyftet läggs på först när
// Stripes webhook bekräftar betalningen, inte när användaren kommer tillbaka.
export async function POST(_: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  if (!isUuid(params.id)) return NextResponse.json({ error: 'Ogiltigt uppdrag' }, { status: 400 })
  if (!paymentsConfigured()) return NextResponse.json({ error: 'Lyft är inte tillgängligt just nu.' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { data: job, error } = await supabase.from('jobs')
    .select('id, title, status, archived_at').eq('id', params.id).eq('customer_id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Något gick fel. Försök igen.' }, { status: 500 })
  if (!job) return NextResponse.json({ error: 'Uppdraget hittades inte.' }, { status: 404 })
  if (job.status !== 'open' || job.archived_at) return NextResponse.json({ error: 'Bara öppna uppdrag kan lyftas.' }, { status: 409 })

  try {
    const locale = await getRequestLocale()
    const t = createT(locale, messagesFor(locale))
    const jobPath = localePath(locale, `/jobs/${job.id}`)
    const metadata = { kind: 'job_boost', job_id: job.id, user_id: user.id }
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      locale: locale === 'en' ? 'en' : 'sv',
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'sek',
          unit_amount: JOB_BOOST_PRICE_SEK * 100,
          tax_behavior: 'inclusive',
          product_data: {
            name: t('Lyft uppdraget i {days} dagar', { days: JOB_BOOST_DAYS }),
            description: job.title.slice(0, 200),
          },
        },
      }],
      metadata,
      payment_intent_data: { metadata },
      success_url: `${SITE_URL}${jobPath}?boost=ok`,
      cancel_url: `${SITE_URL}${jobPath}`,
    })
    return NextResponse.json({ url: session.url })
  } catch (caught) {
    console.error('[lyft] Betalningen kunde inte startas:', caught instanceof Error ? caught.message : caught)
    return NextResponse.json({ error: 'Något gick fel. Försök igen.' }, { status: 500 })
  }
}
