'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'
import { useLocale, useLocalePath, useT } from '@/i18n/client'
import { msg } from '@/i18n/msg.mjs'

import type { ActionState } from '@/types/auth'

interface RegisterFormProps {
  redirect?: string
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
}

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useT()
  return (
    <Button type="submit" className="w-full" disabled={pending} loading={pending}>
      {t('Skapa konto')}
    </Button>
  )
}

const roles = [
  { value: 'customer', label: msg('Uppdragsgivare'), desc: msg('Jag vill köpa tjänster') },
  { value: 'provider', label: msg('Frilansare'), desc: msg('Jag erbjuder tjänster') },
]

export default function RegisterForm({ action, redirect }: RegisterFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null)
  const [selectedRole, setSelectedRole] = useState<string>('customer')
  const router = useRouter()
  const t = useT()
  const locale = useLocale()
  const localePath = useLocalePath()

  useEffect(() => {
    if (state && 'success' in state) {
      router.push(localePath(state.redirectTo))
      router.refresh()
    }
  }, [state, router, localePath])

  return (
    <div className="surface p-8 space-y-5">
      {/* Role selector — shared between Google and email signup */}
      <div className="space-y-2">
        <span id="roll-label" className="block text-sm font-medium text-gray-700">{t('Jag är')}</span>
        <p id="roll-hjalp" className="text-xs text-gray-500">
          {t('Du kan byta när som helst från din profil, och göra både och.')}
        </p>
        <div role="radiogroup" aria-labelledby="roll-label" aria-describedby="roll-hjalp" className="grid grid-cols-2 gap-3">
          {roles.map(({ value, label, desc }) => (
            <label
              key={value}
              className={`relative flex flex-col gap-1 border rounded-lg p-3 cursor-pointer hover:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 transition-colors ${
                selectedRole === value ? 'border-blue-600 bg-blue-50' : ''
              }`}
            >
              <input
                type="radio"
                name="role_display"
                value={value}
                checked={selectedRole === value}
                onChange={() => setSelectedRole(value)}
                className="sr-only"
              />
              <span className="font-medium text-gray-900">{t(label)}</span>
              <span className="text-xs text-gray-500">{t(desc)}</span>
            </label>
          ))}
        </div>
      </div>

      <GoogleAuthButton role={selectedRole} next={redirect} />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">{t('eller med e-post')}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirect" value={redirect ?? '/'} />
        <input type="hidden" name="locale" value={locale} />
        {state && 'message' in state && <p role="status" className="rounded-xl bg-green-50 p-4 text-green-800">{t(state.message)}</p>}
        {state && 'error' in state && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {t(state.error)}
          </div>
        )}

        <Input label={t('Namn')} name="name" type="text" required autoComplete="name" />
        <Input label={t('E-post')} name="email" type="email" required autoComplete="email" />
        <Input label={t('Lösenord (minst 8 tecken)')} name="password" type="password" required minLength={8} autoComplete="new-password" />
        <input type="hidden" name="role" value={selectedRole} />

        <SubmitButton />
      </form>
    </div>
  )
}
