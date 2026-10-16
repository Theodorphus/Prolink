'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { isUuid } from '@/lib/validation'
import { verificationResultContent } from '@/lib/notification-content'
import { isLocale } from '@/i18n/config'
import { createT } from '@/i18n/translate'
import { messagesFor } from '@/i18n/messages'

// Admin godkänner eller avslår en företagsverifiering efter att ha kontrollerat
// organisationsnumret och F-skatten. Serveractioner går att anropa direkt, så
// behörigheten kontrolleras här och inte bara på sidan.
export async function reviewCompanyVerification(form: FormData) {
  await requireAdmin()
  const userId = form.get('user_id')
  const decision = form.get('decision')
  if (!isUuid(userId) || (decision !== 'verified' && decision !== 'rejected')) throw new Error('Ogiltig granskning.')
  const note = String(form.get('note') ?? '').trim().slice(0, 500) || null

  const { data: reviewed, error } = await createAdminClient().from('company_verifications')
    .update({ status: decision, reviewed_at: new Date().toISOString(), review_note: decision === 'rejected' ? note : null })
    .eq('user_id', userId)
    .select('user_id')
  if (error) throw new Error('Granskningen kunde inte sparas.')
  if (!reviewed?.length) throw new Error('Ansökan hittades inte.')

  // Frilansaren ska inte behöva gissa utfallet genom att titta på sin profil.
  // Beslutet är redan sparat, så ett fel här loggas men kastas inte. Fem
  // minuters fönster hindrar dubbla mejl vid dubbelklick.
  // Beskedet skrivs på frilansarens språk, inte adminens.
  const { data: preferences } = await createAdminClient().from('user_private_profiles').select('locale').eq('user_id', userId).maybeSingle()
  const locale = isLocale(preferences?.locale) ? preferences.locale : 'sv'
  const result = verificationResultContent(decision, decision === 'rejected' ? note : null, createT(locale, messagesFor(locale)))
  const { error: queueError } = await createAdminClient().from('notification_outbox').upsert({
    recipient_id: userId,
    kind: 'verification_result',
    ...result,
    locale,
    path: `/profile/${userId}`,
    dedupe_key: `verification_result:${userId}:${decision}:${Math.floor(Date.now() / 300_000)}`,
  }, { onConflict: 'dedupe_key', ignoreDuplicates: true })
  if (queueError) console.error('[e-post] Verifieringsbeskedet kunde inte köas:', queueError.message)

  revalidatePath('/admin')
  revalidatePath(`/profile/${userId}`)
}
