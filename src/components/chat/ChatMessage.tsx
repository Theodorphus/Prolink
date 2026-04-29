import { formatDateTime } from '@/lib/utils'
import type { MessageWithSender } from '@/types/database'

interface ChatMessageProps {
  message: MessageWithSender
  isOwn: boolean
}

export default function ChatMessage({ message, isOwn }: ChatMessageProps) {
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

          {message.attachment_url && (
            <a
              href={message.attachment_url}
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
        </div>
        <p className="text-xs text-gray-400 mx-1">{formatDateTime(message.created_at)}</p>
      </div>
    </div>
  )
}
