'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import AvatarUpload from '@/components/profile/AvatarUpload'
import type { User } from '@/types/database'

export default function EditProfileForm({ profile }: { profile: User }) {
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
        bio: form.get('bio') as string || null,
        hourly_rate: form.get('hourly_rate') ? Number(form.get('hourly_rate')) : null,
        skills: skills.length > 0 ? skills : null,
        linkedin_url: form.get('linkedin_url') as string || null,
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

          <Input label="Namn" name="name" defaultValue={profile.name} required />
          <Textarea label="Bio" name="bio" defaultValue={profile.bio ?? ''} rows={3} placeholder="Berätta lite om dig själv..." />

          {profile.role === 'provider' && (
            <>
              <Input
                label="Timpris (SEK/h)"
                name="hourly_rate"
                type="number"
                min="0"
                defaultValue={profile.hourly_rate?.toString() ?? ''}
                placeholder="T.ex. 850"
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Kompetenser (kommaseparerade)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={e => setSkillsInput(e.target.value)}
                  placeholder="T.ex. React, Node.js, Figma"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

            <Input
            label="LinkedIn-profil (URL)"
            name="linkedin_url"
            type="url"
            defaultValue={profile.linkedin_url ?? ''}
            placeholder="https://linkedin.com/in/ditt-namn"
          />

          <div className="flex justify-end">
            <Button type="submit" loading={loading}>Spara ändringar</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
