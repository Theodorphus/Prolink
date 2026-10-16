'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'
import { useLocalePath, useT } from '@/i18n/client'

import type { ActionState } from '@/types/auth'

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
  const [state, formAction] = useActionState<ActionState, FormData>(action, null)
  const router = useRouter()
  const t = useT()
  const localePath = useLocalePath()

  useEffect(() => {
    if (state && 'success' in state) {
      router.push(localePath(state.redirectTo))
      router.refresh()
    }
  }, [state, router, localePath])

  return (
    <div className="surface p-8 space-y-5">
      <GoogleAuthButton next={next ?? redirect} />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">{t('eller med e-post')}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form action={formAction} className="space-y-4">
        {redirect && <input type="hidden" name="redirect" value={redirect} />}

        {state && 'error' in state && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {t(state.error)}
          </div>
        )}

        <Input label={t('E-post')} name="email" type="email" required autoComplete="email" />
        <Input label={t('Lösenord')} name="password" type="password" required autoComplete="current-password" minLength={6} />

        <SubmitButton label={submitLabel} />
      </form>
    </div>
  )
}
