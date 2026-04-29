'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SwitchRoleButtonProps {
  currentRole: 'customer' | 'provider'
  userId: string
}

export default function SwitchRoleButton({ currentRole, userId }: SwitchRoleButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const newRole = currentRole === 'customer' ? 'provider' : 'customer'
  const newRoleLabel = newRole === 'provider' ? 'Leverantör' : 'Uppdragsgivare'
  const newRoleDesc = newRole === 'provider'
    ? 'Du kan lägga upp tjänster och ta emot uppdrag.'
    : 'Du kan lägga ut uppdrag och ta emot offerter.'

  async function handleSwitch() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      setLoading(false)
      setShowConfirm(false)
      return
    }

    router.refresh()
    setShowConfirm(false)
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full text-sm text-gray-500 hover:text-gray-900 transition-colors py-2 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50"
      >
        Byt till {newRoleLabel}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Byt till {newRoleLabel}?
            </h3>
            <p className="text-sm text-gray-600 mb-1">{newRoleDesc}</p>
            <p className="text-xs text-gray-400 mb-6">
              Din befintliga data behålls. Du kan byta tillbaka när som helst.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleSwitch}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Byter...' : 'Byt roll'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
