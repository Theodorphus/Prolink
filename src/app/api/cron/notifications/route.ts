import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendQueuedNotification } from '@/lib/email'
export const maxDuration = 60
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 401 })
  }
  const admin = createAdminClient()
  const { data: items, error } = await admin.rpc('claim_notifications')
  if (error) return NextResponse.json({ error: 'Kön kunde inte läsas' }, { status: 503 })
  let sent = 0
  let failed = 0
  // Small bounded batch; a lease recovers work if this invocation is terminated.
  for (const item of items ?? []) {
    try {
      const { data, error: userError } = await admin.auth.admin.getUserById(item.recipient_id)
      if (userError || !data.user?.email) throw new Error('Recipient unavailable')
      const { data: preferences, error: preferencesError } = await admin.from('user_private_profiles').select('email_jobs, email_messages').eq('user_id', item.recipient_id).maybeSingle()
      if (preferencesError) throw preferencesError
      const disabled = (item.kind === 'job' && preferences?.email_jobs === false) || (item.kind === 'message' && preferences?.email_messages === false)
      if (!disabled) await sendQueuedNotification({ ...item, to: data.user.email })
      const { error: ackError } = await admin.from('notification_outbox').update({ sent_at: new Date().toISOString(), last_error: null }).eq('id', item.id).eq('lease_token', item.lease_token)
      if (ackError) throw ackError
      sent++
    } catch {
      failed++
      const { error: retryError } = await admin.from('notification_outbox').update({
        available_at: new Date(Date.now() + Math.min(3600, 60 * 2 ** item.attempts) * 1000).toISOString(),
        last_error: 'Delivery failed; inspect provider logs',
      }).eq('id', item.id).eq('lease_token', item.lease_token)
      if (retryError) console.error('Could not reschedule notification', item.id)
    }
  }
  return NextResponse.json({ sent, failed })
}
