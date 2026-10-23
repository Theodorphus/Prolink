'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { notifyUnreadChanged } from '@/components/layout/useUnreadCount'
import { createClient } from '@/lib/supabase/client'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { useLocale, useT } from '@/i18n/client'
import { msg } from '@/i18n/msg.mjs'
import type { MessageWithSender } from '@/types/database'

export default function ChatWindow({ offerId, currentUserId, initialMessages }: {
  offerId: string; currentUserId: string; initialMessages: MessageWithSender[]
}) {
  return <Conversation key={offerId} offerId={offerId} currentUserId={currentUserId} initialMessages={initialMessages} />
}

function Conversation({ offerId, currentUserId, initialMessages }: { offerId: string; currentUserId: string; initialMessages: MessageWithSender[] }) {
  const t = useT()
  const locale = useLocale()
  const [messages, setMessages] = useState(initialMessages)
  const [supabase] = useState(createClient)
  const userId = currentUserId
  const [connection, setConnection] = useState(msg('Ansluter…'))
  const [error, setError] = useState('')
  const [older, setOlder] = useState(initialMessages.length === 50)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [translations, setTranslations] = useState<Record<string, { content: string; same: boolean }>>({})
  const [translating, setTranslating] = useState<Set<string>>(new Set())
  const [auto, setAuto] = useState(false)
  // Meddelanden som redan begärts, så att ett misslyckande inte upprepas vid varje uppdatering.
  const requested = useRef(new Set<string>())
  const [readThrough, setReadThrough] = useState(initialMessages.at(-1))
  const cursor = useRef(initialMessages.at(-1))
  const refreshing = useRef(false)
  const list = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const previousHeight = useRef<number | null>(null)
  const lastRead = useRef<string | null>(null)
  const merge = useCallback((rows: MessageWithSender[]) => {
    setMessages(previous => {
      const byId = new Map(previous.map(row => [row.id, row]))
      rows.forEach(row => byId.set(row.id, row))
      return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
    })
  }, [])

  const autoKey = `prolink:chat-auto-translate:${offerId}`
  useEffect(() => {
    try { setAuto(localStorage.getItem(autoKey) === '1') } catch { /* Utan lagring får man slå på det igen. */ }
  }, [autoKey])

  function toggleAuto(on: boolean) {
    setAuto(on)
    try { localStorage.setItem(autoKey, on ? '1' : '0') } catch { /* Valet gäller då bara tills sidan laddas om. */ }
  }

  const translate = useCallback(async (ids: string[]) => {
    const wanted = ids.filter(id => !requested.current.has(id))
    if (wanted.length === 0) return
    wanted.forEach(id => requested.current.add(id))
    setTranslating(previous => new Set([...previous, ...wanted]))
    try {
      for (let start = 0; start < wanted.length; start += 50) {
        const res = await fetch(`/api/messages/${offerId}/translate`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: wanted.slice(start, start + 50), lang: locale }),
        })
        if (!res.ok) throw new Error()
        const data: { translations: Record<string, { content: string; same: boolean }> } = await res.json()
        setTranslations(previous => ({ ...previous, ...data.translations }))
      }
      setError('')
    } catch {
      wanted.forEach(id => requested.current.delete(id))
      setError(msg('Kunde inte översätta meddelandet. Försök igen.'))
    } finally {
      setTranslating(previous => new Set([...previous].filter(id => !wanted.includes(id))))
    }
  }, [offerId, locale])

  // Vid "översätt automatiskt" översätts varje inkommande meddelande när det dyker upp.
  // Ett misslyckat försök provas inte om förrän man klickar på knappen.
  const autoAttempted = useRef(new Set<string>())
  useEffect(() => {
    if (!auto) return
    const ids = messages
      .filter(message => message.sender_id !== userId && message.content.trim() && !autoAttempted.current.has(message.id) && !(message.id in translations))
      .map(message => message.id)
    ids.forEach(id => autoAttempted.current.add(id))
    if (ids.length) void translate(ids)
  }, [auto, messages, translations, translate, userId])

  useEffect(() => {
    const element = list.current
    if (!element) return
    if (previousHeight.current !== null) {
      element.scrollTop += element.scrollHeight - previousHeight.current
      previousHeight.current = null
    } else if (stickToBottom.current) {
      element.scrollTop = element.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const latest = readThrough
    if (!latest) return
    let pending = false
    async function acknowledge() {
      if (!latest || pending || document.visibilityState !== 'visible' || !document.hasFocus() || lastRead.current === latest.id) return
      pending = true
      try {
        const { error: readError } = await supabase.rpc('mark_conversation_read', { p_offer_id: offerId, p_message_id: latest.id })
        if (!readError) {
          lastRead.current = latest.id
          notifyUnreadChanged()
        }
      } catch { /* Retry on the next refresh or focus event. */ }
      finally { pending = false }
    }
    void acknowledge()
    const retry = setInterval(() => { void acknowledge() }, 15000)
    window.addEventListener('focus', acknowledge)
    document.addEventListener('visibilitychange', acknowledge)
    return () => {
      clearInterval(retry)
      window.removeEventListener('focus', acknowledge)
      document.removeEventListener('visibilitychange', acknowledge)
    }
  }, [readThrough, supabase, offerId])

  const refresh = useCallback(async () => {
    if (refreshing.current) return
    refreshing.current = true
    try {
      for (let batch = 0; batch < 20; batch++) {
        const params = cursor.current ? new URLSearchParams({ after: cursor.current.created_at, after_id: cursor.current.id }) : new URLSearchParams()
        const res = await fetch(`/api/messages/${offerId}?${params}`)
        if (!res.ok) throw new Error()
        const rows: MessageWithSender[] = await res.json()
        if (!cursor.current && rows.length === 50) setOlder(true)
        merge(rows)
        if (rows.length) {
          cursor.current = rows.at(-1)
          setReadThrough(rows.at(-1))
        }
        if (rows.length < 50) break
      }
      setError('')
    } catch { setError(msg('Kunde inte uppdatera chatten. Försöker igen automatiskt.')) }
    finally { refreshing.current = false }

  }, [offerId, merge])

  useEffect(() => {
    let active = true
    const channel = supabase.channel(`messages:${offerId}`).on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages', filter: `offer_id=eq.${offerId}`,
    }, () => { void refresh() }).subscribe(status => {
      if (!active) return
      setConnection(status === 'SUBSCRIBED' ? msg('Ansluten') : msg('Återansluter… Du kan fortfarande skicka meddelanden.'))
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
      previousHeight.current = list.current?.scrollHeight ?? null
      merge(rows)
      setOlder(rows.length === 50)
    } catch { setError(msg('Kunde inte hämta äldre meddelanden. Försök igen.')) }
    finally { setLoadingOlder(false) }
  }

  async function handleSend(content: string, attachmentPath?: string, requestId?: string) {
    const res = await fetch(`/api/messages/${offerId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, attachment_path: attachmentPath, id: requestId }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.id) throw new Error(data?.error ?? msg('Kunde inte skicka. Försök igen.'))
    merge([data])
    setTimeout(() => list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'instant' }), 0)
  }

  return <div className="flex flex-col flex-1 min-h-0">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <p role="status" className="text-xs text-slate-500">{t(connection)}</p>
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input type="checkbox" checked={auto} onChange={event => toggleAuto(event.target.checked)} />
        {t('Översätt inkommande meddelanden automatiskt')}
      </label>
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{t(error)}</p>}
    <div ref={list} onScroll={() => { const el = list.current; if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80 }} role="log" aria-label={t('Meddelanden')} aria-live="polite" className="flex-1 overflow-y-auto space-y-4 pr-1">
      {older && <button type="button" disabled={loadingOlder} onClick={loadOlder} className="text-sm underline">{loadingOlder ? t('Hämtar…') : t('Visa äldre meddelanden')}</button>}
      {messages.length === 0 && <p className="py-12 text-center text-slate-500">{t('Inga meddelanden ännu. Har du frågor om offerten kan du skriva här.')}</p>}
      {messages.map(message => <ChatMessage key={message.id} message={message} isOwn={message.sender_id === userId} translation={translations[message.id]} translating={translating.has(message.id)} auto={auto} onTranslate={() => { void translate([message.id]) }} />)}
    </div>
    <div className="mt-4 border-t border-gray-200 pt-4"><ChatInput onSend={handleSend} offerId={offerId} /></div>
  </div>
}
