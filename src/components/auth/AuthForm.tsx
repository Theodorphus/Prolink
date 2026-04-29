'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'

type ActionState = { error: string } | null

interface AuthFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  submitLabel: string
  redirect?: string
  next?: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending} loading={pending}>
      {label}
    </Button>
  )
}

export default function AuthForm({ action, submitLabel, redirect, next }: AuthFormProps) {
  const [state, formAction] = useFormState<ActionState, FormData>(action, null)

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 space-y-5">
      <GoogleAuthButton next={next} />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">eller med e-post</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form action={formAction} className="space-y-4">
        {redirect && <input type="hidden" name="redirect" value={redirect} />}

        {state?.error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
            {state.error}
          </div>
        )}

        <Input label="E-post" name="email" type="email" required autoComplete="email" />
        <Input label="Lösenord" name="password" type="password" required autoComplete="current-password" minLength={6} />

        <SubmitButton label={submitLabel} />
      </form>
    </div>
  )
}
