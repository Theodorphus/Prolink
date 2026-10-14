import { notFound, redirect } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { isUuid } from '@/lib/validation'
import EditServiceForm from '@/components/services/EditServiceForm'

export const metadata = { title: 'Redigera tjänst', robots: { index: false, follow: false } }

export default async function EditServicePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  if (!isUuid(id)) notFound()
  const { data: { user } } = await getUser()
  if (!user) redirect(`/login?redirect=/services/${id}/edit`)

  const supabase = await createClient()
  const { data: service, error } = await supabase
    .from('services')
    .select('id, provider_id, title, description, category, price, delivery_time, vat_included')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('Tjänsten kunde inte hämtas.')
  if (!service || service.provider_id !== user.id) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="page-heading mb-2 text-3xl">Redigera tjänst</h1>
      <p className="text-gray-600 mb-8">Ändringarna syns direkt för alla som besöker tjänsten.</p>
      <EditServiceForm
        serviceId={service.id}
        defaults={{
          title: service.title,
          description: service.description,
          category: service.category ?? undefined,
          price: String(service.price),
          delivery_time: service.delivery_time,
          vat: service.vat_included === true ? 'included' : service.vat_included === false ? 'excluded' : 'unknown',
        }}
      />
    </div>
  )
}
