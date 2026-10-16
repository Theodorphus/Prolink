'use client'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useLocalePath, useT } from '@/i18n/client'
import type { ActionState } from '@/types/auth'
export default function RecoveryForm({ action, password = false, redirect = '/' }: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>; password?: boolean; redirect?: string
}) {
  const [state, submit, pending] = useActionState(action, null)
  const router = useRouter()
  const t = useT()
  const localePath = useLocalePath()
  useEffect(() => { if (state && 'success' in state) { router.replace(localePath(state.redirectTo)); router.refresh() } }, [state, router, localePath])
  return <form action={submit} className="surface space-y-5 p-6">
    <input type="hidden" name="redirect" value={redirect} />
    {state && 'error' in state && <p role="alert" className="text-red-700">{t(state.error)}</p>}
    {state && 'message' in state && <p role="status">{t(state.message)}</p>}
    {password ? <><Input name="password" label={t('Nytt lösenord')} type="password" autoComplete="new-password" minLength={8} maxLength={128} required /><Input name="confirm" label={t('Bekräfta lösenord')} type="password" autoComplete="new-password" required /></> : <Input name="email" label={t('E-post')} type="email" autoComplete="email" required />}
    <Button loading={pending} type="submit">{password ? t('Spara lösenord') : t('Skicka mejl')}</Button>
  </form>
}
