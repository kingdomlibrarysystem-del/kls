'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Download, Headphones, Loader2, Lock, LogIn, Maximize, Pause, Play, RotateCcw, RotateCw, Video } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { playableKind, youtubeId } from '@/lib/media-embed'
import { useAuth } from '@/contexts/auth-context'

interface ResourceMediaPlayerProps {
  resource: { id: string; title: string; price: number; audioUrl?: string | null; videoUrl?: string | null }
  isAuthenticated: boolean
  /** Where a signed-out visitor goes to sign in (should come back to this page). */
  signInHref: string
}

type Access = 'checking' | 'open' | 'locked'

/**
 * In-page player for an audio or video library resource — these titles have
 * nothing to "read", so the detail page plays them here instead of linking to
 * the reader. Same access rule as reading: signed-in members play free titles
 * straight away; a paid title plays once they have borrowed / reserved it
 * (or for staff) — resolved by the existing /api/resources/[id]/entitlement.
 * YouTube links play embedded; uploaded files use the native controls
 * (seek, speed, volume, fullscreen, background audio on phones).
 */
export function ResourceMediaPlayer({ resource, isAuthenticated, signInHref }: ResourceMediaPlayerProps) {
  const kind = playableKind(resource)
  // While the session is still loading, show a placeholder rather than flashing "Sign in" at a signed-in member.
  const { isLoading: authLoading } = useAuth()
  const needsCheck = isAuthenticated && resource.price > 0
  const [access, setAccess] = useState<Access>(needsCheck ? 'checking' : 'open')

  useEffect(() => {
    if (!needsCheck) return
    let alive = true
    fetch(`/api/resources/${resource.id}/entitlement`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive) setAccess(j?.data?.entitled ? 'open' : 'locked') })
      .catch(() => { if (alive) setAccess('locked') })
    return () => { alive = false }
  }, [needsCheck, resource.id])

  if (!kind) return null
  const url = (kind === 'video' ? resource.videoUrl : resource.audioUrl) ?? ''
  const yt = youtubeId(url)
  const Icon = kind === 'video' ? Video : Headphones
  const verb = kind === 'video' ? 'watch' : 'listen'

  let body: React.ReactNode
  if (authLoading && !isAuthenticated) {
    body = <Skeleton className={kind === 'video' ? 'aspect-video w-full rounded-lg' : 'h-14 w-full rounded-lg'} />
  } else if (!isAuthenticated) {
    body = (
      <Gate icon={LogIn} text={`Sign in to ${verb} to “${resource.title}”.`}>
        <Link href={signInHref} className={buttonVariants({ size: 'sm' })}>Sign in to {verb}</Link>
      </Gate>
    )
  } else if (access === 'checking') {
    body = <Skeleton className={kind === 'video' ? 'aspect-video w-full rounded-lg' : 'h-14 w-full rounded-lg'} />
  } else if (access === 'locked') {
    body = <Gate icon={Lock} text={`Borrow or reserve this title to ${verb} to the full recording.`} />
  } else if (yt) {
    body = (
      <div className={`relative overflow-hidden rounded-lg border border-border bg-black ${kind === 'video' ? 'aspect-video' : 'aspect-[16/5]'}`}>
        <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title={resource.title} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 size-full" />
      </div>
    )
  } else if (kind === 'video') {
    body = <VideoPlayer url={url} title={resource.title} />
  } else {
    body = <AudioWithAnimation url={url} title={resource.title} />
  }

  return (
    <section id="player" aria-label={kind === 'video' ? 'Watch' : 'Listen'} className="scroll-mt-24 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" aria-hidden /></span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{kind === 'video' ? 'Watch now' : 'Listen now'}</p>
          <p className="truncate text-sm font-medium text-foreground">{resource.title}</p>
        </div>
      </div>
      {body}
    </section>
  )
}

function Gate({ icon: Icon, text, children }: { icon: typeof Lock; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 p-4">
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <p className="min-w-0 flex-1 text-sm text-muted-foreground">{text}</p>
      {children}
    </div>
  )
}

