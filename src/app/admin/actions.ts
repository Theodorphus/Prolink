'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { isUuid } from '@/lib/validation'

// Admin godkänner eller avslår en företagsverifiering efter att ha kontrollerat
// organisationsnumret och F-skatten. Serveractioner går att anropa direkt, så
// behörigheten kontrolleras här och inte bara på sidan.
export async function reviewCompanyVerification(form: FormData) {
  await requireAdmin()
  const userId = form.get('user_id')
  const decision = form.get('decision')
  if (!isUuid(userId) || (decision !== 'verified' && decision !== 'rejected')) throw new Error('Ogiltig granskning.')
  const note = String(form.get('note') ?? '').trim().slice(0, 500) || null

  const { error } = await createAdminClient().from('company_verifications')
    .update({ status: decision, reviewed_at: new Date().toISOString(), review_note: decision === 'rejected' ? note : null })
    .eq('user_id', userId)
  if (error) throw new Error('Granskningen kunde inte sparas.')
  revalidatePath('/admin')
  revalidatePath(`/profile/${userId}`)
}
