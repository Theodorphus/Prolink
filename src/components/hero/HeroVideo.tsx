'use client'

import { useEffect, useRef } from 'react'

const FADE_S = 2.0    // crossfade duration in seconds
const TRIGGER_S = 2.2 // start fade this many seconds before end
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

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

      // Reset and pre-buffer next video
      nxt.currentTime = 0
      nxt.style.transition = 'none'
      nxt.style.opacity = '0'
      nxt.play().catch(() => {})

      // Give next video 3 frames to decode first frame before fading
      let frame = 0
      function waitAndFade() {
        if (++frame < 3) { requestAnimationFrame(waitAndFade); return }
        cur.style.transition = `opacity ${FADE_S}s ${EASING}`
        nxt.style.transition = `opacity ${FADE_S}s ${EASING}`
        cur.style.opacity = '0'
        nxt.style.opacity = '1'
      }
      requestAnimationFrame(waitAndFade)

      setTimeout(() => {
        cur.pause()
        cur.currentTime = 0
        cur.style.transition = 'none'
        active.current = (1 - active.current) as 0 | 1
        fading.current = false
      }, FADE_S * 1000 + 100)
    }

    function onTimeUpdate(this: HTMLVideoElement) {
      if (this !== videos[active.current]) return
      if (!this.duration) return
      if (this.duration - this.currentTime <= TRIGGER_S) {
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
        preload="auto"
        disablePictureInPicture
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 1, willChange: 'opacity' }}
      >
        <source src={src} type="video/mp4" />
      </video>
      <video
        ref={v2}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0, willChange: 'opacity' }}
      >
        <source src={src} type="video/mp4" />
      </video>
    </>
  )
}
