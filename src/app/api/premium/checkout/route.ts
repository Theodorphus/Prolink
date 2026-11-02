import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe, premiumConfigured } from '@/lib/stripe'
import { subscriptionActive } from '@/lib/premium'
import { SITE_URL } from '@/lib/site'
import { getRequestLocale } from '@/i18n/server'
import { localePath } from '@/i18n/config'
import { createT } from '@/i18n/translate'
import { messagesFor } from '@/i18n/messages'

// Startar Stripe Checkout för Premium. Stripe-kunden skapas här och kopplas
// till kontot innan betalningen, så att webhooken alltid kan hitta användaren.
export async function POST() {
  if (!premiumConfigured()) return NextResponse.json({ error: 'Premium är inte tillgängligt just nu.' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Ej inloggad' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'provider') return NextResponse.json({ error: 'Premium är till för frilansare.' }, { status: 403 })

  const admin = createAdminClient()
  const stripe = getStripe()
  const { data: existing, error: readError } = await admin.from('premium_subscriptions')
    .select('stripe_customer_id, status, current_period_end').eq('user_id', user.id).maybeSingle()
  if (readError) return NextResponse.json({ error: 'Något gick fel. Försök igen.' }, { status: 500 })
  if (subscriptionActive(existing)) {
    return NextResponse.json({ error: 'Du har redan Premium.' }, { status: 409 })
  }

  try {
    let customerId = existing?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })
      customerId = customer.id
      const { error } = await admin.from('premium_subscriptions').insert({ user_id: user.id, stripe_customer_id: customerId })
      if (error) throw error
    }
    const locale = await getRequestLocale()
    const t = createT(locale, messagesFor(locale))
    const profilePath = localePath(locale, `/profile/${user.id}`)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID!, quantity: 1 }],
      subscription_data: { metadata: { user_id: user.id } },
      locale: locale === 'en' ? 'en' : 'sv',
      allow_promotion_codes: true,
      custom_text: { submit: { message: t('Prenumerationen förnyas varje månad tills du säger upp den. Du kan avsluta när som helst under Hantera prenumeration på din profil.') } },
      success_url: `${SITE_URL}${profilePath}?premium=ok#premium`,
      cancel_url: `${SITE_URL}${profilePath}#premium`,
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[premium] Checkout kunde inte startas:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Något gick fel. Försök igen.' }, { status: 500 })
  }
}
