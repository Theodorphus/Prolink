'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { normalizeWebsite, websiteLabel } from '@/lib/trust.mjs'

export interface PortfolioItem {
  id: string
  title: string
  description: string | null
  url: string | null
  image_url: string | null
}

const MAX_ITEMS = 6
const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const fieldClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

// Sökvägen i lagringen ur den publika adressen, för att kunna radera bilden.
function storagePath(imageUrl: string) {
  const marker = '/storage/v1/object/public/avatars/'
  const index = imageUrl.indexOf(marker)
  return index === -1 ? null : decodeURIComponent(imageUrl.slice(index + marker.length).split('?')[0])
}

export default function Portfolio({ userId, items, editable, name }: { userId: string; items: PortfolioItem[]; editable: boolean; name: string }) {
  const router = useRouter()
  const [supabase] = useState(createClient)
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const file = form.get('image')
    const url = normalizeWebsite(form.get('url'))
    setError('')
    if (url === undefined) { setError('Länken måste vara en webbadress.'); return }
    const image = file instanceof File && file.size > 0 ? file : null
    if (image && !IMAGE_TYPES[image.type]) { setError('Bilden måste vara JPG, PNG eller WebP.'); return }
    if (image && image.size > 2 * 1024 * 1024) { setError('Bilden får vara max 2 MB.'); return }
    if (!image && !url) { setError('Lägg till en bild, en länk eller båda.'); return }

    setLoading(true)
    let uploaded: string | null = null
    try {
      let imageUrl: string | null = null
      if (image) {
        uploaded = `${userId}/portfolio/${crypto.randomUUID()}.${IMAGE_TYPES[image.type]}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(uploaded, image)
        if (uploadError) throw new Error('Bilden kunde inte laddas upp.')
        imageUrl = supabase.storage.from('avatars').getPublicUrl(uploaded).data.publicUrl
      }
      const { error: insertError } = await supabase.from('portfolio_items').insert({
        user_id: userId,
        title: String(form.get('title') ?? '').trim(),
        description: String(form.get('description') ?? '').trim() || null,
        url,
        image_url: imageUrl,
      })
      if (insertError) throw new Error(insertError.code === '54000' ? `Du kan visa högst ${MAX_ITEMS} arbeten.` : 'Arbetet kunde inte sparas.')
      formElement.reset()
      setAdding(false)
      router.refresh()
    } catch (submitError) {
      if (uploaded) await supabase.storage.from('avatars').remove([uploaded])
      setError(submitError instanceof Error ? submitError.message : 'Arbetet kunde inte sparas.')
    } finally {
      setLoading(false)
    }
  }

  async function remove(item: PortfolioItem) {
    if (!window.confirm(`Ta bort "${item.title}" från portfolion?`)) return
    const { error: deleteError } = await supabase.from('portfolio_items').delete().eq('id', item.id)
    if (deleteError) { setError('Arbetet kunde inte tas bort.'); return }
    const path = item.image_url && storagePath(item.image_url)
    if (path) await supabase.storage.from('avatars').remove([path])
    router.refresh()
  }

  if (!editable && items.length === 0) return null

  return (
    <section id="portfolio" className="scroll-mt-24">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="page-heading text-xl">{editable ? 'Din portfolio' : 'Portfolio'}</h2>
        {editable && !adding && items.length < MAX_ITEMS && (
          <button type="button" onClick={() => setAdding(true)} className="text-sm font-semibold text-blue-700 hover:underline">Lägg till arbete</button>
        )}
      </div>

      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {editable && adding && (
        <form onSubmit={add} className="surface mb-4 space-y-3 p-5">
          <div className="space-y-1.5">
            <label htmlFor="portfolio-title" className="block text-sm font-medium text-gray-700">Titel</label>
            <input id="portfolio-title" name="title" required minLength={2} maxLength={100} placeholder="T.ex. Ny webbplats för Salong Lugn" className={fieldClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="portfolio-description" className="block text-sm font-medium text-gray-700">Vad gjorde du? <span className="font-normal text-gray-400">(valfritt)</span></label>
            <textarea id="portfolio-description" name="description" rows={3} maxLength={500} placeholder="Uppdraget, din del och resultatet i ett par meningar." className={`${fieldClass} resize-none`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="portfolio-image" className="block text-sm font-medium text-gray-700">Bild <span className="font-normal text-gray-400">(JPG, PNG, WebP, max 2 MB)</span></label>
              <input id="portfolio-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="portfolio-url" className="block text-sm font-medium text-gray-700">Länk <span className="font-normal text-gray-400">(valfritt)</span></label>
              <input id="portfolio-url" name="url" inputMode="url" placeholder="kundensida.se" className={fieldClass} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={loading}>Spara</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setAdding(false)}>Avbryt</Button>
          </div>
        </form>
      )}

      {items.length > 0 ? (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {items.map(item => (
            <article key={item.id} className="surface flex flex-col overflow-hidden">
              {item.image_url && (
                <div className="relative aspect-[16/10] bg-slate-100">
                  <Image src={item.image_url} alt={`${item.title}, arbete av ${name}`} fill sizes="(min-width: 640px) 360px, 100vw" className="object-cover" />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1.5 p-5">
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                {item.description && <p className="text-sm leading-6 text-slate-600">{item.description}</p>}
                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="truncate text-xs font-semibold text-blue-700 hover:underline">{websiteLabel(item.url)}</a>
                  ) : <span />}
                  {editable && <button type="button" onClick={() => remove(item)} className="shrink-0 text-xs font-semibold text-slate-400 hover:text-red-700">Ta bort</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !adding && (
          <div className="surface px-6 py-8 text-center">
            <p className="muted text-sm">Visa upp till {MAX_ITEMS} tidigare arbeten med bild och länk. Det är det köpare tittar på först.</p>
            <button type="button" onClick={() => setAdding(true)} className="mt-4 inline-flex rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800">Lägg till ditt första arbete</button>
          </div>
        )
      )}
    </section>
  )
}
