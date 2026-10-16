import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendQueuedNotification } from '@/lib/email'
import { welcomeContent } from '@/lib/notification-content'
import { isLocale, type Locale } from '@/i18n/config'
import { createT } from '@/i18n/translate'
import { messagesFor } from '@/i18n/messages'
export const maxDuration = 60
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 401 })
  }
  const admin = createAdminClient()
  // Påminnelser köas här, inte av en trigger, eftersom de beror på att tid går.
  // Ett fel får inte stoppa utskicket av det som redan ligger i kön.
  const { error: reminderError } = await admin.rpc('queue_offer_reminders')
  if (reminderError) console.error('[e-post] Påminnelser kunde inte köas:', reminderError.message)
  const { data: items, error } = await admin.rpc('claim_notifications')
  if (error) return NextResponse.json({ error: 'Kön kunde inte läsas' }, { status: 503 })
  let sent = 0
  let failed = 0
  // Small bounded batch; a lease recovers work if this invocation is terminated.
  for (const item of items ?? []) {
    try {
      // Referensförfrågningar går till tidigare kunder utan konto och har
      // därför en adress i stället för en användare, och inga inställningar.
      if (item.recipient_email) {
        const locale: Locale = isLocale(item.locale) ? item.locale : 'sv'
        await sendQueuedNotification({ ...item, to: item.recipient_email, locale })
      } else {
        const { data, error: userError } = await admin.auth.admin.getUserById(item.recipient_id)
        if (userError || !data.user?.email) throw new Error('Recipient unavailable')
        const { data: preferences, error: preferencesError } = await admin.from('user_private_profiles').select('email_jobs, email_messages, locale').eq('user_id', item.recipient_id).maybeSingle()
        if (preferencesError) throw preferencesError
        let disabled = (item.kind === 'job' && preferences?.email_jobs === false) || (item.kind === 'message' && preferences?.email_messages === false)
        // Omdömesmejl är meningslösa om omdömet redan är lämnat.
        if (!disabled && (item.kind === 'review_request' || item.kind === 'reminder_review')) {
          const { count, error: reviewError } = await admin.from('reviews').select('id', { count: 'exact', head: true })
            .eq('offer_id', String(item.path).split('/').pop()!).eq('reviewer_id', item.recipient_id)
          if (reviewError) throw reviewError
          disabled = (count ?? 0) > 0
        }
        // Välkomstmejlet väntar tills adressen är bekräftad, så att ingen kan få
        // mejl genom att någon annan registrerar deras adress. Obekräftade
        // konton provas igen om en timme, utan att det räknas som ett misslyckat
        // försök, och efter en vecka ges det upp.
        if (!disabled && item.kind === 'welcome' && !data.user.email_confirmed_at) {
          const waitedDays = (Date.now() - Date.parse(item.created_at)) / 86_400_000
          if (waitedDays < 7) {
            await admin.from('notification_outbox').update({
              available_at: new Date(Date.now() + 3_600_000).toISOString(),
              attempts: Math.max(item.attempts - 1, 0),
            }).eq('id', item.id).eq('lease_token', item.lease_token)
            continue
          }
          disabled = true
        }
        // Mottagarens språk avgör vilket språk mejlet skrivs på.
        const locale: Locale = isLocale(preferences?.locale) ? preferences.locale : 'sv'
        // Välkomstmejlet formuleras nu, efter kontots roll i dag.
        let message = item
        if (!disabled && item.kind === 'welcome') {
          const { data: profile, error: profileError } = await admin.from('users').select('role, name').eq('id', item.recipient_id).maybeSingle()
          if (profileError) throw profileError
          message = { ...item, ...welcomeContent({ id: item.recipient_id, role: profile?.role ?? null, name: profile?.name ?? null }, createT(locale, messagesFor(locale))) }
        }
        if (!disabled) await sendQueuedNotification({ ...message, to: data.user.email, locale })
      }
      const { error: ackError } = await admin.from('notification_outbox').update({ sent_at: new Date().toISOString(), last_error: null }).eq('id', item.id).eq('lease_token', item.lease_token)
      if (ackError) throw ackError
      sent++
    } catch (error) {
      failed++
      // Orsaken sparas så att den syns i databasen och inte bara i leverantörens
      // loggar. Meddelandet kommer från Resend eller vår egen kod, aldrig från
      // mottagaren, och tabellen är bara läsbar för servern.
      const reason = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : 'okänt fel'
      const { error: retryError } = await admin.from('notification_outbox').update({
        available_at: new Date(Date.now() + Math.min(3600, 60 * 2 ** item.attempts) * 1000).toISOString(),
        last_error: reason.slice(0, 300),
      }).eq('id', item.id).eq('lease_token', item.lease_token)
      if (retryError) console.error('Could not reschedule notification', item.id)
    }
  }
  return NextResponse.json({ sent, failed })
}
