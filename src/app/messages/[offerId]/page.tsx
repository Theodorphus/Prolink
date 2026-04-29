import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatWindow from '@/components/chat/ChatWindow'
import type { MessageWithSender } from '@/types/database'

export const metadata = { title: 'Chatt' }

export default async function MessagesPage({ params }: { params: { offerId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: offer } = await supabase
    .from('offers')
    .select('id, status, provider_id, job:jobs(id, title, customer_id, customer:users(name)), provider:users(name)')
    .eq('id', params.offerId)
    .single()

  if (!offer) notFound()

  const offerAny = offer as any
  const job = Array.isArray(offerAny.job) ? offerAny.job[0] : offerAny.job
  const provider = Array.isArray(offerAny.provider) ? offerAny.provider[0] : offerAny.provider
  const customer = Array.isArray(job?.customer) ? job?.customer[0] : job?.customer

  const isCustomer = user.id === job?.customer_id
  const isProvider = user.id === offerAny.provider_id

  if (!isCustomer && !isProvider) redirect('/')

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:users(id, name, avatar_url)')
    .eq('offer_id', params.offerId)
    .order('created_at', { ascending: true })

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
