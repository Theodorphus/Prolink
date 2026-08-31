import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryLabel, getCategoryEmoji } from '@/lib/categories'
import { Card, CardBody } from '@/components/ui/Card'
import CloseJobButton from '@/components/jobs/CloseJobButton'
import DeleteJobButton from '@/components/jobs/DeleteJobButton'

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data } = await supabase.from('jobs').select('title, description').eq('id', id).single()
  return {
    title: data?.title ?? 'Uppdrag',
    description: data?.description?.slice(0, 155) ?? 'Hitta frilansuppdrag på Prolink.',
    openGraph: { title: data?.title ?? 'Uppdrag', description: data?.description?.slice(0, 155) ?? '', images: [] },
    twitter: { card: 'summary', title: data?.title ?? 'Uppdrag', description: data?.description?.slice(0, 155) ?? '', images: [] },
  }
}

export default async function JobPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: job } = await supabase.from('jobs').select('*, customer:users(id, name, bio, avatar_url)').eq('id', id).single()
  if (!job) notFound()

  const isOwner = user?.id === job.customer_id
  const { data: viewerProfile } = user ? await supabase.from('users').select('role').eq('id', user.id).single() : { data: null }
  const isProvider = viewerProfile?.role === 'provider'
  const { data: offers } = isOwner
    ? await supabase.from('offers').select('id, price, price_type, timeline, description, status, provider:users(name, avatar_url)').eq('job_id', job.id).order('created_at', { ascending: false })
    : { data: null }
  const { data: existingOffer } = user && isProvider
    ? await supabase.from('offers').select('id, status').eq('job_id', job.id).eq('provider_id', user.id).maybeSingle()
    : { data: null }

  const workType = job.work_type === 'remote' ? 'På distans' : job.work_type === 'onsite' ? 'På plats' : job.work_type === 'hybrid' ? 'Hybrid' : null

  return (
    <div className="bg-[#f7f7f2] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/jobs" className="text-sm font-bold text-slate-500 hover:text-blue-600">← Alla uppdrag</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <main className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0 flex-1"><div className="flex items-center gap-3 text-xs font-black uppercase tracking-wider text-blue-600"><span className="rounded-xl bg-blue-50 p-2 text-xl" aria-hidden>{getCategoryEmoji(job.category)}</span>{getCategoryLabel(job.category)}</div><h1 className="mt-5 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">{job.title}</h1></div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${job.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{job.status === 'open' ? 'Öppet för offerter' : 'Stängt'}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-y border-slate-100 py-4 text-sm font-medium text-slate-500"><span>{job.customer?.name ?? 'Prolink-kund'}</span><span>{formatDate(job.created_at)}</span>{job.location && <span>{job.location}</span>}{workType && <span>{workType}</span>}</div>
              <div className="mt-7 whitespace-pre-wrap text-base leading-8 text-slate-700">{job.description}</div>
            </section>

            {isOwner && (
              <section>
                <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Inkomna förslag</p><h2 className="mt-1 text-2xl font-black">Offerter ({offers?.length ?? 0})</h2></div></div>
                <div className="space-y-3">{offers?.map(offer => { const provider = Array.isArray(offer.provider) ? offer.provider[0] : offer.provider; return <Link key={offer.id} href={`/offers/${offer.id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3">{provider?.avatar_url ? <Image src={provider.avatar_url} alt={provider.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 font-bold text-white">{provider?.name?.[0] ?? '?'}</span>}<div><p className="font-bold">{provider?.name ?? 'Leverantör'}</p><p className="text-xs text-slate-500">{offer.timeline}</p></div></div><div className="text-right"><p className="font-black text-blue-600">{formatCurrency(offer.price)}{offer.price_type === 'hourly' ? '/h' : ''}</p><p className="mt-1 text-xs capitalize text-slate-500">{offer.status}</p></div></div><p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{offer.description}</p></Link>})}{(!offers || offers.length === 0) && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Inga offerter ännu. Du får en avisering när någon svarar.</div>}</div>
              </section>
            )}
          </main>

          <aside className="space-y-4">
            <Card><CardBody className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Budget</p><p className="mt-1 text-2xl font-black text-slate-950">{job.budget ? formatCurrency(job.budget) : 'Öppen budget'}</p></div>{job.location && <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Plats</p><p className="mt-1 font-bold">{job.location}</p></div>}{workType && <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Arbetsform</p><p className="mt-1 font-bold">{workType}</p></div>}</CardBody></Card>
            {isOwner ? <Card><CardBody className="space-y-3"><p className="rounded-xl bg-blue-50 p-3 text-center text-sm font-bold text-blue-800">Det här är ditt uppdrag</p>{job.status === 'open' && <CloseJobButton jobId={job.id} />}<DeleteJobButton jobId={job.id} /></CardBody></Card> : job.status !== 'open' ? <Card><CardBody className="text-center text-sm font-medium text-slate-500">Uppdraget tar inte längre emot offerter.</CardBody></Card> : existingOffer ? <Link href={`/offers/${existingOffer.id}`} className="block rounded-xl bg-slate-950 px-6 py-4 text-center text-sm font-bold text-white hover:bg-slate-800">Visa din offert</Link> : isProvider ? <Link href={`/jobs/${job.id}/offer`} className="block rounded-xl bg-blue-600 px-6 py-4 text-center text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">Lämna offert</Link> : user ? <Card><CardBody className="text-center text-sm text-slate-600">Byt till leverantörsrollen i din profil för att lämna offert.</CardBody></Card> : <Link href={`/login?redirect=/jobs/${job.id}/offer`} className="block rounded-xl bg-blue-600 px-6 py-4 text-center text-sm font-bold text-white hover:bg-blue-700">Logga in för att lämna offert</Link>}
          </aside>
        </div>
      </div>
    </div>
  )
}
