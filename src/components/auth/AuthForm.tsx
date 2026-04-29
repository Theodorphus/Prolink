'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type ActionState = { error: string } | null

interface AuthFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  submitLabel: string
  redirect?: string
}

export default function AuthForm({ action, submitLabel, redirect }: AuthFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

  return (
    <form action={formAction} className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 space-y-5">
      {redirect && <input type="hidden" name="redirect" value={redirect} />}

      {state?.error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <Input label="E-post" name="email" type="email" required autoComplete="email" />
      <Input label="Lösenord" name="password" type="password" required autoComplete="current-password" minLength={6} />

      <Button type="submit" className="w-full" disabled={pending} loading={pending}>
        {submitLabel}
      </Button>
    </form>
  )
}
