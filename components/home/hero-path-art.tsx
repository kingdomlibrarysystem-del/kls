import { BookOpen, GraduationCap, Play, Award, PenLine } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { cn } from '@/lib/utils'

/**
 * Small decorative image clusters for the top-right corner of the hero's
 * three "path" cards. Each card has its own arrangement:
 *   - Library:    real book covers fanned out like a hand of cards;
 *   - E-Learning: a diagonal cascade of lesson/video tiles with a play badge;
 *   - Publishing: stacked manuscript pages with a seal.
 * Purely decorative (aria-hidden, pointer-events-none) and sized to stay in
 * the corner — the card's text keeps the rest of the space. They react to
 * hover on the card (`group`).
 */

const LOCAL_COVERS = ['/images/book-A.jpg', '/images/book-C.jpg', '/images/book-B.jpg']

/** Fills `images` up to `count` with the bundled covers so the art never looks sparse. */
function padded(images: string[], count: number): string[] {
  const out = images.filter(Boolean).slice(0, count)
  for (let i = 0; out.length < count; i++) out.push(LOCAL_COVERS[i % LOCAL_COVERS.length])
  return out
}

function Tile({ src, sizes, fallback, className }: { src: string; sizes: string; fallback: React.ReactNode; className?: string }) {
  return (
    <div className={cn('absolute overflow-hidden bg-muted shadow-md ring-1 ring-black/10 dark:ring-white/15', className)}>
      <RemoteImage src={src} alt="" fill sizes={sizes} className="object-cover" fallback={<div className="flex size-full items-center justify-center bg-primary/15 text-primary">{fallback}</div>} />
    </div>
  )
}

/** Library: four covers fanned from a shared bottom pivot; they spread a little on hover. */
export function LibraryArt({ covers }: { covers: string[] }) {
  const fan = [
    'left-[4px] -rotate-[18deg] group-hover:-rotate-[24deg]',
    'left-[26px] -rotate-[6deg] group-hover:-rotate-[9deg]',
    'left-[48px] rotate-[6deg] group-hover:rotate-[9deg]',
    'left-[70px] rotate-[18deg] group-hover:rotate-[24deg]',
  ]
  return (
    <div aria-hidden className="pointer-events-none absolute right-4 top-4 h-[84px] w-[124px]">
      {padded(covers, 4).map((src, i) => (
        <Tile
          key={i}
          src={src}
          sizes="48px"
          fallback={<BookOpen className="size-4" />}
          className={cn('bottom-0 h-[70px] w-[48px] origin-bottom rounded-md transition-transform duration-300', fan[i])}
        />
      ))}
    </div>
  )
}

/** E-Learning: three landscape lesson tiles stepping down diagonally, front one with a play button and a progress bar. */
export function ELearningArt({ images }: { images: string[] }) {
  const steps = [
    'right-[44px] top-0 opacity-70 group-hover:-translate-x-1 group-hover:-translate-y-1',
    'right-[22px] top-[14px] opacity-90',
    'right-0 top-[28px] group-hover:translate-x-1 group-hover:translate-y-1',
  ]
  const tiles = padded(images, 3)
  return (
    <div aria-hidden className="pointer-events-none absolute right-4 top-4 h-[84px] w-[128px]">
      {tiles.map((src, i) => (
        <Tile
          key={i}
          src={src}
          sizes="84px"
          fallback={<GraduationCap className="size-4" />}
          className={cn('h-[52px] w-[84px] rounded-lg transition-transform duration-300', steps[i])}
        />
      ))}
      {/* Play badge + progress bar on the front tile */}
      <span className="absolute right-[30px] top-[42px] flex size-6 items-center justify-center rounded-full bg-card text-info shadow-md ring-1 ring-black/10 transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1">
        <Play className="size-3 fill-current" />
      </span>
      <span className="absolute right-[6px] top-[72px] h-1 w-[72px] overflow-hidden rounded-full bg-black/25 transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1">
        <span className="block h-full w-2/3 rounded-full bg-info" />
      </span>
    </div>
  )
}

/** One manuscript page drawn with CSS: a heading rule and a few text lines. */
function Sheet({ className, withCover }: { className?: string; withCover?: string }) {
  return (
    <div className={cn('absolute h-[74px] w-[56px] rounded-md border border-border bg-card p-1.5 shadow-md transition-transform duration-300', className)}>
      {withCover ? (
        <div className="relative mb-1 h-[26px] w-full overflow-hidden rounded-sm bg-muted">
          <RemoteImage src={withCover} alt="" fill sizes="56px" className="object-cover" fallback={<div className="size-full bg-success/20" />} />
        </div>
      ) : (
        <div className="mb-1.5 h-1.5 w-2/3 rounded-full bg-success/50" />
      )}
      <div className="space-y-1">
        <div className="h-1 w-full rounded-full bg-muted-foreground/25" />
        <div className="h-1 w-5/6 rounded-full bg-muted-foreground/25" />
        <div className="h-1 w-full rounded-full bg-muted-foreground/25" />
        {!withCover && <div className="h-1 w-3/5 rounded-full bg-muted-foreground/25" />}
      </div>
    </div>
  )
}

/** Publishing & Research: three stacked manuscript pages (the top one with a cover image), a pen and a "published" seal. */
export function PublishingArt({ cover }: { cover: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute right-4 top-4 h-[88px] w-[120px]">
      <Sheet className="right-[52px] top-[8px] -rotate-[10deg] group-hover:-rotate-[14deg]" />
      <Sheet className="right-[30px] top-[4px] -rotate-[3deg]" />
      <Sheet withCover={cover} className="right-[6px] top-[6px] rotate-[6deg] group-hover:rotate-[9deg]" />
      <span className="absolute right-0 top-[58px] flex size-7 items-center justify-center rounded-full bg-success text-white shadow-md ring-2 ring-card">
        <Award className="size-3.5" />
      </span>
      <span className="absolute left-0 top-[52px] flex size-6 items-center justify-center rounded-full bg-card text-success shadow-md ring-1 ring-black/10">
        <PenLine className="size-3" />
      </span>
    </div>
  )
}
