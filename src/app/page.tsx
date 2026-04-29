import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: jobs }, { data: services }] = await Promise.all([
    supabase
      .from('jobs')
      .select('*, customer:users(name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('services')
      .select('*, provider:users(name)')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Hitta rätt kompetens.<br />Direkt.
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Prolink kopplar ihop kunder med kvalificerade leverantörer i Sverige. Lägg ut ett uppdrag eller erbjud dina tjänster — gratis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/jobs/create">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                Lägg ut uppdrag
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="ghost" className="text-white border border-white/30 hover:bg-white/10">
                Bläddra tjänster
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">Hur det fungerar</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Lägg ut uppdrag', desc: 'Beskriv vad du behöver hjälp med och sätt din budget.' },
              { step: '2', title: 'Få offerter', desc: 'Kvalificerade leverantörer skickar offerter direkt till dig.' },
              { step: '3', title: 'Välj och chatta', desc: 'Acceptera den bästa offerten och kommunicera direkt.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest jobs */}
      {jobs && jobs.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Senaste uppdragen</h2>
              <Link href="/jobs" className="text-sm text-blue-600 hover:underline">Se alla →</Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job: any) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardBody className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{job.title}</h3>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100">
                        <span>{job.customer?.name}</span>
                        <span>{job.budget ? formatCurrency(job.budget) : 'Öppen budget'}</span>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest services */}
      {services && services.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Populära tjänster</h2>
              <Link href="/services" className="text-sm text-blue-600 hover:underline">Se alla →</Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service: any) => (
                <Link key={service.id} href={`/services/${service.id}`}>
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardBody className="flex flex-col gap-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{service.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">{service.description}</p>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                        <span className="font-semibold text-blue-600">{formatCurrency(service.price)}</span>
                        <span className="text-xs text-gray-400">{service.delivery_time}</span>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Redo att börja?</h2>
          <p className="text-blue-100 mb-8">Registrera dig gratis och hitta din nästa kund eller leverantör idag.</p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
              Skapa konto gratis
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
