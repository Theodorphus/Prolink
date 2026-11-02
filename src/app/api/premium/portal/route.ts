import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, premiumConfigured } from '@/lib/stripe'
import { SITE_URL } from '@/lib/site'
import { getRequestLocale } from '@/i18n/server'
import { localePath } from '@/i18n/config'

// Stripes kundportal: byta kort, se kvitton och säga upp prenumerationen.
export async function POST() {
  if (!premiumConfigured()) return NextResponse.json({ error: 'Premium är inte tillgängligt just nu.' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })

  const { data: row, error } = await createAdminClient().from('premium_subscriptions')
    .select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Något gick fel. Försök igen.' }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'Du har ingen prenumeration.' }, { status: 404 })

  try {
    const locale = await getRequestLocale()
    const session = await getStripe().billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      locale: locale === 'en' ? 'en' : 'sv',
      return_url: `${SITE_URL}${localePath(locale, `/profile/${user.id}`)}#premium`,
    })
    return NextResponse.json({ url: session.url })
  } catch (portalError) {
    console.error('[premium] Kundportalen kunde inte öppnas:', portalError instanceof Error ? portalError.message : portalError)
    return NextResponse.json({ error: 'Något gick fel. Försök igen.' }, { status: 500 })
  }
}
