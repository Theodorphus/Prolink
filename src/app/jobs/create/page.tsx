import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateJobForm from '@/components/jobs/CreateJobForm'

export const metadata = { title: 'Lägg ut uppdrag' }

export default async function CreateJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/jobs/create')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (profile?.role !== 'customer') {
    redirect('/jobs')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Lägg ut uppdrag</h1>
      <p className="text-gray-600 mb-8">Beskriv vad du behöver hjälp med så får du offerter från kvalificerade leverantörer.</p>
      <CreateJobForm />
    </div>
  )
}
