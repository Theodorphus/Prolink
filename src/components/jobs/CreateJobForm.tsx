'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/lib/categories'

export default function CreateJobForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.get('title'),
        description: form.get('description'),
        category: form.get('category') || null,
        salary: form.get('salary'),
        location: form.get('location'),
        work_type: form.get('work_type'),
        employer_name: form.get('employer_name'),
        employer_email: form.get('employer_email'),
        contact_info: form.get('contact_info'),
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }

    router.push(`/jobs/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl px-4 py-3 text-sm font-medium">{error}</div>
      )}

      {/* Företagsinfo */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Om företaget</h2>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Företagsnamn <span className="text-red-500">*</span>
          </label>
          <input
            name="employer_name"
            required
            placeholder="T.ex. Kaffehuset AB"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              E-post (för ansökningar) <span className="text-red-500">*</span>
            </label>
            <input
              name="employer_email"
              type="email"
              required
              placeholder="jobb@företaget.se"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Område / Stadsdel</label>
            <input
              name="location"
              placeholder="T.ex. Hisingen, Centrum, Majorna"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Jobbinfo */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Om jobbet</h2>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Jobbtitel <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            required
            placeholder="T.ex. Städare sökes, Servitör/servitris, Lagerarbetare"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Välj typ av jobb...</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Arbetstid</label>
            <select
              name="work_type"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Välj...</option>
              <option value="heltid">Heltid</option>
              <option value="deltid">Deltid</option>
              <option value="kväll">Kväll & helg</option>
              <option value="extrajobb">Extrajobb</option>
              <option value="sommarjobb">Sommarjobb</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Lön</label>
          <input
            name="salary"
            placeholder="T.ex. 130 kr/h, 25 000 kr/mån, Enligt överenskommelse"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Beskrivning <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="Beskriv jobbet kort – vad ska göras, när, och vem ni söker. Behöver inte vara långt!"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Kontaktinfo (valfritt)</label>
          <input
            name="contact_info"
            placeholder="T.ex. Ring 07X-XXX XX XX eller maila oss"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed text-base"
      >
        {loading ? 'Publicerar...' : '🚀 Publicera jobb gratis'}
      </button>

      <p className="text-xs text-center text-gray-400">
        Gratis · Publiceras direkt · Du kan ta bort annonsen när du vill
      </p>
    </form>
  )
}
