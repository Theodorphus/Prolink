import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Hero from '@/components/home/Hero'
import ProcessTimeline from '@/components/home/ProcessTimeline'
import TwoPaths from '@/components/home/TwoPaths'
import CompetenceGrid from '@/components/home/CompetenceGrid'
import TrustSection from '@/components/home/TrustSection'
import LatestJobs, { LatestJobsSkeleton } from '@/components/home/LatestJobs'

export const metadata = {
  title: 'Hitta rätt frilansare för ditt företag',
  description:
    'Prolink kopplar ihop svenska företag med frilansare inom IT, design, ekonomi, juridik och marknadsföring. Kostnadsfritt att publicera uppdrag.',
}

export default async function HomePage() {
  const supabase = await createClient()

  // Verkliga siffror till förtroendeavsnittet. head + count hämtar bara
  // antalet, inte raderna. Alla tre tabellerna är publikt läsbara.
  const [providers, openJobs, services] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'provider'),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('services').select('id', { count: 'exact', head: true }),
  ])

  return (
    <>
      <Hero />
      <ProcessTimeline />
      <TwoPaths />
      <CompetenceGrid />

      <section className="border-b border-slate-200/70 bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="page-eyebrow">Aktuellt just nu</p>
              <h2 className="page-heading mt-3 text-[2rem] sm:text-4xl">Senaste uppdragen</h2>
            </div>
            <Link
              href="/jobs"
              className="hidden shrink-0 text-sm font-bold text-slate-600 transition hover:text-indigo-600 sm:block"
            >
              Alla uppdrag →
            </Link>
          </div>

          <Suspense fallback={<LatestJobsSkeleton />}>
            <LatestJobs />
          </Suspense>
        </div>
      </section>

      <TrustSection
        providerCount={providers.count ?? 0}
        openJobCount={openJobs.count ?? 0}
        serviceCount={services.count ?? 0}
      />

      {/* Avslutande CTA: en yta per målgrupp. */}
      <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          <div
            className="relative overflow-hidden rounded-3xl p-9 text-white sm:p-12"
            style={{ background: 'var(--gradient-ink)' }}
          >
            <div
              className="mesh mesh-drift"
              style={{ width: '18rem', height: '18rem', right: '-4rem', top: '-4rem', background: 'rgba(99,102,241,.4)' }}
            />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">
                För dig som köper tjänster
              </p>
              <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.035em]">
                Rätt hjälp utan ett stort nätverk.
              </h2>
              <p className="mt-4 max-w-lg leading-7 text-slate-300">
                Publicera ert behov en gång, jämför konkreta offerter och välj den kompetens som
                passar företaget.
              </p>
              <Link
                href="/jobs/create"
                className="mt-9 inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                Publicera uppdrag
              </Link>
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-3xl p-9 text-white sm:p-12"
            style={{ background: 'linear-gradient(140deg, #4f46e5 0%, #6366f1 55%, #14b8a6 140%)' }}
          >
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-100">
                För dig som säljer tjänster
              </p>
              <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.035em]">
                Låt nästa kund hitta dig.
              </h2>
              <p className="mt-4 max-w-lg leading-7 text-indigo-100">
                Visa vad du erbjuder, hitta relevanta uppdrag och bygg förtroende genom lyckade
                leveranser.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/services/create"
                  className="inline-flex rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-50"
                >
                  Publicera en tjänst
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex rounded-xl border border-white/40 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Se uppdrag
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
