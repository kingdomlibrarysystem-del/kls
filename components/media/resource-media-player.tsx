'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Headphones, Lock, LogIn, Video } from 'lucide-react'
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
    body = (
      <video controls preload="metadata" playsInline src={url} className="aspect-video w-full rounded-lg border border-border bg-black">
        Your browser cannot play this video. <a href={url} className="underline">Open the file</a>.
      </video>
    )
  } else {
    body = (
      <audio controls preload="metadata" src={url} className="w-full">
        Your browser cannot play this audio. <a href={url} className="underline">Open the file</a>.
      </audio>
    )
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
