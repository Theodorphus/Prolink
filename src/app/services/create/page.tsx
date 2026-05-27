import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CreateServiceForm from '@/components/services/CreateServiceForm'

export const metadata = {
  title: 'Erbjud en tjänst',
  description: 'Publicera din tjänst på Prolink och nå nya kunder som söker din kompetens.',
}

export default async function CreateServicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/services/create')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (profile?.role === 'customer') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-10">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Endast för leverantörer</h1>
          <p className="text-gray-600 mb-6">Ditt konto är registrerat som kund. Tjänster publiceras av leverantörer.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/jobs/create" className="inline-flex items-center justify-center bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors">
              Lägg ut ett uppdrag
            </Link>
            <Link href="/services" className="inline-flex items-center justify-center bg-gray-100 text-gray-900 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
              Bläddra tjänster
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Lägg till tjänst</h1>
      <p className="text-gray-600 mb-8">Presentera en av dina tjänster och nå potentiella kunder.</p>
      <CreateServiceForm />
    </div>
  )
}