/** Thin "now playing" bars next to the title: heights (%) and speeds (s). Decoration only. */
const EQ_BARS = Array.from({ length: 7 }, (_, i) => ({ height: 45 + ((i * 29) % 55), duration: 0.5 + ((i * 3) % 5) / 10 }))

const SPEEDS = [1, 1.25, 1.5, 2, 0.75]

/** "mm:ss" (or "h:mm:ss" for long recordings). */
function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  const m = Math.floor((seconds / 60) % 60)
  const h = Math.floor(seconds / 3600)
  return h ? `${h}:${m.toString().padStart(2, '0')}:${s}` : `${m}:${s}`
}

/** A link that saves the file instead of opening it: Cloudinary audio/video gets fl_attachment; other hosts use the download attribute. */
function downloadHref(url: string): string {
  return /res\.cloudinary\.com\/.+\/(video|image)\/upload\//.test(url) ? url.replace('/upload/', '/upload/fl_attachment/') : url
}

/** How far the browser has loaded around the play position (seconds). */
function bufferedEnd(media: HTMLMediaElement): number {
  const { buffered, currentTime } = media
  for (let i = 0; i < buffered.length; i++) {
    if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) return buffered.end(i)
  }
  return buffered.length ? buffered.end(buffered.length - 1) : 0
}

/**
 * Thin straight progress line, YouTube-style, in the site gold: light track,
 * loaded part a little lighter, played part gold, a round knob at the play
 * position. It thickens on hover; tap / drag to jump; arrow keys move 5 s.
 */
function ProgressLine({ current, duration, buffered, onSeek, className = '' }: { current: number; duration: number; buffered: number; onSeek: (seconds: number) => void; className?: string }) {
  const track = useRef<HTMLDivElement>(null)
  const pct = (n: number) => `${duration ? Math.min(100, (n / duration) * 100) : 0}%`
  const fromPointer = (clientX: number) => {
    const box = track.current?.getBoundingClientRect()
    if (box && duration) onSeek(Math.min(Math.max(0, (clientX - box.left) / box.width), 1) * duration)
  }
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Position"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(current)}
      aria-valuetext={`${clock(current)} of ${clock(duration)}`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); fromPointer(e.clientX) }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e.clientX) }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); onSeek(Math.min(duration, current + 5)) }
        if (e.key === 'ArrowLeft') { e.preventDefault(); onSeek(Math.max(0, current - 5)) }
      }}
      className={`group/line flex h-5 cursor-pointer touch-none items-center rounded outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${className}`}
    >
      <div ref={track} className="relative h-1 w-full rounded-full bg-white/20 transition-[height] duration-150 group-hover/line:h-1.5">
        <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: pct(buffered) }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: pct(current) }} />
        <div
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 scale-90 rounded-full bg-primary shadow-md ring-2 ring-white/30 transition-transform group-hover/line:scale-110"
          style={{ left: pct(current) }}
        />
      </div>
    </div>
  )
}

/**
 * True while play was asked for but the sound is not really moving forward:
 * the browser is waiting for data (slow or no internet, a part not loaded
 * yet). Uses the media events AND a once-a-second check that the time really
 * advanced, because some browsers send no "waiting" event when the network
 * drops. The animation runs only when this is false.
 */
function useStalled(media: React.RefObject<HTMLMediaElement | null>, playing: boolean) {
  const [stalled, setStalled] = useState(false)
  useEffect(() => {
    if (!playing) return
    let last = media.current?.currentTime ?? 0
    const id = setInterval(() => {
      const m = media.current
      if (!m) return
      const moved = m.currentTime !== last
      last = m.currentTime
      setStalled(!moved && !m.paused && !m.ended)
    }, 1000)
    return () => clearInterval(id)
  }, [media, playing])
  const events = {
    onWaiting: () => setStalled(true),
    onStalled: () => setStalled(true),
    onPlaying: () => setStalled(false),
    onCanPlay: () => setStalled(false),
    onSeeking: () => setStalled(true),
    onSeeked: () => setStalled(false),
  }
  // Paused or ended is never "loading".
  return { loading: playing && stalled, events }
}

