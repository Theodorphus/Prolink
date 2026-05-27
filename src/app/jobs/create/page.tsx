import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateJobForm from '@/components/jobs/CreateJobForm'

export const metadata = {
  title: 'Lägg upp jobb gratis',
  description: 'Lägg upp ett jobb i Göteborg gratis och få ansökningar direkt. Inga avgifter.',
}

export default async function CreateJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/jobs/create')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Lägg upp jobb gratis</h1>
        <p className="text-gray-500">Tar 2 minuter. Publiceras direkt. Nå tusentals jobbsökare i Göteborg.</p>
      </div>
      <CreateJobForm />
    </div>
  )
}
