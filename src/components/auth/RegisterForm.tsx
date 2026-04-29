'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'

type ActionState = { error: string } | null

interface RegisterFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending} loading={pending}>
      Skapa konto
    </Button>
  )
}

const roles = [
  { value: 'customer', label: 'Kund', desc: 'Jag vill köpa tjänster' },
  { value: 'provider', label: 'Leverantör', desc: 'Jag erbjuder tjänster' },
]

export default function RegisterForm({ action }: RegisterFormProps) {
  const [state, formAction] = useFormState<ActionState, FormData>(action, null)
  const [selectedRole, setSelectedRole] = useState<string>('customer')

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 space-y-5">
      {/* Role selector — shared between Google and email signup */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Jag är</label>
        <div className="grid grid-cols-2 gap-3">
          {roles.map(({ value, label, desc }) => (
            <label
              key={value}
              className={`relative flex flex-col gap-1 border rounded-lg p-3 cursor-pointer hover:border-blue-500 transition-colors ${
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
              <span className="font-medium text-gray-900">{label}</span>
              <span className="text-xs text-gray-500">{desc}</span>
            </label>
          ))}
        </div>
      </div>

      <GoogleAuthButton role={selectedRole} />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">eller med e-post</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
            {state.error}
          </div>
        )}

        <Input label="Namn" name="name" type="text" required autoComplete="name" />
        <Input label="E-post" name="email" type="email" required autoComplete="email" />
        <Input label="Lösenord (minst 6 tecken)" name="password" type="password" required minLength={6} autoComplete="new-password" />
        <input type="hidden" name="role" value={selectedRole} />

        <SubmitButton />
      </form>
    </div>
  )
}