/** Shared round control button on the dark players. */
const roundBtn = 'flex size-10 items-center justify-center rounded-full text-[#f6efe0]/85 transition hover:bg-white/10 hover:text-[#f6efe0]'

function DownloadButton({ url }: { url: string }) {
  return (
    <a href={downloadHref(url)} download target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:bg-primary/90">
      <Download className="size-4" /> Download
    </a>
  )
}

/**
 * Uploaded audio with the site's own player (no browser controls, so no
 * browser "Download" menu): big play/pause with pulsing rings, thin bars
 * that bounce only while it plays, a thin gold progress line, minutes
 * played / total, back / forward 15 s, speed, and our own Download button.
 */
function AudioWithAnimation({ url, title }: { url: string; title: string }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [failed, setFailed] = useState(false)
  const { loading, events } = useStalled(audio, playing)
  /** Animate only when the sound is really moving forward. */
  const moving = playing && !loading

  const toggle = () => {
    const a = audio.current
    if (!a) return
    if (a.paused) a.play().catch(() => {})
    else a.pause()
  }
  const seekTo = (seconds: number) => {
    const a = audio.current
    if (!a || !duration) return
    a.currentTime = Math.min(Math.max(0, seconds), duration)
    setCurrent(a.currentTime)
  }
  const nextSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]
    if (audio.current) audio.current.playbackRate = next
    setSpeed(next)
  }

  return (
    <div data-playing={moving} className="overflow-hidden rounded-xl bg-gradient-to-br from-[#0b2136] via-[#12304a] to-[#1a3d5c] p-4 text-[#f6efe0] sm:p-6">
      <div className="flex items-center gap-4 sm:gap-5">
        <button type="button" onClick={toggle} aria-label={playing ? `Pause ${title}` : `Play ${title}`} className="group relative flex size-16 shrink-0 items-center justify-center">
          <span aria-hidden className="kls-ring absolute inset-0 rounded-full border-2 border-primary" />
          <span aria-hidden className="kls-ring absolute inset-0 rounded-full border-2 border-primary [animation-delay:1.1s]" />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/30 transition-transform group-hover:scale-105 group-active:scale-95">
            {loading ? <Loader2 className="size-7 animate-spin" /> : playing ? <Pause className="size-7" fill="currentColor" /> : <Play className="ml-1 size-7" fill="currentColor" />}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{loading ? 'Loading…' : playing ? 'Now playing' : started ? 'Paused' : 'Tap to play'}</span>
            <span aria-hidden className="flex h-4 items-end gap-[3px]">
              {EQ_BARS.map((b, i) => (
                <span key={i} className="kls-eq-bar w-[3px] rounded-full bg-primary" style={{ height: `${b.height}%`, animationDuration: `${b.duration}s` }} />
              ))}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-semibold sm:text-base">{title}</p>
        </div>
      </div>

      <ProgressLine current={current} duration={duration} buffered={buffered} onSeek={seekTo} className="mt-5" />

      <div className="mt-2 flex flex-wrap items-center gap-1 sm:gap-2">
        <span className="mr-auto font-mono text-sm tabular-nums text-[#f6efe0]/90">
          {clock(current)} <span className="text-[#f6efe0]/50">/ {clock(duration)}</span>
        </span>
        <button type="button" onClick={() => seekTo(current - 15)} aria-label="Back 15 seconds" className={roundBtn}><RotateCcw className="size-[18px]" /></button>
        <button type="button" onClick={() => seekTo(current + 15)} aria-label="Forward 15 seconds" className={roundBtn}><RotateCw className="size-[18px]" /></button>
        <button type="button" onClick={nextSpeed} aria-label={`Speed ${speed}×, change`} className="h-9 min-w-12 rounded-full border border-[#f6efe0]/25 px-3 text-xs font-bold transition hover:bg-white/10">{speed}×</button>
        <DownloadButton url={url} />
      </div>
      {failed && <p className="mt-2 text-xs text-red-300">This recording could not be loaded. Try again later or use Download.</p>}

      {/* The sound itself — no browser controls (and so no browser download menu). */}
      <audio
        ref={audio}
        preload="metadata"
        src={url}
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => { setCurrent(e.currentTarget.currentTime); setBuffered(bufferedEnd(e.currentTarget)) }}
        onProgress={(e) => setBuffered(bufferedEnd(e.currentTarget))}
        {...events}
        onPlay={() => { setPlaying(true); setStarted(true); setFailed(false) }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => { setPlaying(false); setFailed(true) }}
        className="hidden"
      />
    </div>
  )
}

