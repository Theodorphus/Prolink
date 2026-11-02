import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { premiumEvents } from '@/lib/premium-events.mjs'
import { premiumEmailContent } from '@/lib/premium-notifications'
import { isLocale, type Locale } from '@/i18n/config'
import { createT } from '@/i18n/translate'
import { messagesFor } from '@/i18n/messages'
import { refreshPublicJobSurfaces } from '@/lib/revalidate'
import { JOB_BOOST_DAYS } from '@/lib/job-boost.mjs'

// Stripe talar om när en prenumeration skapas, ändras eller upphör. Varje
// händelse läses om från Stripe i stället för att tolkas, så att händelser
// som kommer i fel ordning ändå ger rätt slutläge.
const HANDLED = new Set(['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'])
const CHECKOUT_PAID = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded'])

// Betalt lyft av ett uppdrag. Funktionen i databasen är idempotent per
// Stripe-session, så att en omskickad händelse inte lyfter uppdraget igen.
async function applyJobBoost(session: Stripe.Checkout.Session) {
  const { kind, job_id: jobId, user_id: userId } = session.metadata ?? {}
  if (kind !== 'job_boost' || session.payment_status !== 'paid' || !jobId || !userId) return
  const { data: applied, error } = await createAdminClient().rpc('apply_job_boost', {
    p_session_id: session.id, p_job_id: jobId, p_customer_id: userId, p_days: JOB_BOOST_DAYS,
  })
  if (error) throw error
  if (applied) refreshPublicJobSurfaces()
  else console.warn(`[lyft] Betalningen ${session.id} lyfte inget uppdrag (redan lyft, stängt eller fel ägare).`)
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get('stripe-signature')
  if (!secret || !signature || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Ogiltig förfrågan.' }, { status: 400 })

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret)
  } catch {
    return NextResponse.json({ error: 'Ogiltig signatur.' }, { status: 400 })
  }
  if (CHECKOUT_PAID.has(event.type)) {
    try {
      await applyJobBoost(event.data.object as Stripe.Checkout.Session)
      return NextResponse.json({ received: true })
    } catch (error) {
      // 500 gör att Stripe provar igen.
      console.error('[lyft] Betalningen kunde inte registreras:', error instanceof Error ? error.message : error)
      return NextResponse.json({ error: 'Kunde inte behandlas.' }, { status: 500 })
    }
  }
  if (!HANDLED.has(event.type)) return NextResponse.json({ received: true })

  try {
    const sent = event.data.object as Stripe.Subscription
    const subscription = await stripe.subscriptions.retrieve(sent.id)
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
    const admin = createAdminClient()
    // Kunden kopplades till kontot när Checkout startades.
    const { data: row, error: readError } = await admin.from('premium_subscriptions')
      .select('user_id, status, cancel_at_period_end').eq('stripe_customer_id', customerId).maybeSingle()
    if (readError) throw readError
    if (!row) return NextResponse.json({ received: true })
    const periodEnd = subscription.items.data[0]?.current_period_end
    const periodEndIso = periodEnd ? new Date(periodEnd * 1000).toISOString() : null
    // Kundportalen kan markera en uppsägning med cancel_at i stället för
    // cancel_at_period_end, så båda räknas som uppsagd.
    const cancelAtPeriodEnd = subscription.cancel_at_period_end || subscription.cancel_at != null

    // Mejlen köas före uppdateringen: går uppdateringen fel provar Stripe igen
    // och dedupe_key hindrar att mejlet köas två gånger. Nyckeln bygger på
    // prenumerationen och inte på händelsen, eftersom Stripe skickar flera
    // händelser samtidigt och alla kan se samma gamla rad.
    const events = premiumEvents(row, { status: subscription.status, cancelAtPeriodEnd })
    if (events.length > 0) {
      const { data: preferences, error: preferencesError } = await admin.from('user_private_profiles').select('locale').eq('user_id', row.user_id).maybeSingle()
      if (preferencesError) throw preferencesError
      const locale: Locale = isLocale(preferences?.locale) ? preferences.locale : 'sv'
      const t = createT(locale, messagesFor(locale))
      const invoice = typeof subscription.latest_invoice === 'string' ? subscription.latest_invoice : subscription.latest_invoice?.id
      const discriminator = { started: '', ended: '', cancel_scheduled: String(periodEnd), payment_failed: invoice ?? '' }
      const { error: queueError } = await admin.from('notification_outbox').upsert(
        events.map(name => ({
          recipient_id: row.user_id,
          kind: 'premium',
          ...premiumEmailContent(name, periodEndIso, t, locale),
          path: `/profile/${row.user_id}`,
          dedupe_key: `premium:${name}:${subscription.id}:${discriminator[name]}`,
        })),
        { onConflict: 'dedupe_key', ignoreDuplicates: true },
      )
      if (queueError) throw queueError
    }

    const { error } = await admin.from('premium_subscriptions').update({
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: periodEndIso,
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    }).eq('user_id', row.user_id)
    if (error) throw error
    return NextResponse.json({ received: true })
  } catch (error) {
    // 500 gör att Stripe provar igen.
    console.error('[premium] Webhooken kunde inte behandlas:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Kunde inte behandlas.' }, { status: 500 })
  }
}
