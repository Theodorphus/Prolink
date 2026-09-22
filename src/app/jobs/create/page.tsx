import { redirect, notFound } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import CreateJobForm from '@/components/jobs/CreateJobForm'
import { CATEGORIES } from '@/lib/categories'

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Publicera ett uppdrag',
  description: 'Beskriv ditt behov och ta emot offerter från relevanta frilansare och specialister.',
}

export default async function CreateJobPage({ searchParams }: { searchParams: Promise<{ service?: string; provider?: string; category?: string }> }) {
  const { service: serviceId, provider: providerId, category } = await searchParams
  const initialCategory = CATEGORIES.some(item => item.value === category) ? category : undefined
  const supabase = await createClient()
  const { data: { user } } = await getUser()

  const query = new URLSearchParams()
  if (serviceId) query.set('service', serviceId)
  if (providerId) query.set('provider', providerId)
  if (initialCategory) query.set('category', initialCategory)
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/jobs/create?${query}`)}`)
  let target: { id: string; name: string; serviceId?: string; title?: string; category?: string } | undefined
  if (serviceId || providerId) {
    const { data: service, error: serviceError } = serviceId ? await supabase.from('services').select('id, title, category, provider_id').eq('id', serviceId).maybeSingle() : { data: null, error: null }
    if (serviceError) throw new Error('Tjänsten kunde inte hämtas.')
    if (serviceId && !service) notFound()
    const { data: provider, error } = await supabase.from('users').select('id, name').eq('id', service?.provider_id ?? providerId!).eq('role', 'provider').maybeSingle()
    if (error) throw new Error('Leverantören kunde inte hämtas.')
    if (!provider || provider.id === user.id) notFound()
    target = { ...provider, serviceId: service?.id, title: service?.title, category: service?.category }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">{target ? `Förfrågan till ${target.name}` : 'Publicera ett uppdrag'}</h1>
        <p className="text-gray-500">{target ? 'Förfrågan är privat mellan er. Leverantören svarar med en offert, sedan kan ni fortsätta i chatten.' : 'Beskriv vad du behöver och ta emot offerter från frilansare med rätt kompetens.'}</p>
      </div>
      <CreateJobForm target={target} initialCategory={initialCategory} />
    </div>
  )
}
