'use client'

import { useEffect, useRef } from 'react'

const FADE_S = 1.2 // seconds of crossfade overlap

export default function HeroVideo({ src }: { src: string }) {
  const v1 = useRef<HTMLVideoElement>(null)
  const v2 = useRef<HTMLVideoElement>(null)
  const active = useRef<0 | 1>(0)
  const fading = useRef(false)

  useEffect(() => {
    const videos = [v1.current, v2.current] as HTMLVideoElement[]
    if (!videos[0] || !videos[1]) return

    function crossfade() {
      if (fading.current) return
      fading.current = true

      const cur = videos[active.current]
      const nxt = videos[1 - active.current as 0 | 1]

      // Prep next video silently
      nxt.currentTime = 0
      nxt.style.transition = 'none'
      nxt.style.opacity = '0'
      nxt.play().catch(() => {})

      // Trigger crossfade on next frame so nxt has started
      requestAnimationFrame(() => {
        cur.style.transition = `opacity ${FADE_S}s ease-in-out`
        nxt.style.transition = `opacity ${FADE_S}s ease-in-out`
        cur.style.opacity = '0'
        nxt.style.opacity = '1'
      })

      setTimeout(() => {
        cur.pause()
        cur.style.transition = 'none'
        active.current = (1 - active.current) as 0 | 1
        fading.current = false
      }, FADE_S * 1000)
    }

    function onTimeUpdate(this: HTMLVideoElement) {
      // Only react to the currently active video
      if (this !== videos[active.current]) return
      if (!this.duration) return
      if (this.duration - this.currentTime <= FADE_S) {
        crossfade()
      }
    }

    videos[0].addEventListener('timeupdate', onTimeUpdate)
    videos[1].addEventListener('timeupdate', onTimeUpdate)

    return () => {
      videos[0].removeEventListener('timeupdate', onTimeUpdate)
      videos[1].removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [])

  return (
    <>
      <video
        ref={v1}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 1 }}
      >
        <source src={src} type="video/mp4" />
      </video>
      <video
        ref={v2}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0 }}
      >
        <source src={src} type="video/mp4" />
      </video>
    </>
  )
}
