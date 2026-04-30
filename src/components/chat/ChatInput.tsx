'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface ChatInputProps {
  onSend: (content: string, attachmentUrl?: string) => Promise<void>
  offerId: string
}

export default function ChatInput({ onSend, offerId }: ChatInputProps) {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File): Promise<string> {
    const supabase = createClient()
    const path = `${offerId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file)
    if (uploadError) throw uploadError

    // Attachments bucket is private — use a signed URL (1 year expiry)
    const { data, error: signError } = await supabase.storage
      .from('attachments')
      .createSignedUrl(path, 60 * 60 * 24 * 365)
    if (signError || !data) throw new Error('Kunde inte generera länk för bilagan')
    return data.signedUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() && !fileRef.current?.files?.[0]) return

    setSending(true)
    setError('')

    try {
      let attachmentUrl: string | undefined
      const file = fileRef.current?.files?.[0]

      if (file) {
        setUploading(true)
        attachmentUrl = await uploadFile(file)
        setUploading(false)
        if (fileRef.current) fileRef.current.value = ''
      }

      const content = text.trim()
      await onSend(content, attachmentUrl)
      setText('')
    } catch (err: any) {
      setError(err.message ?? 'Kunde inte skicka meddelandet')
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Skriv ett meddelande... (Enter för att skicka, Shift+Enter för ny rad)"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Bifoga fil"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <Button type="submit" size="sm" loading={sending || uploading} disabled={!text.trim() && !fileRef.current?.files?.[0]}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
      <input ref={fileRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
      {uploading && <p className="text-xs text-blue-500">Laddar upp fil...</p>}
    </form>
  )
}
