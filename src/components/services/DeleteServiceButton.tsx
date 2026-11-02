'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocalePath, useT } from '@/i18n/client'

export default function DeleteServiceButton({ serviceId, profileId }: { serviceId: string; profileId: string }) {
  const router = useRouter()
  const t = useT()
  const localePath = useLocalePath()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/services/${serviceId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push(localePath(`/profile/${profileId}#tjanster`))
        router.refresh()
        return
      }
      const data = await res.json().catch(() => null)
      setError(t(data?.error ?? 'Tjänsten kunde inte tas bort.'))
    } catch {
      setError(t('Tjänsten kunde inte tas bort. Kontrollera anslutningen.'))
    }
    setLoading(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
      >
        {t('Ta bort tjänst')}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !loading && setShowConfirm(false)} />
          <div role="dialog" aria-modal="true" className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900">{t('Ta bort tjänsten?')}</h3>
            <p className="mb-6 text-sm text-gray-500">
              {t('Tjänsten tas bort för alla och går inte att ångra. Uppdrag och offerter som redan finns påverkas inte.')}
            </p>
            {error && <p role="alert" className="-mt-3 mb-4 text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {t('Avbryt')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? t('Tar bort...') : t('Ta bort')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
