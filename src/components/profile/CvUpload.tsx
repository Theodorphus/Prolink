'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  currentCvPath: string | null
}

export default function CvUpload({ userId, currentCvPath }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cvPath, setCvPath] = useState<string | null>(currentCvPath)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Endast PDF och Word-dokument (.doc, .docx) är tillåtna.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Dokumentet får max vara 5 MB.')
      return
    }

    setError('')
    setLoading(true)

    const supabase = createClient()
    const extMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    }
    const ext = extMap[file.type]
    const path = `${userId}/cv.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('Uppladdningen misslyckades. Försök igen.')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('user_private_profiles')
      .upsert({ user_id: userId, cv_path: path, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

    if (updateError) {
      if (path !== cvPath) await supabase.storage.from('cvs').remove([path])
      setError('Kunde inte spara CV:t. Försök igen.')
    } else {
      if (cvPath && cvPath !== path) {
        await supabase.storage.from('cvs').remove([cvPath])
      }
      setCvPath(path)
      router.refresh()
    }

    setLoading(false)
  }

  async function handleRemove() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    if (cvPath) {
      const { error: storageError } = await supabase.storage.from('cvs').remove([cvPath])
      if (storageError) {
        setError('Kunde inte ta bort CV-filen.')
        setLoading(false)
        return
      }
    }

    const { error: updateError } = await supabase
      .from('user_private_profiles')
      .upsert({ user_id: userId, cv_path: null, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

    if (updateError) {
      setError('Filen togs bort men profilreferensen kunde inte uppdateras.')
    } else {
      setCvPath(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleView() {
    if (!cvPath) return
    setError('')
    const supabase = createClient()
    const { data, error: signError } = await supabase.storage.from('cvs').createSignedUrl(cvPath, 60)
    if (signError || !data) {
      setError('Kunde inte öppna CV:t.')
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const fileName = cvPath
    ? decodeURIComponent(cvPath.split('/').pop() ?? 'cv')
    : null

  return (
    <div className="space-y-2">
      {cvPath ? (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{fileName}</p>
            <p className="text-xs text-gray-400">CV uppladdat</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleView}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Visa
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="text-xs text-gray-500 hover:text-gray-900 font-semibold disabled:opacity-50"
            >
              Byt
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className="text-xs text-red-500 hover:text-red-700 font-semibold disabled:opacity-50"
            >
              Ta bort
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 border-2 border-dashed border-gray-300 rounded-xl px-4 py-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Laddar upp...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Ladda upp CV (PDF eller Word, max 5 MB)
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
