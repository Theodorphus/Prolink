import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import ServiceCard from '@/components/services/ServiceCard'
import { createPublicClient } from '@/lib/supabase/public'
const featuredServices = unstable_cache(async () => {
  const { data, error } = await createPublicClient().from('services').select('*, provider:users(id, name, avatar_url)').order('created_at', { ascending: false }).order('id').limit(3)
  if (error) throw new Error('Tjänsterna kunde inte hämtas.')
  return data
}, ['public-featured-services'], { revalidate: 60 })
export default async function FeaturedServices() {
  let data
  try { data = await featuredServices() }
  catch { return <p className="px-4 py-8 text-center">Tjänsterna kunde inte hämtas. <Link className="underline" href="/services">Försök igen</Link></p> }
  if (!data?.length) return null
  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><div className="mb-6 flex items-center justify-between gap-4"><h2 className="page-heading text-2xl">Tjänster att börja med</h2><Link className="text-sm font-semibold underline" href="/services">Alla tjänster</Link></div><div className="grid gap-4 md:grid-cols-3">{data.map(service => <ServiceCard key={service.id} service={service} />)}</div></section>
}
