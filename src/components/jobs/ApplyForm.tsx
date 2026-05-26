'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Profile {
  id: string
  name: string
  avatar_url: string | null
  phone: string | null
  bio: string | null
  cv_text: string | null
  cv_url?: string | null
}

interface Props {
  jobId: string
  profile: Profile | null
}

export default function ApplyForm({ jobId, profile }: Props) {
  const [mode, setMode] = useState<'profile' | 'quick'>(profile ? 'profile' : 'quick')
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState(profile?.phone ?? '')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [quickPhone, setQuickPhone] = useState('')
  const [quickMessage, setQuickMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submitProfileApply() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, applicant_phone: phone?.trim() || profile!.phone?.trim() || null, message: message?.trim() || null, use_profile: true }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Något gick fel.')
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function submitQuickApply() {
    if (!name.trim() || !email.trim()) { setError('Namn och e-post krävs.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, applicant_name: name, applicant_email: email, applicant_phone: quickPhone || null, message: quickMessage || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Något gick fel.')
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-bold text-green-800">Ansökan skickad!</p>
        <p className="text-sm text-green-600 mt-1">Arbetsgivaren hör av sig till dig inom kort.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Tabs */}
      {profile && (
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
          <button
            onClick={() => setMode('profile')}
            className={`flex-1 py-2 transition-colors ${mode === 'profile' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            Med din profil
          </button>
          <button
            onClick={() => setMode('quick')}
            className={`flex-1 py-2 transition-colors border-l border-gray-200 ${mode === 'quick' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            Enkel ansökan
          </button>
        </div>
      )}

      {/* Profilbaserad */}
      {profile && mode === 'profile' && (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Din ansökan</p>
            <div className="flex items-start gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-blue-100 shrink-0 flex items-center justify-center text-blue-700 font-bold">
                {profile.avatar_url
                  ? <Image src={profile.avatar_url} alt={profile.name} fill className="object-cover" />
                  : profile.name?.[0]?.toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{profile.name}</p>
                {profile.bio && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{profile.bio}</p>}
                {profile.cv_text && <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{profile.cv_text}</p>}
                {profile.cv_url && (
                  <a href={profile.cv_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-600 transition-colors mt-1">
                    <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    CV bifogas
                  </a>
                )}
                {!profile.cv_text && !profile.cv_url && (
                  <Link href={`/profile/${profile.id}`}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-500 font-medium mt-1 hover:underline">
                    + Lägg till erfarenhet →
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Telefon</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="07X XXX XX XX"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Meddelande <span className="text-gray-400 font-normal">(valfritt)</span></label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder="Varför passar du för det här jobbet?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">{error}</div>}

          <button onClick={submitProfileApply} disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50 text-sm">
            {loading ? 'Skickar...' : 'Skicka ansökan'}
          </button>
        </div>
      )}

      {/* Enkel ansökan */}
      {mode === 'quick' && (
        <div className="space-y-3">
          {!profile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Ansök snabbare med ett konto</p>
              <p className="text-xs text-gray-500 mb-2">Spara din profil och ansök med ett klick.</p>
              <Link href="/register"
                className="inline-flex items-center text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                Skapa konto gratis
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Namn *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="För- och efternamn"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">E-post *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="din@email.se"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Telefon <span className="text-gray-400 font-normal">(valfritt)</span></label>
            <input type="tel" value={quickPhone} onChange={e => setQuickPhone(e.target.value)} placeholder="07X XXX XX XX"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Om dig <span className="text-gray-400 font-normal">(valfritt)</span></label>
            <textarea value={quickMessage} onChange={e => setQuickMessage(e.target.value)} rows={3}
              placeholder="Berätta kort om dig själv..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">{error}</div>}

          <button onClick={submitQuickApply} disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50 text-sm">
            {loading ? 'Skickar...' : 'Skicka ansökan'}
          </button>
        </div>
      )}

    </div>
  )
}