/**
 * Uploaded video with the same look as the audio player (YouTube-like):
 * tap the picture to play/pause, and a bottom bar with the thin gold
 * progress line, play/pause, minutes, speed, our Download button and full
 * screen. While playing, the bar hides after a moment without the mouse.
 */
function VideoPlayer({ url, title }: { url: string; title: string }) {
  const box = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [showBar, setShowBar] = useState(true)
  const [failed, setFailed] = useState(false)
  const { loading, events } = useStalled(video, playing)

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current) }, [])

  const wake = () => {
    setShowBar(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => { if (!video.current?.paused) setShowBar(false) }, 2500)
  }
  const toggle = () => {
    const v = video.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
    wake()
  }
  const seekTo = (seconds: number) => {
    const v = video.current
    if (!v || !duration) return
    v.currentTime = Math.min(Math.max(0, seconds), duration)
    setCurrent(v.currentTime)
    wake()
  }
  const nextSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]
    if (video.current) video.current.playbackRate = next
    setSpeed(next)
  }
  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else box.current?.requestFullscreen?.().catch(() => {})
  }

  return (
    <div ref={box} onMouseMove={wake} onTouchStart={wake} className="group/video relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={video}
        preload="metadata"
        playsInline
        src={url}
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        onClick={toggle}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => { setCurrent(e.currentTarget.currentTime); setBuffered(bufferedEnd(e.currentTarget)) }}
        onProgress={(e) => setBuffered(bufferedEnd(e.currentTarget))}
        {...events}
        onPlay={() => { setPlaying(true); setFailed(false); wake() }}
        onPause={() => { setPlaying(false); setShowBar(true) }}
        onEnded={() => { setPlaying(false); setShowBar(true) }}
        onError={() => { setPlaying(false); setFailed(true) }}
        className="size-full cursor-pointer object-contain"
      />

      {/* Loading (slow / no internet): a spinner instead of a frozen picture with no sign. */}
      {loading && (
        <span role="status" aria-label="Loading" className="pointer-events-none absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50">
          <Loader2 className="size-9 animate-spin text-primary" />
        </span>
      )}
      {/* Big play button in the middle while paused. */}
      {!playing && (
        <button type="button" onClick={toggle} aria-label={`Play ${title}`} className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition hover:scale-105">
          <Play className="ml-1 size-7" fill="currentColor" />
        </button>
      )}
      {failed && <p className="absolute inset-x-0 top-3 text-center text-xs text-red-300">This video could not be loaded. Try again later or use Download.</p>}

      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2 pt-10 text-[#f6efe0] transition-opacity duration-300 sm:px-4 ${showBar ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <ProgressLine current={current} duration={duration} buffered={buffered} onSeek={seekTo} />
        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className={roundBtn}>
            {playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5" fill="currentColor" />}
          </button>
          <span className="mr-auto font-mono text-xs tabular-nums sm:text-sm">
            {clock(current)} <span className="text-[#f6efe0]/60">/ {clock(duration)}</span>
          </span>
          <button type="button" onClick={nextSpeed} aria-label={`Speed ${speed}×, change`} className="h-8 min-w-11 rounded-full border border-[#f6efe0]/30 px-2.5 text-xs font-bold transition hover:bg-white/10">{speed}×</button>
          <DownloadButton url={url} />
          <button type="button" onClick={fullscreen} aria-label="Full screen" className={roundBtn}><Maximize className="size-5" /></button>
        </div>
      </div>
    </div>
  )
}
