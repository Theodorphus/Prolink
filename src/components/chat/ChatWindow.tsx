'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import type { MessageWithSender } from '@/types/database'

interface ChatWindowProps {
  offerId: string
  currentUserId: string
  initialMessages: MessageWithSender[]
}

export default function ChatWindow({ offerId, currentUserId, initialMessages }: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${offerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `offer_id=eq.${offerId}` },
        async (payload) => {
          // Fetch the full message with sender info
          const { data } = await supabase
            .from('messages')
            .select('*, sender:users(id, name, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === data.id)) return prev
              return [...prev, data as MessageWithSender]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [offerId]) // supabase is stable via useRef

  const handleSend = useCallback(async (content: string, attachmentUrl?: string) => {
    const res = await fetch(`/api/messages/${offerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, attachment_url: attachmentUrl }),
    })
    // Realtime will pick up the new message — no need to manually add
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error)
    }
  }, [offerId])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">
            Inget skrivet än — starta konversationen!
          </p>
        )}
        {messages.map(msg => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === currentUserId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <ChatInput onSend={handleSend} offerId={offerId} />
      </div>
    </div>
  )
}
