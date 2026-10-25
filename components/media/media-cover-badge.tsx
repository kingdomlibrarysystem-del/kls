import { Headphones, Play, Video } from 'lucide-react'
import { playableKind } from '@/lib/media-embed'

interface MediaCoverBadgeProps {
  resource: { audioUrl?: string | null; videoUrl?: string | null }
  /** `sm` for grid cards, `lg` for the detail page cover. */
  size?: 'sm' | 'lg'
  /** Corner for the chip — 'bottom' when the card already has its own top-left badge. */
  chip?: 'top' | 'bottom'
}

/**
 * Overlay for a cover image that tells readers at a glance the title is a
 * recording they can play, not a book to read: an "Audio" / "Video" chip in
 * the corner plus a play disc in the middle. Renders nothing for books.
 * The parent must be `position: relative`. Uses fixed dark-on-image colours
 * on purpose: it sits on top of an arbitrary cover photo in both themes.
 */
export function MediaCoverBadge({ resource, size = 'sm', chip = 'top' }: MediaCoverBadgeProps) {
  const kind = playableKind(resource)
  if (!kind) return null
  const Icon = kind === 'video' ? Video : Headphones
  const lg = size === 'lg'
  return (
    <>
      <span
        className={`pointer-events-none absolute left-2 ${chip === 'top' ? 'top-2' : 'bottom-2'} z-[1] inline-flex items-center gap-1 rounded-full bg-black/70 font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm ${lg ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'}`}
      >
        <Icon className={lg ? 'size-3.5' : 'size-3'} aria-hidden />
        {kind === 'video' ? 'Video' : 'Audio'}
      </span>
      <span
        aria-label={kind === 'video' ? 'Video — can be watched' : 'Audio — can be listened to'}
        className={`pointer-events-none absolute left-1/2 top-1/2 z-[1] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-lg ring-2 ring-white/70 backdrop-blur-sm ${lg ? 'size-16' : 'size-12'}`}
      >
        <Play className={`${lg ? 'size-7' : 'size-5'} translate-x-0.5`} fill="currentColor" aria-hidden />
      </span>
    </>
  )
}
