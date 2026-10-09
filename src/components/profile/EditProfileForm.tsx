'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/categories'
import AvatarUpload from '@/components/profile/AvatarUpload'
import type { User, UserPrivateProfile } from '@/types/database'
import {
  InputValidationError,
  optionalHttpUrl,
  optionalText,
  requiredText,
} from '@/lib/validation'
import { normalizeWebsite, WORK_MODES } from '@/lib/trust.mjs'

type EditableProfile = User & Pick<UserPrivateProfile, 'phone'> & { email_jobs?: boolean; email_messages?: boolean; notification_categories?: string[] }

export default function EditProfileForm({ profile }: { profile: EditableProfile }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [skillsInput, setSkillsInput] = useState(profile.skills?.join(', ') ?? '')
  const [bioLength, setBioLength] = useState(profile.bio?.trim().length ?? 0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const form = new FormData(e.currentTarget)
    const supabase = createClient()

    try {
      const skills = skillsInput
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean)

      if (skills.length > 25 || skills.some(skill => skill.length > 60)) {
        throw new InputValidationError('Ange max 25 kompetenser med max 60 tecken per kompetens.')
      }

      const hourlyRateValue = form.get('hourly_rate')
      const hourlyRate = hourlyRateValue ? Number(hourlyRateValue) : null
      if (hourlyRate !== null && (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 100_000)) {
        throw new InputValidationError('Timpriset är ogiltigt.')
      }

      const website = normalizeWebsite(form.get('website_url'))
      if (website === undefined) throw new InputValidationError('Hemsidan måste vara en webbadress, till exempel dittforetag.se.')

      const { error: publicError } = await supabase
        .from('users')
        .update({
          name: requiredText(form.get('name'), 'Namn', 1, 100),
          bio: optionalText(form.get('bio'), 'Om mig', 3000),
          hourly_rate: hourlyRate,
          skills: skills.length > 0 ? skills : null,
          linkedin_url: optionalHttpUrl(form.get('linkedin_url'), 'LinkedIn'),
          website_url: website,
          location: optionalText(form.get('location'), 'Ort', 80),
          ...(profile.role === 'provider' ? { work_mode: (['remote', 'onsite', 'hybrid'] as const).find(mode => mode === form.get('work_mode')) ?? null } : {}),
        })
        .eq('id', profile.id)

      if (publicError) throw publicError

      const { error: privateError } = await supabase
        .from('user_private_profiles')
        .upsert({
          user_id: profile.id,
          phone: optionalText(form.get('phone'), 'Telefon', 50),
          email_jobs: form.get('email_jobs') === 'on',
          email_messages: form.get('email_messages') === 'on',
          notification_categories: form.getAll('notification_categories'),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (privateError) throw privateError

      setSuccess(true)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Profilen kunde inte sparas.')
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

          <fieldset className="space-y-3 rounded-xl border p-4">
            <legend className="font-semibold">Mejlnotiser</legend>
            <label className="flex gap-2"><input type="checkbox" name="email_jobs" defaultChecked={profile.email_jobs ?? true} /> Nya uppdrag</label>
            <label className="flex gap-2"><input type="checkbox" name="email_messages" defaultChecked={profile.email_messages ?? true} /> Chattnotiser (högst en per konversation per 15 minuter)</label>
            <p className="text-sm text-slate-600">Välj kategorier för uppdragsnotiser. Inget valt betyder alla kategorier.</p>
            <div className="grid gap-2 sm:grid-cols-2">{CATEGORIES.map(c => <label key={c.value} className="flex gap-2 text-sm"><input type="checkbox" name="notification_categories" value={c.value} defaultChecked={profile.notification_categories?.includes(c.value)} />{c.label}</label>)}</div>
            <p className="text-xs text-slate-500">Riktade förfrågningar, offerter och avtalsbesked skickas alltid.</p>
          </fieldset>
          {/* Basinfo */}
          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700">Namn <span className="text-red-500">*</span></label>
            <input id="profile-name"
              autoComplete="name"
              name="name" defaultValue={profile.name} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700">Telefon</label>
            <input
              id="profile-phone" autoComplete="tel"
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ''}
              placeholder="07X XXX XX XX"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-bio" className="block text-sm font-medium text-gray-700">Om mig</label>
            {/* Ett tomt fält gav enradiga beskrivningar. Stödfrågorna visar vad
                köpare letar efter. */}
            {profile.role === 'provider' && (
              <ul id="profile-bio-hjalp" className="list-disc space-y-0.5 pl-5 text-xs text-gray-500">
                <li>Vem hjälper du, och med vad?</li>
                <li>Vad levererar du konkret, och vad har du gjort tidigare?</li>
                <li>Hur jobbar du: tidsplan, kontakt och vad kunden behöver bidra med?</li>
              </ul>
            )}
            <textarea
              id="profile-bio"
              name="bio"
              defaultValue={profile.bio ?? ''}
              rows={profile.role === 'provider' ? 7 : 3}
              maxLength={3000}
              onChange={event => setBioLength(event.target.value.trim().length)}
              aria-describedby={profile.role === 'provider' ? 'profile-bio-hjalp profile-bio-antal' : undefined}
              placeholder={profile.role === 'provider'
                ? 'T.ex. Jag bygger snabba webbplatser åt små företag i Göteborg. Senast gjorde jag ... Du får en färdig sida inom två veckor och ...'
                : 'Berätta kort om dig själv...'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            {profile.role === 'provider' && (
              <p id="profile-bio-antal" className={`text-xs ${bioLength >= 150 ? 'text-emerald-700' : 'text-gray-500'}`}>
                {bioLength} tecken{bioLength < 150 ? ` · minst 150 rekommenderas` : ''}
              </p>
            )}
          </div>

          <div className={profile.role === 'provider' ? 'grid gap-4 sm:grid-cols-2' : ''}>
            <div className="space-y-1.5">
              <label htmlFor="profile-location" className="block text-sm font-medium text-gray-700">Ort</label>
              <input
                id="profile-location" autoComplete="address-level2"
                name="location"
                maxLength={80}
                defaultValue={profile.location ?? ''}
                placeholder="T.ex. Göteborg"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {profile.role === 'provider' && (
              <div className="space-y-1.5">
                <label htmlFor="profile-work-mode" className="block text-sm font-medium text-gray-700">Arbetssätt</label>
                <select
                  id="profile-work-mode"
                  name="work_mode"
                  defaultValue={profile.work_mode ?? ''}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Välj</option>
                  {Object.entries(WORK_MODES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            )}
          </div>

          {profile.role === 'provider' && (
            <>
              <div className="space-y-1.5">
                <label htmlFor="profile-hourly-rate" className="block text-sm font-medium text-gray-700">Timpris (SEK/h)</label>
                <input
                  id="profile-hourly-rate"
              name="hourly_rate"
                  type="number"
                  min="0"
                  defaultValue={profile.hourly_rate?.toString() ?? ''}
                  placeholder="T.ex. 850"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="profile-skills" className="block text-sm font-medium text-gray-700">Kompetenser (kommaseparerade)</label>
                <input
                  type="text"
                  id="profile-skills"
              value={skillsInput}
                  onChange={e => setSkillsInput(e.target.value)}
                  placeholder="T.ex. Next.js, SEO, Redovisning, Figma"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label htmlFor="profile-linkedin" className="block text-sm font-medium text-gray-700">LinkedIn (valfritt)</label>
            <input
              id="profile-linkedin" autoComplete="url"
              name="linkedin_url"
              type="url"
              defaultValue={profile.linkedin_url ?? ''}
              placeholder="https://linkedin.com/in/ditt-namn"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-website" className="block text-sm font-medium text-gray-700">Hemsida eller portfolio (valfritt)</label>
            <input
              id="profile-website" autoComplete="url"
              name="website_url"
              inputMode="url"
              defaultValue={profile.website_url ?? ''}
              placeholder="dittforetag.se"
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
