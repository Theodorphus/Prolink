'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import type { MessageWithSender } from '@/types/database'

export default function ChatWindow({ offerId, currentUserId, initialMessages }: {
  offerId: string; currentUserId: string; initialMessages: MessageWithSender[]
}) {
  return <Conversation key={offerId} offerId={offerId} currentUserId={currentUserId} initialMessages={initialMessages} />
}

function Conversation({ offerId, currentUserId, initialMessages }: { offerId: string; currentUserId: string; initialMessages: MessageWithSender[] }) {
  const [messages, setMessages] = useState(initialMessages)
  const [supabase] = useState(createClient)
  const userId = currentUserId
  const [connection, setConnection] = useState('Ansluter…')
  const [error, setError] = useState('')
  const [older, setOlder] = useState(initialMessages.length === 50)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const cursor = useRef(initialMessages.at(-1))
  const refreshing = useRef(false)
  const list = useRef<HTMLDivElement>(null)
  const merge = useCallback((rows: MessageWithSender[]) => {
    setMessages(previous => {
      const byId = new Map(previous.map(row => [row.id, row]))
      rows.forEach(row => byId.set(row.id, row))
      return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
    })
  }, [])

  const refresh = useCallback(async () => {
    if (refreshing.current) return
    refreshing.current = true
    try {
      for (let batch = 0; batch < 20; batch++) {
        const params = cursor.current ? new URLSearchParams({ after: cursor.current.created_at, after_id: cursor.current.id }) : new URLSearchParams()
        const res = await fetch(`/api/messages/${offerId}?${params}`)
        if (!res.ok) throw new Error()
        const rows: MessageWithSender[] = await res.json()
        merge(rows)
        if (rows.length) cursor.current = rows.at(-1)
        if (rows.length < 50) break
      }
      setError('')
    } catch { setError('Kunde inte uppdatera chatten. Försöker igen automatiskt.') }
    finally { refreshing.current = false }

  }, [offerId, merge])

  useEffect(() => {
    let active = true
    const channel = supabase.channel(`messages:${offerId}`).on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages', filter: `offer_id=eq.${offerId}`,
    }, () => { void refresh() }).subscribe(status => {
      if (!active) return
      setConnection(status === 'SUBSCRIBED' ? 'Ansluten' : 'Återansluter… Du kan fortfarande skicka meddelanden.')
      if (status === 'SUBSCRIBED') void refresh()
    })
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, 15000)
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    window.addEventListener('online', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('online', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
      void supabase.removeChannel(channel)
    }
  }, [supabase, offerId, refresh])

  async function loadOlder() {
    if (!messages[0] || loadingOlder) return
    setLoadingOlder(true)
    try {
      const params = new URLSearchParams({ before: messages[0].created_at, before_id: messages[0].id })
      const res = await fetch(`/api/messages/${offerId}?${params}`)
      if (!res.ok) throw new Error()
      const rows: MessageWithSender[] = await res.json()
      merge(rows)
      setOlder(rows.length === 50)
    } catch { setError('Kunde inte hämta äldre meddelanden. Försök igen.') }
    finally { setLoadingOlder(false) }
  }

  async function handleSend(content: string, attachmentPath?: string, requestId?: string) {
    const res = await fetch(`/api/messages/${offerId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, attachment_path: attachmentPath, id: requestId }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.id) throw new Error(data?.error ?? 'Kunde inte skicka. Försök igen.')
    merge([data])
    setTimeout(() => list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'instant' }), 0)
  }

  return <div className="flex flex-col flex-1 min-h-0">
    <p role="status" className="mb-2 text-xs text-slate-500">{connection}</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div ref={list} role="log" aria-label="Meddelanden" aria-live="polite" className="flex-1 overflow-y-auto space-y-4 pr-1">
      {older && <button type="button" disabled={loadingOlder} onClick={loadOlder} className="text-sm underline">{loadingOlder ? 'Hämtar…' : 'Visa äldre meddelanden'}</button>}
      {messages.length === 0 && <p className="py-12 text-center text-slate-500">Inget skrivet än — starta konversationen!</p>}
      {messages.map(message => <ChatMessage key={message.id} message={message} isOwn={message.sender_id === userId} />)}
    </div>
    <div className="mt-4 border-t border-gray-200 pt-4"><ChatInput onSend={handleSend} offerId={offerId} /></div>
  </div>
}
