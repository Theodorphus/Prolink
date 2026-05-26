'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import AvatarUpload from '@/components/profile/AvatarUpload'
import CvUpload from '@/components/profile/CvUpload'
import type { User } from '@/types/database'

export default function EditProfileForm({ profile }: { profile: User & { phone?: string | null; cv_text?: string | null; cv_url?: string | null } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [skillsInput, setSkillsInput] = useState(profile.skills?.join(', ') ?? '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const form = new FormData(e.currentTarget)
    const supabase = createClient()

    const skills = skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const { error } = await supabase
      .from('users')
      .update({
        name: form.get('name') as string,
        bio: (form.get('bio') as string) || null,
        phone: (form.get('phone') as string) || null,
        cv_text: (form.get('cv_text') as string) || null,
        hourly_rate: form.get('hourly_rate') ? Number(form.get('hourly_rate')) : null,
        skills: skills.length > 0 ? skills : null,
        linkedin_url: (form.get('linkedin_url') as string) || null,
      })
      .eq('id', profile.id)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-gray-900">Redigera profil</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm">Profilen uppdaterades!</div>}

          <div className="flex justify-center pb-2">
            <AvatarUpload
              userId={profile.id}
              name={profile.name}
              currentAvatarUrl={profile.avatar_url ?? null}
            />
          </div>

          {/* Basinfo */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Namn <span className="text-red-500">*</span></label>
            <input name="name" defaultValue={profile.name} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Telefon</label>
            <input
              name="phone"
              type="tel"
              defaultValue={(profile as any).phone ?? ''}
              placeholder="07X XXX XX XX"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Om mig</label>
            <textarea
              name="bio"
              defaultValue={profile.bio ?? ''}
              rows={3}
              placeholder="Berätta kort om dig själv..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* CV-sektion – fritext-CV som återanvänds vid ansökningar */}
          <div className="space-y-1.5 border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700">
              Erfarenhet & bakgrund
              <span className="ml-2 text-xs text-gray-400 font-normal">Används automatiskt i ansökningar</span>
            </label>
            <textarea
              name="cv_text"
              defaultValue={(profile as any).cv_text ?? ''}
              rows={5}
              placeholder={`Beskriv din erfarenhet, tidigare jobb och vad du är bra på.\n\nT.ex.:\n– 2 år som städare på Städproffs AB\n– Jobbat i kök på Restaurang Grön\n– Pålitlig, punktlig, trivs med fysiskt arbete`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400">Inget formellt CV krävs – skriv fritt om din bakgrund.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              CV-dokument
              <span className="ml-2 text-xs text-gray-400 font-normal">Bifogas vid ansökan</span>
            </label>
            <CvUpload userId={profile.id} currentCvUrl={(profile as any).cv_url ?? null} />
          </div>

          {profile.role === 'provider' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Timpris (SEK/h)</label>
                <input
                  name="hourly_rate"
                  type="number"
                  min="0"
                  defaultValue={profile.hourly_rate?.toString() ?? ''}
                  placeholder="T.ex. 850"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Kompetenser (kommaseparerade)</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={e => setSkillsInput(e.target.value)}
                  placeholder="T.ex. Städning, Kassa, Truckkörkort"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">LinkedIn (valfritt)</label>
            <input
              name="linkedin_url"
              type="url"
              defaultValue={profile.linkedin_url ?? ''}
              placeholder="https://linkedin.com/in/ditt-namn"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={loading}>Spara ändringar</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
