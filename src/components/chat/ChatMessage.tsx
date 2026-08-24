'use client'

import { useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { MessageWithSender } from '@/types/database'

interface ChatMessageProps {
  message: MessageWithSender
  isOwn: boolean
}

function safeLegacyAttachmentUrl(value: string | null): string | null {
  if (!value || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null
  try {
    const url = new URL(value)
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
    return url.protocol === 'https:'
      && url.host === supabaseUrl.host
      && url.pathname.includes('/storage/v1/object/')
      ? url.toString()
      : null
  } catch {
    return null
  }
}

export default function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const [attachmentError, setAttachmentError] = useState('')
  const legacyAttachmentUrl = safeLegacyAttachmentUrl(message.attachment_url)

  async function openPrivateAttachment() {
    if (!message.attachment_path) return
    setAttachmentError('')
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('attachments')
      .createSignedUrl(message.attachment_path, 5 * 60)

    if (error || !data) {
      setAttachmentError('Bilagan kunde inte öppnas.')
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700 text-sm shrink-0">
        {message.sender?.name?.[0]?.toUpperCase()}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isOwn && (
          <p className="text-xs text-gray-400 ml-1">{message.sender?.name}</p>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>

          {message.attachment_path && (
            <button
              type="button"
              onClick={openPrivateAttachment}
              className={`mt-2 flex items-center gap-1.5 text-xs underline ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Bilaga
            </button>
          )}

          {!message.attachment_path && legacyAttachmentUrl && (
            <a
              href={legacyAttachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 flex items-center gap-1.5 text-xs underline ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Bilaga
            </a>
          )}
          {attachmentError && <p className="mt-1 text-xs text-red-200">{attachmentError}</p>}
        </div>
        <p className="text-xs text-gray-400 mx-1">{formatDateTime(message.created_at)}</p>
      </div>
    </div>
  )
}
