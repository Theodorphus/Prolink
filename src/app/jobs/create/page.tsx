import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateJobForm from '@/components/jobs/CreateJobForm'

export const metadata = {
  title: 'Publicera ett uppdrag',
  description: 'Beskriv ditt behov och ta emot offerter från relevanta frilansare och specialister.',
}

export default async function CreateJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/jobs/create')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Publicera ett uppdrag</h1>
        <p className="text-gray-500">Beskriv vad du behöver och ta emot offerter från frilansare med rätt kompetens.</p>
      </div>
      <CreateJobForm />
    </div>
  )
}
