'use client'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { ActionState } from '@/types/auth'
export default function RecoveryForm({ action, password = false, redirect = '/' }: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>; password?: boolean; redirect?: string
}) {
  const [state, submit, pending] = useActionState(action, null)
  const router = useRouter()
  useEffect(() => { if (state && 'success' in state) { router.replace(state.redirectTo); router.refresh() } }, [state, router])
  return <form action={submit} className="surface space-y-5 p-6">
    <input type="hidden" name="redirect" value={redirect} />
    {state && 'error' in state && <p role="alert" className="text-red-700">{state.error}</p>}
    {state && 'message' in state && <p role="status">{state.message}</p>}
    {password ? <><Input name="password" label="Nytt lösenord" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /><Input name="confirm" label="Bekräfta lösenord" type="password" autoComplete="new-password" required /></> : <Input name="email" label="E-post" type="email" autoComplete="email" required />}
    <Button loading={pending} type="submit">{password ? 'Spara lösenord' : 'Skicka mejl'}</Button>
  </form>
}
