'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

interface ChatInputProps {
  onSend: (content: string, attachmentPath?: string, requestId?: string) => Promise<void>
  offerId: string
}

export default function ChatInput({ onSend, offerId }: ChatInputProps) {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const uploaded = useRef<string | undefined>(undefined)
  const busy = useRef(false)
  const requestId = useRef<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File): Promise<string> {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) throw new Error('Filtypen är inte tillåten')
    if (file.size > 10 * 1024 * 1024) throw new Error('Bilagan får max vara 10 MB')

    const supabase = createClient()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120)
    const path = `${offerId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`
    const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file)
    if (uploadError) throw uploadError
    return path
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (busy.current || (!text.trim() && !file)) return
    busy.current = true
    requestId.current ??= crypto.randomUUID()

    setSending(true)
    setError('')
    let uploadedPath: string | undefined

    try {

      if (file) {
        setUploading(true)
        uploadedPath = uploaded.current ?? await uploadFile(file)
        uploaded.current = uploadedPath
        setUploading(false)

      }

      const content = text.trim()
      await onSend(content, uploadedPath, requestId.current)
      setText('')
      setFile(null)
      uploaded.current = undefined
      requestId.current = null
      if (fileRef.current) fileRef.current.value = ''
    } catch (submitError) {

      setError(submitError instanceof Error ? submitError.message : 'Kunde inte skicka meddelandet')
    } finally {
      busy.current = false
      setSending(false)
      setUploading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      e.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            aria-label="Meddelande"
            disabled={sending}
            maxLength={5000}
            value={text}
            onChange={e => { setText(e.target.value); requestId.current = null }}
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
            disabled={sending || uploading}
            className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Bifoga fil"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <Button aria-label="Skicka meddelande" type="submit" size="sm" loading={sending || uploading} disabled={!text.trim() && !file}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
      {file && <p className="text-sm">{file.name} <button type="button" disabled={sending} onClick={() => { setFile(null); uploaded.current = undefined; requestId.current = null; if (fileRef.current) fileRef.current.value = '' }}>Ta bort bilaga</button></p>}
      <input disabled={sending} onChange={e => { setFile(e.target.files?.[0] ?? null); uploaded.current = undefined; requestId.current = null }} ref={fileRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
      {uploading && <p className="text-xs text-blue-500">Laddar upp fil...</p>}
    </form>
  )
}
