import { notFound, redirect } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import ChatWindow from '@/components/chat/ChatWindow'
import type { MessageWithSender } from '@/types/database'

export const metadata = { title: 'Chatt', robots: { index: false, follow: false } }

export default async function MessagesPage(props: { params: Promise<{ offerId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await getUser()

  if (!user) redirect('/login')

  const { data: offer } = await supabase
    .from('offers')
    .select('id, status, provider_id, job:jobs(id, title, customer_id, customer:users!jobs_customer_id_fkey(name)), provider:users(name)')
    .eq('id', params.offerId)
    .single()

  if (!offer) notFound()

  const job = Array.isArray(offer.job) ? offer.job[0] : offer.job
  const provider = Array.isArray(offer.provider) ? offer.provider[0] : offer.provider
  const customer = Array.isArray(job?.customer) ? job?.customer[0] : job?.customer

  const isCustomer = user.id === job?.customer_id
  const isProvider = user.id === offer.provider_id

  if (!isCustomer && !isProvider) redirect('/')

  // Hela konversationen hämtades tidigare vid varje sidvisning. En långkörd
  // chatt växer obegränsat, så de senaste meddelandena hämtas fallande och
  // vänds sedan till stigande för visningen.
  const MESSAGE_PAGE_SIZE = 50
  const { data: latestMessages, error: messagesError } = await supabase
    .from('messages')
    .select('*, sender:users(id, name, avatar_url)')
    .eq('offer_id', params.offerId)
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .limit(MESSAGE_PAGE_SIZE)

  if (messagesError) throw new Error('Meddelandena kunde inte hämtas. Försök igen.')
  const messages = (latestMessages ?? []).slice().reverse()

  const otherParty = isCustomer ? provider?.name : customer?.name

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{job?.title}</h1>
          <p className="text-sm text-gray-500">Chatt med {otherParty}</p>
        </div>
      </div>

      <ChatWindow
        offerId={params.offerId}
        currentUserId={user.id}
        initialMessages={(messages ?? []) as MessageWithSender[]}
      />
    </div>
  )
}
