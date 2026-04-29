import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata = { title: 'Uppdrag' }

export default async function JobsPage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, customer:users(name), offers(id)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Uppdrag</h1>
          <p className="text-gray-600 mt-1">{jobs?.length ?? 0} öppna uppdrag</p>
        </div>
        <Link href="/jobs/create">
          <Button>+ Lägg ut uppdrag</Button>
        </Link>
      </div>

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
            <p className="text-lg">Inga öppna uppdrag just nu.</p>
            <Link href="/jobs/create" className="mt-4 inline-block">
              <Button>Lägg ut det första uppdraget</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
