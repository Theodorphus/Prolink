'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type ActionState = { error: string } | null

interface RegisterFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
}

export default function RegisterForm({ action }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

  return (
    <form action={formAction} className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 space-y-5">
      {state?.error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <Input label="Namn" name="name" type="text" required autoComplete="name" />
      <Input label="E-post" name="email" type="email" required autoComplete="email" />
      <Input label="Lösenord (minst 6 tecken)" name="password" type="password" required minLength={6} autoComplete="new-password" />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Jag är</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'customer', label: 'Kund', desc: 'Jag vill köpa tjänster' },
            { value: 'provider', label: 'Leverantör', desc: 'Jag erbjuder tjänster' },
          ].map(({ value, label, desc }) => (
            <label key={value} className="relative flex flex-col gap-1 border rounded-lg p-3 cursor-pointer hover:border-blue-500 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
              <input type="radio" name="role" value={value} defaultChecked={value === 'customer'} className="sr-only" />
              <span className="font-medium text-gray-900">{label}</span>
              <span className="text-xs text-gray-500">{desc}</span>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending} loading={pending}>
        Skapa konto
      </Button>
    </form>
  )
}
