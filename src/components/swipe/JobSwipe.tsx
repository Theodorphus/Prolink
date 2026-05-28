'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { saveJob as saveJobToDb } from '@/lib/actions/saved-jobs'
import JobSwipeCard, { type SwipeJob } from './JobSwipeCard'

const SAVED_KEY = 'prolink:saved-jobs'
const THRESHOLD = 110 // px dragged before a swipe counts
const TAP_SLOP = 8 // px of movement still treated as a tap, not a drag

type Dir = 'left' | 'right'

function saveJobLocal(id: string) {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(SAVED_KEY)
    const ids: string[] = raw ? JSON.parse(raw) : []
    if (!ids.includes(id)) {
      ids.push(id)
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(ids))
    }
  } catch {
    /* localStorage unavailable — ignore */
  }
}

export default function JobSwipe({ jobs, isAuthed }: { jobs: SwipeJob[]; isAuthed: boolean }) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [leaving, setLeaving] = useState<Dir | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [entering, setEntering] = useState(false)

  const startRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(false)
  const draggingRef = useRef(false)

  const current = jobs[index]
  const next = jobs[index + 1]
  const done = index >= jobs.length

  const advance = useCallback(
    (dir: Dir) => {
      // guard against rapid double-trigger while a card is still flying off
      if (leaving) return
      if (current && dir === 'right') {
        saveJobLocal(current.id)
        if (isAuthed) void saveJobToDb(current.id)
        setSavedCount((c) => c + 1)
      }
      setLeaving(dir)
      // wait for the fly-off animation, then promote the next card
      window.setTimeout(() => {
        setLeaving(null)
        setDrag({ x: 0, y: 0 })
        setIndex((i) => i + 1)
        // play a brief "pop in" on the freshly promoted card
        setEntering(true)
        window.requestAnimationFrame(() => setEntering(false))
      }, 260)
    },
    [current, isAuthed, leaving]
  )

  const openCurrent = useCallback(() => {
    if (current) router.push(`/jobs/${current.id}`)
  }, [current, router])

  const onPointerDown = (e: React.PointerEvent) => {
    if (leaving) return
    draggingRef.current = true
    movedRef.current = false
    startRef.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !startRef.current) return
    const x = e.clientX - startRef.current.x
    const y = e.clientY - startRef.current.y
    if (Math.abs(x) > TAP_SLOP || Math.abs(y) > TAP_SLOP) movedRef.current = true
    setDrag({ x, y })
  }

  const onPointerUp = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    startRef.current = null
    if (drag.x > THRESHOLD) advance('right')
    else if (drag.x < -THRESHOLD) advance('left')
    else if (!movedRef.current) openCurrent() // a tap (no real drag) → open job
    else setDrag({ x: 0, y: 0 }) // snap back
  }

  // transform for the active card
  const flyX = leaving === 'right' ? 700 : leaving === 'left' ? -700 : drag.x
  const flyY = leaving ? drag.y - 60 : drag.y
  const rotate = flyX / 16
  const activeOpacity = leaving ? 0 : 1
  const likeOpacity = Math.min(Math.max(drag.x / THRESHOLD, 0), 1)
  const nopeOpacity = Math.min(Math.max(-drag.x / THRESHOLD, 0), 1)
  const isAnimating = leaving !== null || !draggingRef.current

  // how far the current card is dragged, 0..1 — used to bring the next card forward
  const dragProgress = Math.min(Math.abs(drag.x) / THRESHOLD, 1)
  const nextScale = 0.94 + dragProgress * 0.06
  const nextOpacity = 0.6 + dragProgress * 0.4

  if (done) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex h-[500px] w-full flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-neutral-300 bg-white p-8">
          <span className="text-5xl">🎉</span>
          <h2 className="text-xl font-bold text-neutral-900">Inga fler jobb just nu</h2>
          <p className="text-sm text-neutral-500">
            Du sparade {savedCount} jobb. Kom tillbaka snart för fler.
          </p>
          <div className="mt-2 flex flex-col gap-2">
            <Link
              href="/saved"
              className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
            >
              Visa sparade jobb
            </Link>
            <Link
              href="/jobs"
              className="px-6 py-3 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
            >
              Bläddra bland alla jobb
            </Link>
            <button
              onClick={() => {
                setIndex(0)
                setSavedCount(0)
              }}
              className="px-6 py-3 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
            >
              Börja om
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 sm:gap-7">
      <div className="relative h-[68vh] max-h-[520px] min-h-[420px] w-full select-none">
        {/* next card peeks behind and scales up as the top card is dragged */}
        {next && (
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${nextScale})`,
              opacity: nextOpacity,
              transition: draggingRef.current ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out',
            }}
          >
            <JobSwipeCard job={next} />
          </div>
        )}

        {/* active card */}
        {current && (
          <div
            className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              transform: `translate(${flyX}px, ${flyY}px) rotate(${rotate}deg) scale(${entering ? 0.96 : 1})`,
              opacity: activeOpacity,
              transition: isAnimating
                ? 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease-out'
                : 'none',
            }}
          >
            {/* JA / NEJ stamps */}
            <div
              className="pointer-events-none absolute left-5 top-7 z-10 -rotate-12 rounded-xl border-4 border-emerald-500 px-4 py-1.5 text-2xl font-black uppercase tracking-wider text-emerald-500"
              style={{ opacity: likeOpacity }}
            >
              Ja
            </div>
            <div
              className="pointer-events-none absolute right-5 top-7 z-10 rotate-12 rounded-xl border-4 border-rose-500 px-4 py-1.5 text-2xl font-black uppercase tracking-wider text-rose-500"
              style={{ opacity: nopeOpacity }}
            >
              Nej
            </div>

            <JobSwipeCard job={current} />
          </div>
        )}
      </div>

      {/* action buttons */}
      <div className="flex items-center gap-5">
        <button
          aria-label="Hoppa över"
          onClick={() => advance('left')}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-white text-rose-500 shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <Link
          href={current ? `/jobs/${current.id}` : '/jobs'}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-blue-600 shadow-md transition-transform hover:scale-105 active:scale-95"
          aria-label="Visa jobbet"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Link>

        <button
          aria-label="Intresserad"
          onClick={() => advance('right')}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-white text-emerald-500 shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        </button>
      </div>

      <p className="text-xs font-medium text-neutral-400">
        Dra åt höger för intresserad · vänster för att hoppa över
      </p>
    </div>
  )
}
