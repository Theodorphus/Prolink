import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import JobFilters from '@/components/jobs/JobFilters'

export const metadata = {
  title: 'Uppdrag – Hitta freelanceuppdrag | Prolink',
  description: 'Bläddra bland lediga uppdrag från svenska företag och privatpersoner. Skicka offert och börja jobba idag.',
}

interface Props {
  searchParams: { q?: string; sort?: string; budget?: string }
}

export default async function JobsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { q, sort = 'newest', budget = 'all' } = searchParams

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('users').select('role').eq('id', user.id).single()
    : { data: null }
  const isCustomer = profile?.role === 'customer'
  const isLoggedIn = !!user

  let query = supabase
    .from('jobs')
    .select('*, customer:users(name), offers(id, status)')
    .eq('status', 'open')

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  if (budget === 'with') {
    query = query.not('budget', 'is', null)
  } else if (budget === 'without') {
    query = query.is('budget', null)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'budget_high':
      query = query.order('budget', { ascending: false, nullsFirst: false })
      break
    case 'budget_low':
      query = query.order('budget', { ascending: true, nullsFirst: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data: rawJobs } = await query
  const jobs = rawJobs?.filter(
    (job: any) => !job.offers?.some((o: any) => ['accepted', 'delivered'].includes(o.status))
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Uppdrag</h1>
          <p className="text-gray-600 mt-1">{jobs?.length ?? 0} öppna uppdrag</p>
        </div>
        {isCustomer && (
          <Link
            href="/jobs/create"
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Lägg ut uppdrag
          </Link>
        )}
        {!isLoggedIn && (
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Lägg ut uppdrag
          </Link>
        )}
      </div>

      <Suspense>
        <JobFilters />
      </Suspense>

      <div className="space-y-4">
        {jobs?.map((job: any) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
            <Card className="group-hover:shadow-md transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h2>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{job.customer?.name}</span>
                      <span>•</span>
                      <span>{formatDate(job.created_at)}</span>
                      <span>•</span>
                      <span>{job.offers?.length ?? 0} offert{(job.offers?.length ?? 0) !== 1 ? 'er' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-blue-600 text-lg">
                      {job.budget ? formatCurrency(job.budget) : 'Öppen'}
                    </p>
                    <p className="text-xs text-gray-400">budget</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
        {(!jobs || jobs.length === 0) && (
          <div className="text-center py-16 text-gray-500">
            {q ? (
              <p className="text-lg">Inga uppdrag matchade &ldquo;{q}&rdquo;.</p>
            ) : isCustomer ? (
              <>
                <p className="text-lg">Inga öppna uppdrag just nu.</p>
                <Link
                  href="/jobs/create"
                  className="mt-4 inline-flex items-center bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Lägg ut det första uppdraget
                </Link>
              </>
            ) : (
              <p className="text-lg">Inga öppna uppdrag just nu — kom tillbaka senare.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
