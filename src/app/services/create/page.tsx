import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateServiceForm from '@/components/services/CreateServiceForm'

export const metadata = { title: 'Ny tjänst' }

export default async function CreateServicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/services/create')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'provider') redirect('/services')

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Lägg till tjänst</h1>
      <p className="text-gray-600 mb-8">Presentera en av dina tjänster och nå potentiella kunder.</p>
      <CreateServiceForm />
    </div>
  )
}
